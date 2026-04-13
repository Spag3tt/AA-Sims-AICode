import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  Target, 
  Trophy,
  Basketball,
  Lock,
  Check,
  Info
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Predictions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [myPredictions, setMyPredictions] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tournamentsRes, predictionsRes] = await Promise.all([
          axios.get(`${API}/tournaments/active`, { withCredentials: true }),
          axios.get(`${API}/predictions/mine`, { withCredentials: true })
        ]);

        setTournaments(tournamentsRes.data.tournaments || []);
        setMyPredictions(predictionsRes.data.predictions || []);
      } catch (error) {
        console.error('Error fetching predictions data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectWinner = (matchupId, team) => {
    setPredictions(prev => ({
      ...prev,
      [matchupId]: team
    }));
  };

  const handleSavePredictions = async () => {
    if (!selectedTournament) return;

    setSaving(true);
    try {
      await axios.post(`${API}/predictions`, {
        tournament_id: selectedTournament.tournament_id,
        predictions
      }, { withCredentials: true });

      toast.success('Predictions saved successfully!');
      
      // Refresh predictions
      const res = await axios.get(`${API}/predictions/mine`, { withCredentials: true });
      setMyPredictions(res.data.predictions || []);
    } catch (error) {
      toast.error('Failed to save predictions');
      console.error('Error saving predictions:', error);
    } finally {
      setSaving(false);
    }
  };

  // Mock bracket data for demonstration (in real app, this comes from tournament.bracket_data)
  const mockBracket = {
    rounds: [
      {
        name: 'Round 1',
        matchups: [
          { id: 'r1m1', team1: 'Team A', team2: 'Team B', seed1: 1, seed2: 8 },
          { id: 'r1m2', team1: 'Team C', team2: 'Team D', seed1: 4, seed2: 5 },
          { id: 'r1m3', team1: 'Team E', team2: 'Team F', seed1: 3, seed2: 6 },
          { id: 'r1m4', team1: 'Team G', team2: 'Team H', seed1: 2, seed2: 7 },
        ]
      },
      {
        name: 'Semifinals',
        matchups: [
          { id: 'r2m1', feedsFrom: ['r1m1', 'r1m2'] },
          { id: 'r2m2', feedsFrom: ['r1m3', 'r1m4'] },
        ]
      },
      {
        name: 'Championship',
        matchups: [
          { id: 'r3m1', feedsFrom: ['r2m1', 'r2m2'] },
        ]
      }
    ]
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-[#1E293B]" />
        <Skeleton className="h-[400px] w-full bg-[#1E293B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
            Bracket Predictions
          </h1>
          <p className="text-[#9CA3AF] mt-1">Predict tournament outcomes and compete on the leaderboard</p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="bg-[#0F172A] border-[#334155]">
        <Info size={20} className="text-[#007AFF]" />
        <AlertTitle className="text-white">How it works</AlertTitle>
        <AlertDescription className="text-[#9CA3AF]">
          Every 10 seasons, all 24 teams compete in a mega March Madness style tournament. 
          Pick your winners for each matchup to earn points. The more accurate your picks, 
          the higher you rank on the leaderboard!
        </AlertDescription>
      </Alert>

      {/* Active Tournaments */}
      {tournaments.length > 0 ? (
        <div className="space-y-6">
          <h2 className="font-heading text-xl font-bold text-white">Active Tournaments</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tournament) => {
              const existingPrediction = myPredictions.find(p => p.tournament_id === tournament.tournament_id);
              return (
                <Card 
                  key={tournament.tournament_id}
                  className={`bg-[#0F172A] border-[#334155] cursor-pointer card-hover ${
                    selectedTournament?.tournament_id === tournament.tournament_id ? 'ring-2 ring-[#FF5722]' : ''
                  }`}
                  onClick={() => setSelectedTournament(tournament)}
                  data-testid={`tournament-card-${tournament.tournament_id}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-heading text-lg text-white">{tournament.name}</CardTitle>
                      {existingPrediction && (
                        <span className="flex items-center gap-1 text-xs text-[#10B981]">
                          <Check size={14} /> Submitted
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-[#9CA3AF]">
                      Season {tournament.season} • {tournament.tournament_type.replace('_', ' ').toUpperCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        tournament.status === 'active' ? 'bg-[#10B981]/20 text-[#10B981]' :
                        tournament.status === 'upcoming' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                        'bg-[#64748B]/20 text-[#64748B]'
                      }`}>
                        {tournament.status.toUpperCase()}
                      </span>
                      {existingPrediction && (
                        <span className="text-[#9CA3AF] text-sm">
                          Score: <span className="text-white font-bold">{existingPrediction.score}</span>
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        /* No Active Tournaments */
        <Card className="bg-[#0F172A] border-[#334155]">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 bg-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={40} className="text-[#64748B]" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-white mb-2">No Active Tournaments</h3>
            <p className="text-[#9CA3AF] max-w-md mx-auto mb-6">
              The mega tournament happens every 10 seasons. We're currently in Season 5, 
              so the next big tournament will be at the end of Season 10!
            </p>
            <div className="flex items-center justify-center gap-2 text-[#F59E0B]">
              <Target size={20} />
              <span className="font-semibold">5 seasons until next mega tournament</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bracket View (when tournament selected) */}
      {selectedTournament && (
        <Card className="bg-[#0F172A] border-[#334155]">
          <CardHeader className="border-b border-[#334155]">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy size={24} weight="duotone" className="text-[#FF5722]" />
                <span className="font-heading text-xl font-bold text-white">{selectedTournament.name}</span>
              </div>
              <Button
                onClick={handleSavePredictions}
                disabled={saving || Object.keys(predictions).length === 0}
                className="bg-[#FF5722] hover:bg-[#E64A19] text-white"
                data-testid="save-predictions-btn"
              >
                {saving ? 'Saving...' : 'Save Predictions'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Mock Bracket Display */}
            <div className="overflow-x-auto">
              <div className="flex gap-8 min-w-max">
                {mockBracket.rounds.map((round, roundIdx) => (
                  <div key={roundIdx} className="space-y-4">
                    <h3 className="font-heading text-lg font-bold text-[#9CA3AF] text-center">{round.name}</h3>
                    <div className="space-y-6" style={{ marginTop: roundIdx * 40 + 'px' }}>
                      {round.matchups.map((matchup) => {
                        const team1 = matchup.team1 || (predictions[matchup.feedsFrom?.[0]] || 'TBD');
                        const team2 = matchup.team2 || (predictions[matchup.feedsFrom?.[1]] || 'TBD');
                        const selectedWinner = predictions[matchup.id];

                        return (
                          <div key={matchup.id} className="bg-[#111827] border border-[#334155] rounded-lg overflow-hidden w-48">
                            <button
                              className={`w-full p-3 text-left flex items-center justify-between transition-colors ${
                                selectedWinner === team1 
                                  ? 'bg-[#FF5722]/20 border-l-4 border-[#FF5722]' 
                                  : 'hover:bg-[#1E293B]'
                              }`}
                              onClick={() => team1 !== 'TBD' && handleSelectWinner(matchup.id, team1)}
                              disabled={team1 === 'TBD'}
                              data-testid={`pick-${matchup.id}-team1`}
                            >
                              <div className="flex items-center gap-2">
                                {matchup.seed1 && (
                                  <span className="text-xs text-[#64748B] font-mono">{matchup.seed1}</span>
                                )}
                                <span className={`font-medium ${team1 === 'TBD' ? 'text-[#64748B]' : 'text-white'}`}>
                                  {team1}
                                </span>
                              </div>
                              {selectedWinner === team1 && (
                                <Check size={16} className="text-[#FF5722]" />
                              )}
                            </button>
                            <div className="border-t border-[#334155]" />
                            <button
                              className={`w-full p-3 text-left flex items-center justify-between transition-colors ${
                                selectedWinner === team2 
                                  ? 'bg-[#FF5722]/20 border-l-4 border-[#FF5722]' 
                                  : 'hover:bg-[#1E293B]'
                              }`}
                              onClick={() => team2 !== 'TBD' && handleSelectWinner(matchup.id, team2)}
                              disabled={team2 === 'TBD'}
                              data-testid={`pick-${matchup.id}-team2`}
                            >
                              <div className="flex items-center gap-2">
                                {matchup.seed2 && (
                                  <span className="text-xs text-[#64748B] font-mono">{matchup.seed2}</span>
                                )}
                                <span className={`font-medium ${team2 === 'TBD' ? 'text-[#64748B]' : 'text-white'}`}>
                                  {team2}
                                </span>
                              </div>
                              {selectedWinner === team2 && (
                                <Check size={16} className="text-[#FF5722]" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-[#111827] rounded-lg">
              <h4 className="font-semibold text-white mb-2">How to make picks:</h4>
              <ul className="text-sm text-[#9CA3AF] space-y-1">
                <li>1. Click on a team to select them as the winner of that matchup</li>
                <li>2. Your selection will advance to the next round automatically</li>
                <li>3. Complete all rounds and click "Save Predictions" to submit</li>
                <li>4. You can update your picks until the tournament starts</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Previous Predictions */}
      {myPredictions.length > 0 && (
        <Card className="bg-[#0F172A] border-[#334155]">
          <CardHeader className="border-b border-[#334155]">
            <CardTitle className="font-heading text-xl font-bold text-white">
              My Predictions History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#334155]">
              {myPredictions.map((pred, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 hover:bg-[#1E293B] transition-colors">
                  <div>
                    <p className="text-white font-medium">{pred.tournament_id}</p>
                    <p className="text-sm text-[#64748B]">
                      {Object.keys(pred.predictions || {}).length} picks made
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-2xl font-bold text-[#FF5722]">{pred.score}</p>
                    <p className="text-xs text-[#64748B]">points</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Predictions;
