import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  ChartLineUp, 
  ArrowUp, 
  ArrowDown,
  Minus,
  ArrowRight,
  Basketball
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState({ A: [], B: [], C: [] });
  const [history, setHistory] = useState([]);
  const [allTimeTop, setAllTimeTop] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [standingsRes, historyRes, allTimeRes] = await Promise.all([
          axios.get(`${API}/standings`, { withCredentials: true }),
          axios.get(`${API}/history`, { withCredentials: true }),
          axios.get(`${API}/all-time-rankings`, { withCredentials: true })
        ]);

        setStandings(standingsRes.data.standings || { A: [], B: [], C: [] });
        setHistory(historyRes.data.history || []);
        setAllTimeTop((allTimeRes.data.rankings || []).slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDivisionColor = (div) => {
    switch (div) {
      case 'A': return 'from-yellow-400 to-amber-600';
      case 'B': return 'from-gray-300 to-gray-500';
      case 'C': return 'from-amber-700 to-amber-900';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getMovementIcon = (movement) => {
    if (!movement || movement === 0 || movement === '-') {
      return <Minus size={16} className="text-[#64748B]" />;
    }
    const num = Number(movement);
    if (num > 0) return <ArrowUp size={16} className="text-[#10B981]" />;
    if (num < 0) return <ArrowDown size={16} className="text-[#EF4444]" />;
    return <Minus size={16} className="text-[#64748B]" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-[#0F172A] border-[#334155]">
              <CardHeader><Skeleton className="h-6 w-24 bg-[#1E293B]" /></CardHeader>
              <CardContent><Skeleton className="h-40 w-full bg-[#1E293B]" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight" data-testid="dashboard-welcome">
            Welcome back, {user?.name?.split(' ')[0] || 'Fan'}
          </h1>
          <p className="text-[#9CA3AF] mt-1">Season 5, Week 2 of 7</p>
        </div>
        <Link 
          to="/predictions"
          className="bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold uppercase tracking-wider px-4 py-2 rounded-md transition-colors text-sm flex items-center gap-2 w-fit"
          data-testid="make-predictions-btn"
        >
          Make Predictions <ArrowRight size={16} />
        </Link>
      </div>

      {/* Division Standings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {['A', 'B', 'C'].map((div) => (
          <Card key={div} className="bg-[#0F172A] border-[#334155] overflow-hidden" data-testid={`division-${div}-card`}>
            <CardHeader className="border-b border-[#334155] pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getDivisionColor(div)} flex items-center justify-center`}>
                  <Trophy size={20} weight="fill" className="text-white" />
                </div>
                <div>
                  <span className="font-heading text-xl font-bold text-white">Division {div}</span>
                  <p className="text-xs text-[#64748B] mt-0.5">Top 4 qualify for playoffs</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#334155]">
                {(standings[div] || []).slice(0, 8).map((team, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-[#1E293B] transition-colors ${idx < 3 ? 'border-l-2 border-[#10B981]' : idx >= 5 ? 'border-l-2 border-[#EF4444]' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-[#64748B] w-6">{idx + 1}</span>
                      <span className="text-white font-medium">{team.team}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm text-[#9CA3AF]">
                        {team.wins}-{team.losses}
                      </span>
                    </div>
                  </div>
                ))}
                {(!standings[div] || standings[div].length === 0) && (
                  <div className="px-4 py-8 text-center text-[#64748B]">
                    <Basketball size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No data available</p>
                  </div>
                )}
              </div>
              <Link 
                to="/season/5"
                className="block text-center py-3 text-[#FF5722] hover:text-[#E64A19] text-sm font-medium border-t border-[#334155]"
                data-testid={`view-div-${div}-details`}
              >
                View Full Stats
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All-Time Top 5 */}
        <Card className="bg-[#0F172A] border-[#334155]" data-testid="all-time-top-card">
          <CardHeader className="border-b border-[#334155]">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChartLineUp size={24} weight="duotone" className="text-[#FF5722]" />
                <span className="font-heading text-xl font-bold text-white">All-Time Top 5</span>
              </div>
              <Link to="/all-time" className="text-sm text-[#FF5722] hover:text-[#E64A19]" data-testid="view-all-time-link">
                View All
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#334155]">
              {allTimeTop.map((team, idx) => (
                <div key={idx} className="flex items-center justify-between px-4 py-3 hover:bg-[#1E293B] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-lg font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-[#64748B]'}`}>
                      #{team.rank}
                    </span>
                    <span className="text-white font-medium">{team.team}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-[#9CA3AF]">
                      {team.wins}-{team.losses}
                    </span>
                    <span className="font-mono text-sm text-[#10B981]">
                      {team.win_rate}
                    </span>
                  </div>
                </div>
              ))}
              {allTimeTop.length === 0 && (
                <div className="px-4 py-8 text-center text-[#64748B]"><p>No data available</p></div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Championships */}
        <Card className="bg-[#0F172A] border-[#334155]" data-testid="recent-champs-card">
          <CardHeader className="border-b border-[#334155]">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy size={24} weight="duotone" className="text-[#FF5722]" />
                <span className="font-heading text-xl font-bold text-white">Recent Championships</span>
              </div>
              <Link to="/history" className="text-sm text-[#FF5722] hover:text-[#E64A19]" data-testid="view-history-link">
                View All
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#334155]">
              {history.slice(0, 5).map((champ, idx) => (
                <div key={idx} className="flex items-center justify-between px-4 py-3 hover:bg-[#1E293B] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-xs font-bold text-white">
                      S{champ.season}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        <Trophy size={14} weight="fill" className="inline text-yellow-400 mr-1" />
                        {champ.a_champion}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {champ.points_for}-{champ.points_against} vs {champ.runner_up}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-[#10B981]">+{champ.win_margin}</p>
                    <p className="text-xs text-[#64748B]">margin</p>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="px-4 py-8 text-center text-[#64748B]"><p>No championship data available</p></div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
