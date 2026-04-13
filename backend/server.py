from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import gspread
from google.oauth2 import service_account
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Google Sheets Configuration
SPREADSHEET_ID = "19FhGR3g85eAdaJoSVlayapX_XOd44BR152EMGNRNuI4"

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Cache for Google Sheets data
sheets_cache = {
    "data": {},
    "last_updated": None,
    "ttl_seconds": 300  # 5 minute cache
}

# ============== Models ==============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BracketPrediction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    prediction_id: str = Field(default_factory=lambda: f"pred_{uuid.uuid4().hex[:12]}")
    user_id: str
    tournament_id: str
    predictions: Dict[str, Any]  # {matchup_id: winner_team}
    score: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BracketPredictionCreate(BaseModel):
    tournament_id: str
    predictions: Dict[str, Any]

class Tournament(BaseModel):
    model_config = ConfigDict(extra="ignore")
    tournament_id: str = Field(default_factory=lambda: f"tourn_{uuid.uuid4().hex[:12]}")
    name: str
    season: int
    tournament_type: str  # "division_a", "division_b", "division_c", "mega"
    status: str = "upcoming"  # upcoming, active, completed
    bracket_data: Dict[str, Any] = {}
    results: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== Helper Functions ==============

async def get_current_user(request: Request) -> Optional[User]:
    """Get user from session token in cookie or Authorization header"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)

def require_auth(request: Request):
    """Dependency to require authentication"""
    async def _require_auth():
        user = await get_current_user(request)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        return user
    return _require_auth

def parse_sheet_data(headers: List[str], rows: List[List]) -> List[Dict]:
    """Parse sheet rows into list of dictionaries"""
    result = []
    for row in rows:
        item = {}
        for i, header in enumerate(headers):
            if header:
                value = row[i] if i < len(row) else ""
                # Try to convert to number if possible
                if value and isinstance(value, str):
                    try:
                        if '.' in value or '%' in value:
                            value = float(value.replace('%', '').strip())
                        else:
                            value = int(value)
                    except (ValueError, AttributeError):
                        pass
                item[header.strip()] = value
        result.append(item)
    return result

async def fetch_google_sheets_data():
    """Fetch all data from Google Sheets using public access"""
    global sheets_cache
    
    # Check cache
    if sheets_cache["last_updated"]:
        cache_age = (datetime.now(timezone.utc) - sheets_cache["last_updated"]).total_seconds()
        if cache_age < sheets_cache["ttl_seconds"]:
            return sheets_cache["data"]
    
    try:
        # For public sheets, we can use the CSV export method
        base_url = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/gviz/tq?tqx=out:json"
        
        data = {}
        
        # Known sheet names based on user description
        sheet_configs = [
            {"name": "History", "gid": "0"},
            {"name": "All Time Team Ranking", "gid": "1"},
        ]
        
        # Add season sheets (1-5 based on current season being 5)
        for season in range(1, 6):
            sheet_configs.append({"name": f"Season {season} Rankings", "gid": str(100 + season)})
            for div in ["A", "B", "C"]:
                sheet_configs.append({"name": f"Season {season} ({div} Division)", "gid": str(200 + season * 10 + ord(div))})
        
        async with httpx.AsyncClient(timeout=30.0) as client_http:
            for config in sheet_configs:
                try:
                    sheet_name = config["name"]
                    url = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet={sheet_name.replace(' ', '%20')}"
                    response = await client_http.get(url)
                    
                    if response.status_code == 200:
                        # Parse Google Visualization API response
                        text = response.text
                        # Remove the callback wrapper
                        if text.startswith("/*O_o*/"):
                            text = text[47:-2]  # Remove wrapper
                        elif "google.visualization.Query.setResponse" in text:
                            start = text.index("{")
                            end = text.rindex("}") + 1
                            text = text[start:end]
                        
                        json_data = json.loads(text)
                        
                        if "table" in json_data:
                            table = json_data["table"]
                            cols = [col.get("label", f"col_{i}") for i, col in enumerate(table.get("cols", []))]
                            rows = []
                            for row in table.get("rows", []):
                                row_data = []
                                for cell in row.get("c", []):
                                    if cell is None:
                                        row_data.append("")
                                    else:
                                        row_data.append(cell.get("v", cell.get("f", "")))
                                rows.append(row_data)
                            
                            if cols and rows:
                                data[sheet_name] = parse_sheet_data(cols, rows)
                            else:
                                data[sheet_name] = []
                        else:
                            data[sheet_name] = []
                except Exception as e:
                    logger.warning(f"Failed to fetch sheet {config['name']}: {e}")
                    data[config["name"]] = []
        
        sheets_cache["data"] = data
        sheets_cache["last_updated"] = datetime.now(timezone.utc)
        
        return data
    except Exception as e:
        logger.error(f"Error fetching Google Sheets data: {e}")
        if sheets_cache["data"]:
            return sheets_cache["data"]
        raise HTTPException(status_code=500, detail="Failed to fetch data from Google Sheets")

# ============== Auth Routes ==============

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token via Emergent Auth"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client_http:
        try:
            auth_response = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    email = auth_data.get("email")
    name = auth_data.get("name", email.split("@")[0] if email else "User")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture
    }

@api_router.get("/auth/me")
async def get_current_user_route(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user and clear session"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============== Data Routes ==============

@api_router.get("/")
async def root():
    return {"message": "NCAA Simulation API", "version": "1.0.0"}

@api_router.get("/sheets/all")
async def get_all_sheets_data():
    """Get all available sheets data"""
    data = await fetch_google_sheets_data()
    return {
        "sheets": list(data.keys()),
        "data": data,
        "last_updated": sheets_cache["last_updated"].isoformat() if sheets_cache["last_updated"] else None
    }

@api_router.get("/sheets/{sheet_name}")
async def get_sheet_data(sheet_name: str):
    """Get data from a specific sheet"""
    data = await fetch_google_sheets_data()
    
    # URL decode and normalize sheet name
    sheet_name = sheet_name.replace("%20", " ")
    
    if sheet_name not in data:
        raise HTTPException(status_code=404, detail=f"Sheet '{sheet_name}' not found")
    
    return {"sheet_name": sheet_name, "data": data[sheet_name]}

@api_router.get("/history")
async def get_history():
    """Get championship history - restructured from wide to long format"""
    data = await fetch_google_sheets_data()
    raw = data.get("History", [])
    
    # History sheet has: Season, A Division Champion, B Division Champion, C Division Champion, 
    # Points For, Points Against, Win Margin, Pre-Tourney Div. Rank, Seed, Runner-Up
    # We restructure to show each championship separately
    history = []
    for row in raw:
        season = row.get("Season", "")
        if not season:
            continue
        
        # Each row represents one season's championship game info
        history.append({
            "season": season,
            "a_champion": row.get("A Division Champion", ""),
            "b_champion": row.get("B Division Champion", ""),
            "c_champion": row.get("C Division Champion", ""),
            "points_for": row.get("Points For", ""),
            "points_against": row.get("Points Against", ""),
            "win_margin": row.get("Win Margin", ""),
            "pre_tourney_rank": row.get("Pre-Tourney Div. Rank", ""),
            "seed": row.get("Seed", ""),
            "runner_up": row.get("Runner-Up", "")
        })
    
    return {"history": history}

@api_router.get("/all-time-rankings")
async def get_all_time_rankings():
    """Get all-time team rankings with normalized field names"""
    data = await fetch_google_sheets_data()
    raw = data.get("All Time Team Ranking", [])
    
    rankings = []
    for row in raw:
        team = row.get("Team", "")
        if not team:
            continue
        
        # Division number to letter mapping
        current_div_num = row.get("Current Div.", "")
        highest_div_num = row.get("Highest Div.", "")
        lowest_div_num = row.get("Lowest Div.", "")
        
        def div_num_to_letter(n):
            try:
                n = int(float(n))
                return {3: "A", 2: "B", 1: "C"}.get(n, str(n))
            except:
                return str(n)
        
        win_rate = row.get("Win Rate", 0)
        if isinstance(win_rate, float) and win_rate <= 1:
            win_rate = f"{win_rate*100:.1f}%"
        
        rankings.append({
            "rank": row.get("Rank", ""),
            "team": team,
            "wins": row.get("Wins", 0),
            "losses": row.get("Losses", 0),
            "win_rate": win_rate,
            "ppg": round(row.get("PPG", 0), 1) if isinstance(row.get("PPG", 0), float) else row.get("PPG", 0),
            "papg": round(row.get("PAPG", 0), 1) if isinstance(row.get("PAPG", 0), float) else row.get("PAPG", 0),
            "pdpg": round(row.get("PDPG", 0), 1) if isinstance(row.get("PDPG", 0), float) else row.get("PDPG", 0),
            "points_for": row.get("Points For", 0),
            "points_against": row.get("Points Against", 0),
            "point_diff": row.get("Point Dif.", 0),
            "rank_ups": row.get("Rank Ups", 0),
            "rank_downs": row.get("Rank Downs", 0),
            "highest_div": div_num_to_letter(highest_div_num),
            "lowest_div": div_num_to_letter(lowest_div_num),
            "current_div": div_num_to_letter(current_div_num),
            "movement": row.get("Movement from Last Season", 0),
            "a_champs": row.get("# of AD Champs", 0),
            "b_champs": row.get("# of BD Champs", 0),
            "c_champs": row.get("# of CD Champs", 0),
        })
    
    return {"rankings": rankings}

@api_router.get("/seasons")
async def get_seasons():
    """Get list of available seasons"""
    data = await fetch_google_sheets_data()
    seasons = []
    for sheet_name in data.keys():
        if sheet_name.startswith("Season ") and "Rankings" in sheet_name:
            try:
                season_num = int(sheet_name.split(" ")[1])
                if season_num not in seasons:
                    seasons.append(season_num)
            except:
                pass
    return {"seasons": sorted(seasons), "current_season": max(seasons) if seasons else 5}

@api_router.get("/season/{season_num}/rankings")
async def get_season_rankings(season_num: int):
    """Get rankings for a specific season with normalized field names"""
    data = await fetch_google_sheets_data()
    sheet_name = f"Season {season_num} Rankings"
    raw = data.get(sheet_name, [])
    
    def div_num_to_letter(n):
        try:
            n = int(float(n))
            return {3: "A", 2: "B", 1: "C"}.get(n, str(n))
        except:
            return str(n)
    
    rankings = []
    for row in raw:
        team = row.get("Team", "")
        if not team:
            continue
        
        win_rate = row.get("Win Rate", 0)
        if isinstance(win_rate, float) and win_rate <= 1:
            win_rate = f"{win_rate*100:.1f}%"
        
        rankings.append({
            "rank": row.get("Rank", ""),
            "team": team,
            "wins": row.get("Wins", 0),
            "losses": row.get("Losses", 0),
            "win_rate": win_rate,
            "ppg": round(row.get("PPG", 0), 1) if isinstance(row.get("PPG", 0), float) else row.get("PPG", 0),
            "papg": round(row.get("PAPG", 0), 1) if isinstance(row.get("PAPG", 0), float) else row.get("PAPG", 0),
            "pdpg": round(row.get("PDPG", 0), 1) if isinstance(row.get("PDPG", 0), float) else row.get("PDPG", 0),
            "points_for": row.get("Points For", 0),
            "points_against": row.get("Points Against", 0),
            "point_diff": row.get("Point Dif.", 0),
            "current_div": div_num_to_letter(row.get("Current Div.", "")),
            "movement": row.get("Movement from Last Season", 0),
        })
    
    return {"season": season_num, "rankings": rankings}

@api_router.get("/season/{season_num}/division/{division}")
async def get_division_data(season_num: int, division: str):
    """Get division data for a specific season with separated games and standings"""
    data = await fetch_google_sheets_data()
    division = division.upper()
    if division not in ["A", "B", "C"]:
        raise HTTPException(status_code=400, detail="Division must be A, B, or C")
    
    sheet_name = f"Season {season_num} ({division} Division)"
    raw = data.get(sheet_name, [])
    standings, games, point_diffs = extract_division_parts(raw)
    
    return {
        "season": season_num, 
        "division": division, 
        "standings": standings,
        "games": games,
        "point_diffs": point_diffs
    }

def extract_division_parts(raw_data):
    """Extract standings and games from mixed division sheet data"""
    standings = []
    games = []
    point_diffs = []
    
    seen_teams = set()
    for row in raw_data:
        # Extract game data (left side columns)
        if row.get("Home Team") and row.get("Away Team") and row.get("Week"):
            week = row.get("Week")
            home_team = row.get("Home Team", "")
            away_team = row.get("Away Team", "")
            home_score = row.get("Home Score", "")
            away_score = row.get("Away Score", "")
            # Only add if it looks like a real game (not metadata)
            if home_team and away_team and str(home_team) not in ["Inserting Teams-", "Cmd F", "Three vertical dots"]:
                games.append({
                    "week": week,
                    "home_team": home_team,
                    "home_score": home_score,
                    "away_score": away_score,
                    "away_team": away_team
                })
        
        # Extract standings data (right side columns)
        team = row.get("Team", "")
        if team and team not in seen_teams and isinstance(team, str) and len(team) > 1:
            rank = row.get("Rank", "")
            wins = row.get("Wins", "")
            losses = row.get("Losses", "")
            if rank != "" and wins != "" and losses != "":
                seen_teams.add(team)
                standings.append({
                    "rank": rank,
                    "team": team,
                    "wins": wins,
                    "losses": losses,
                    "division_movement_score": row.get("Division Movement Score", ""),
                    "ppg": row.get("PPG", ""),
                })
                # Also extract weekly point differentials
                weekly_diffs = {}
                for w in range(1, 8):
                    weekly_diffs[f"week_{w}"] = row.get(str(w), 0)
                weekly_diffs["total"] = row.get("Total", 0)
                weekly_diffs["pdpg"] = row.get("PPG", 0)
                weekly_diffs["team"] = team
                point_diffs.append(weekly_diffs)
    
    # Sort standings by rank
    standings.sort(key=lambda x: float(x["rank"]) if isinstance(x["rank"], (int, float)) and x["rank"] != "" else 999)
    
    return standings, games, point_diffs

@api_router.get("/standings")
async def get_current_standings():
    """Get current standings for all divisions"""
    data = await fetch_google_sheets_data()
    current_season = 5  # Based on user input
    
    standings = {}
    for div in ["A", "B", "C"]:
        sheet_name = f"Season {current_season} ({div} Division)"
        raw = data.get(sheet_name, [])
        parsed_standings, _, _ = extract_division_parts(raw)
        standings[div] = parsed_standings
    
    return {"season": current_season, "standings": standings}

@api_router.post("/cache/refresh")
async def refresh_cache():
    """Force refresh the Google Sheets cache"""
    global sheets_cache
    sheets_cache["last_updated"] = None
    data = await fetch_google_sheets_data()
    return {"message": "Cache refreshed", "sheets": list(data.keys())}

# ============== Tournament & Prediction Routes ==============

@api_router.get("/tournaments")
async def get_tournaments():
    """Get all tournaments"""
    tournaments = await db.tournaments.find({}, {"_id": 0}).to_list(100)
    return {"tournaments": tournaments}

@api_router.get("/tournaments/active")
async def get_active_tournaments():
    """Get active tournaments for predictions"""
    tournaments = await db.tournaments.find(
        {"status": {"$in": ["upcoming", "active"]}},
        {"_id": 0}
    ).to_list(100)
    return {"tournaments": tournaments}

@api_router.post("/tournaments")
async def create_tournament(tournament: Tournament, request: Request):
    """Create a new tournament (admin only for now)"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    doc = tournament.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.tournaments.insert_one(doc)
    
    return {"tournament_id": tournament.tournament_id, "message": "Tournament created"}

