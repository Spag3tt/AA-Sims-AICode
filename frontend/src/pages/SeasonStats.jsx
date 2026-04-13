import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Trophy, 
  CalendarBlank,
  Basketball,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SeasonStats = () => {
  const { seasonNum } = useParams();
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState([]);
  const [divisionData, setDivisionData] = useState({ A: { standings: [], games: [] }, B: { standings: [], games: [] }, C: { standings: [], games: [] } });
  const [activeDivision, setActiveDivision] = useState('A');
  const [activeWeek, setActiveWeek] = useState('all');
  const [seasons, setSeasons] = useState([]);
  const currentSeason = parseInt(seasonNum) || 5;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rankingsRes, seasonsRes, divARes, divBRes, divCRes] = await Promise.all([
          axios.get(`${API}/season/${currentSeason}/rankings`, { withCredentials: true }),
          axios.get(`${API}/seasons`, { withCredentials: true }),
          axios.get(`${API}/season/${currentSeason}/division/A`, { withCredentials: true }),
          axios.get(`${API}/season/${currentSeason}/division/B`, { withCredentials: true }),
          axios.get(`${API}/season/${currentSeason}/division/C`, { withCredentials: true }),
        ]);

        setRankings(rankingsRes.data.rankings || []);
        setSeasons(seasonsRes.data.seasons || [1, 2, 3, 4, 5]);
        setDivisionData({
          A: { standings: divARes.data.standings || [], games: divARes.data.games || [] },
          B: { standings: divBRes.data.standings || [], games: divBRes.data.games || [] },
          C: { standings: divCRes.data.standings || [], games: divCRes.data.games || [] },
        });
      } catch (error) {
        console.error('Error fetching season data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentSeason]);

  const getDivisionColor = (div) => {
    switch (div) {
      case 'A': return 'from-yellow-400 to-amber-600';
      case 'B': return 'from-gray-300 to-gray-500';
      case 'C': return 'from-amber-700 to-amber-900';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getRowClass = (idx, total) => {
    if (idx < 3) return 'border-l-2 border-[#10B981]';
    if (idx >= total - 3) return 'border-l-2 border-[#EF4444]';
    return '';
  };

  // Get unique weeks from games
  const getWeeks = (games) => {
    const weeks = [...new Set(games.map(g => g.week).filter(w => w && w !== ''))];
    return weeks.sort((a, b) => Number(a) - Number(b));
  };

  // Filter games by week
  const filterGamesByWeek = (games, week) => {
    if (week === 'all') return games.filter(g => g.home_score !== '' && g.home_score !== undefined);
    return games.filter(g => String(g.week) === String(week));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-[#1E293B]" />
        <Skeleton className="h-[500px] w-full bg-[#1E293B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with Season Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
            Season {currentSeason}
          </h1>
          <p className="text-[#9CA3AF] mt-1">Complete season statistics and game results</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/season/${Math.max(1, currentSeason - 1)}`}>
            <Button 
              variant="outline" size="icon"
              disabled={currentSeason <= 1}
              className="border-[#334155] text-[#9CA3AF] hover:text-white hover:bg-[#1E293B] disabled:opacity-50"
              data-testid="prev-season-btn"
            >
              <CaretLeft size={20} />
            </Button>
          </Link>
          <Select value={String(currentSeason)} onValueChange={(v) => { window.location.href = `/season/${v}`; }}>
            <SelectTrigger className="w-40 bg-[#0F172A] border-[#334155] text-white" data-testid="season-select">
              <SelectValue placeholder="Select Season" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-[#334155]">
              {seasons.map((s) => (
                <SelectItem key={s} value={String(s)} className="text-white hover:bg-[#1E293B]">
                  Season {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link to={`/season/${Math.min(5, currentSeason + 1)}`}>
            <Button 
              variant="outline" size="icon"
              disabled={currentSeason >= 5}
              className="border-[#334155] text-[#9CA3AF] hover:text-white hover:bg-[#1E293B] disabled:opacity-50"
              data-testid="next-season-btn"
            >
              <CaretRight size={20} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Season Overall Rankings */}
      {rankings.length > 0 && (
        <Card className="bg-[#0F172A] border-[#334155]">
          <CardHeader className="border-b border-[#334155]">
            <CardTitle className="flex items-center gap-3">
              <CalendarBlank size={24} weight="duotone" className="text-[#FF5722]" />
              <span className="font-heading text-xl font-bold text-white">Season {currentSeason} Overall Rankings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="table-responsive">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0A101C] border-b border-[#334155]">
                    <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold w-12">#</TableHead>
                    <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold">Team</TableHead>
                    <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">W</TableHead>
                    <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">L</TableHead>
                    <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">Win%</TableHead>
                    <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">PPG</TableHead>
                    <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">PAPG</TableHead>
                    <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">PDPG</TableHead>
                    <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">Div</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankings.map((team, idx) => (
                    <TableRow key={idx} className="border-b border-[#334155] hover:bg-[#1E293B] transition-colors">
                      <TableCell className="font-mono text-[#64748B]">{Math.round(Number(team.rank))}</TableCell>
                      <TableCell className="font-medium text-white">{team.team}</TableCell>
                      <TableCell className="text-center font-mono text-[#10B981]">{Math.round(Number(team.wins))}</TableCell>
                      <TableCell className="text-center font-mono text-[#EF4444]">{Math.round(Number(team.losses))}</TableCell>
                      <TableCell className="text-center font-mono text-[#F59E0B]">{team.win_rate}</TableCell>
                      <TableCell className="text-center font-mono text-[#9CA3AF]">{team.ppg}</TableCell>
                      <TableCell className="text-center font-mono text-[#9CA3AF]">{team.papg}</TableCell>
                      <TableCell className="text-center font-mono">
                        <span className={Number(team.pdpg) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                          {team.pdpg}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          team.current_div === 'A' ? 'badge-div-a' :
                          team.current_div === 'B' ? 'badge-div-b' : 'badge-div-c'
                        }`}>
                          {team.current_div}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Division Tabs with Games */}
      <Tabs defaultValue="A" value={activeDivision} onValueChange={setActiveDivision}>
        <TabsList className="bg-[#0A101C] border border-[#334155] p-1">
          {['A', 'B', 'C'].map((div) => (
            <TabsTrigger
              key={div}
              value={div}
              className="data-[state=active]:bg-[#1E293B] data-[state=active]:text-white text-[#9CA3AF] px-6"
              data-testid={`tab-season-div-${div}`}
            >
              <div className={`w-6 h-6 rounded bg-gradient-to-br ${getDivisionColor(div)} flex items-center justify-center mr-2`}>
                <span className="text-xs font-bold text-white">{div}</span>
              </div>
              Division {div}
            </TabsTrigger>
          ))}
        </TabsList>

        {['A', 'B', 'C'].map((div) => {
          const { standings, games } = divisionData[div];
          const weeks = getWeeks(games);
          const filteredGames = filterGamesByWeek(games, activeWeek);

          return (
            <TabsContent key={div} value={div} className="mt-6 space-y-6">
              {/* Division Standings */}
              <Card className="bg-[#0F172A] border-[#334155]">
                <CardHeader className="border-b border-[#334155]">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getDivisionColor(div)} flex items-center justify-center`}>
                      <Trophy size={20} weight="fill" className="text-white" />
                    </div>
                    <span className="font-heading text-xl font-bold text-white">Division {div} Standings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="table-responsive">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#0A101C] border-b border-[#334155]">
                          <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold w-12">#</TableHead>
                          <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold">Team</TableHead>
                          <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">W</TableHead>
                          <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">L</TableHead>
                          <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">PPG</TableHead>
                          <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">Div Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {standings.map((team, idx) => (
                          <TableRow 
                            key={idx}
                            className={`border-b border-[#334155] hover:bg-[#1E293B] transition-colors ${getRowClass(idx, 8)}`}
                          >
                            <TableCell className="font-mono text-[#64748B]">{idx + 1}</TableCell>
                            <TableCell className="font-medium text-white">{team.team}</TableCell>
                            <TableCell className="text-center font-mono text-[#10B981]">{Math.round(Number(team.wins))}</TableCell>
                            <TableCell className="text-center font-mono text-[#EF4444]">{Math.round(Number(team.losses))}</TableCell>
                            <TableCell className="text-center font-mono text-[#9CA3AF]">
                              {typeof team.ppg === 'number' ? team.ppg.toFixed(1) : team.ppg || '-'}
                            </TableCell>
                            <TableCell className="text-center font-mono text-[#9CA3AF]">
                              {team.division_movement_score || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        {standings.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12">
                              <Basketball size={48} className="mx-auto mb-4 text-[#64748B] opacity-50" />
                              <p className="text-[#64748B]">No division data available</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Games Section */}
              {games.length > 0 && (
                <Card className="bg-[#0F172A] border-[#334155]">
                  <CardHeader className="border-b border-[#334155]">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Basketball size={24} weight="duotone" className="text-[#FF5722]" />
                        <span className="font-heading text-xl font-bold text-white">Game Results</span>
                      </div>
                    </CardTitle>
                    {/* Week Filter */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => setActiveWeek('all')}
                        className={`week-tab text-sm font-medium ${activeWeek === 'all' ? 'active' : 'text-[#9CA3AF]'}`}
                        data-testid="week-filter-all"
                      >
                        All Weeks
                      </button>
                      {weeks.map((w) => (
                        <button
                          key={w}
                          onClick={() => setActiveWeek(String(w))}
                          className={`week-tab text-sm font-medium ${String(activeWeek) === String(w) ? 'active' : 'text-[#9CA3AF]'}`}
                          data-testid={`week-filter-${w}`}
                        >
                          Week {w}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredGames.map((game, idx) => {
                        const homeWon = Number(game.home_score) > Number(game.away_score);
                        const awayWon = Number(game.away_score) > Number(game.home_score);
                        const isPlayed = game.home_score !== '' && game.home_score !== undefined;

                        return (
                          <div 
                            key={idx}
                            className="bg-[#111827] border border-[#334155] rounded-lg p-4 card-hover"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs text-[#64748B] bg-[#0A101C] px-2 py-1 rounded">Week {game.week}</span>
                              {isPlayed && (
                                <span className="text-xs text-[#10B981] font-medium">FINAL</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className={`font-medium ${homeWon ? 'text-[#FF5722] font-bold' : 'text-white'}`}>
                                  {game.home_team}
                                </p>
                                <p className="font-mono text-2xl font-bold text-white mt-1">
                                  {isPlayed ? Math.round(Number(game.home_score)) : '-'}
                                </p>
                              </div>
                              <div className="px-4 text-[#64748B] font-heading text-sm">VS</div>
                              <div className="flex-1 text-right">
                                <p className={`font-medium ${awayWon ? 'text-[#FF5722] font-bold' : 'text-white'}`}>
                                  {game.away_team}
                                </p>
                                <p className="font-mono text-2xl font-bold text-white mt-1">
                                  {isPlayed ? Math.round(Number(game.away_score)) : '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {filteredGames.length === 0 && (
                      <div className="text-center py-8">
                        <Basketball size={48} className="mx-auto mb-4 text-[#64748B] opacity-50" />
                        <p className="text-[#64748B]">No games for this week yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default SeasonStats;