@api_router.post("/predictions")
async def create_prediction(prediction_data: BracketPredictionCreate, request: Request):
    """Create or update a bracket prediction"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if tournament exists and is open
    tournament = await db.tournaments.find_one(
        {"tournament_id": prediction_data.tournament_id},
        {"_id": 0}
    )
    
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    if tournament.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Tournament is already completed")
    
    # Check for existing prediction
    existing = await db.predictions.find_one(
        {"user_id": user.user_id, "tournament_id": prediction_data.tournament_id},
        {"_id": 0}
    )
    
    if existing:
        # Update existing prediction
        await db.predictions.update_one(
            {"user_id": user.user_id, "tournament_id": prediction_data.tournament_id},
            {"$set": {
                "predictions": prediction_data.predictions,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"message": "Prediction updated", "prediction_id": existing["prediction_id"]}
    else:
        # Create new prediction
        prediction = BracketPrediction(
            user_id=user.user_id,
            tournament_id=prediction_data.tournament_id,
            predictions=prediction_data.predictions
        )
        doc = prediction.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.predictions.insert_one(doc)
        
        return {"message": "Prediction created", "prediction_id": prediction.prediction_id}

@api_router.get("/predictions/mine")
async def get_my_predictions(request: Request):
    """Get current user's predictions"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    predictions = await db.predictions.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    return {"predictions": predictions}

@api_router.get("/predictions/{tournament_id}")
async def get_tournament_predictions(tournament_id: str, request: Request):
    """Get user's prediction for a specific tournament"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    prediction = await db.predictions.find_one(
        {"user_id": user.user_id, "tournament_id": tournament_id},
        {"_id": 0}
    )
    
    if not prediction:
        return {"prediction": None}
    
    return {"prediction": prediction}

@api_router.get("/leaderboard/{tournament_id}")
async def get_leaderboard(tournament_id: str):
    """Get leaderboard for a tournament"""
    # Get all predictions for the tournament
    predictions = await db.predictions.find(
        {"tournament_id": tournament_id},
        {"_id": 0}
    ).sort("score", -1).to_list(100)
    
    # Get user details for each prediction
    leaderboard = []
    for i, pred in enumerate(predictions):
        user = await db.users.find_one({"user_id": pred["user_id"]}, {"_id": 0})
        if user:
            leaderboard.append({
                "rank": i + 1,
                "user_name": user.get("name", "Unknown"),
                "user_picture": user.get("picture"),
                "score": pred.get("score", 0)
            })
    
    return {"leaderboard": leaderboard, "tournament_id": tournament_id}

@api_router.get("/leaderboard")
async def get_global_leaderboard():
    """Get global leaderboard (aggregate scores)"""
    pipeline = [
        {"$group": {"_id": "$user_id", "total_score": {"$sum": "$score"}}},
        {"$sort": {"total_score": -1}},
        {"$limit": 100}
    ]
    
    results = await db.predictions.aggregate(pipeline).to_list(100)
    
    leaderboard = []
    for i, result in enumerate(results):
        user = await db.users.find_one({"user_id": result["_id"]}, {"_id": 0})
        if user:
            leaderboard.append({
                "rank": i + 1,
                "user_name": user.get("name", "Unknown"),
                "user_picture": user.get("picture"),
                "total_score": result["total_score"]
            })
    
    return {"leaderboard": leaderboard}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
