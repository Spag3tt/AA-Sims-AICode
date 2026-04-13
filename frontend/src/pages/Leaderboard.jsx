import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Medal, 
  Trophy,
  Crown,
  Basketball
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Leaderboard = () => {
  const [loading, setLoading] = useState(true);
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('global');
  const [tournamentLeaderboard, setTournamentLeaderboard] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [globalRes, tournamentsRes] = await Promise.all([
          axios.get(`${API}/leaderboard`, { withCredentials: true }),
          axios.get(`${API}/tournaments`, { withCredentials: true })
        ]);

        setGlobalLeaderboard(globalRes.data.leaderboard || []);
        setTournaments(tournamentsRes.data.tournaments || []);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchTournamentLeaderboard = async () => {
      if (selectedTournament === 'global') return;
      
      try {
        const res = await axios.get(`${API}/leaderboard/${selectedTournament}`, { withCredentials: true });
        setTournamentLeaderboard(res.data.leaderboard || []);
      } catch (error) {
        console.error('Error fetching tournament leaderboard:', error);
      }
    };

    fetchTournamentLeaderboard();
  }, [selectedTournament]);

  const getRankBadge = (rank) => {
    if (rank === 1) return (
      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center">
        <Crown size={20} weight="fill" className="text-white" />
      </div>
    );
    if (rank === 2) return (
      <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center">
        <Medal size={20} weight="fill" className="text-white" />
      </div>
    );
    if (rank === 3) return (
      <div className="w-10 h-10 bg-gradient-to-br from-amber-700 to-amber-900 rounded-full flex items-center justify-center">
        <Medal size={20} weight="fill" className="text-white" />
      </div>
    );
    return (
      <div className="w-10 h-10 bg-[#1E293B] rounded-full flex items-center justify-center font-mono font-bold text-[#9CA3AF]">
        {rank}
      </div>
    );
  };

  const getRowHighlight = (rank) => {
    if (rank === 1) return 'bg-yellow-400/10 border-l-4 border-yellow-400';
    if (rank === 2) return 'bg-gray-300/10 border-l-4 border-gray-300';
    if (rank === 3) return 'bg-amber-700/10 border-l-4 border-amber-700';
    return '';
  };

  const currentLeaderboard = selectedTournament === 'global' ? globalLeaderboard : tournamentLeaderboard;

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
            Leaderboard
          </h1>
          <p className="text-[#9CA3AF] mt-1">Top predictors ranked by accuracy</p>
        </div>
        <Select value={selectedTournament} onValueChange={setSelectedTournament}>
          <SelectTrigger className="w-56 bg-[#0F172A] border-[#334155] text-white" data-testid="leaderboard-tournament-select">
            <SelectValue placeholder="Select Tournament" />
          </SelectTrigger>
          <SelectContent className="bg-[#0F172A] border-[#334155]">
            <SelectItem value="global" className="text-white hover:bg-[#1E293B]">
              Global Rankings
            </SelectItem>
            {tournaments.map((t) => (
              <SelectItem key={t.tournament_id} value={t.tournament_id} className="text-white hover:bg-[#1E293B]">
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Top 3 Podium */}
      {currentLeaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <Card className="bg-[#0F172A] border-[#334155] mt-8">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Medal size={32} weight="fill" className="text-white" />
              </div>
              <Avatar className="w-16 h-16 mx-auto mb-3 border-4 border-gray-400">
                <AvatarImage src={currentLeaderboard[1]?.user_picture} />
                <AvatarFallback className="bg-[#1E293B] text-white text-xl">
                  {currentLeaderboard[1]?.user_name?.charAt(0) || '2'}
                </AvatarFallback>
              </Avatar>
              <p className="font-heading text-lg font-bold text-white truncate px-2">
                {currentLeaderboard[1]?.user_name || 'Unknown'}
              </p>
              <p className="font-mono text-2xl font-bold text-gray-300">
                {currentLeaderboard[1]?.total_score || currentLeaderboard[1]?.score || 0}
              </p>
              <p className="text-xs text-[#64748B]">points</p>
            </CardContent>
          </Card>

          {/* 1st Place */}
          <Card className="bg-[#0F172A] border-[#334155] border-2 border-yellow-400/50">
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Crown size={40} weight="fill" className="text-white" />
              </div>
              <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-yellow-400">
                <AvatarImage src={currentLeaderboard[0]?.user_picture} />
                <AvatarFallback className="bg-[#1E293B] text-white text-2xl">
                  {currentLeaderboard[0]?.user_name?.charAt(0) || '1'}
                </AvatarFallback>
              </Avatar>
              <p className="font-heading text-xl font-bold text-white truncate px-2">
                {currentLeaderboard[0]?.user_name || 'Unknown'}
              </p>
              <p className="font-mono text-3xl font-bold text-yellow-400">
                {currentLeaderboard[0]?.total_score || currentLeaderboard[0]?.score || 0}
              </p>
              <p className="text-xs text-[#64748B]">points</p>
            </CardContent>
          </Card>

          {/* 3rd Place */}
          <Card className="bg-[#0F172A] border-[#334155] mt-8">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-700 to-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Medal size={32} weight="fill" className="text-white" />
              </div>
              <Avatar className="w-16 h-16 mx-auto mb-3 border-4 border-amber-700">
                <AvatarImage src={currentLeaderboard[2]?.user_picture} />
                <AvatarFallback className="bg-[#1E293B] text-white text-xl">
                  {currentLeaderboard[2]?.user_name?.charAt(0) || '3'}
                </AvatarFallback>
              </Avatar>
              <p className="font-heading text-lg font-bold text-white truncate px-2">
                {currentLeaderboard[2]?.user_name || 'Unknown'}
              </p>
              <p className="font-mono text-2xl font-bold text-amber-600">
                {currentLeaderboard[2]?.total_score || currentLeaderboard[2]?.score || 0}
              </p>
              <p className="text-xs text-[#64748B]">points</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Leaderboard */}
      <Card className="bg-[#0F172A] border-[#334155]">
        <CardHeader className="border-b border-[#334155]">
          <CardTitle className="flex items-center gap-3">
            <Trophy size={24} weight="duotone" className="text-[#FF5722]" />
            <span className="font-heading text-xl font-bold text-white">
              {selectedTournament === 'global' ? 'All-Time Rankings' : 'Tournament Rankings'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#334155]">
            {currentLeaderboard.map((entry, idx) => (
              <div 
                key={idx}
                className={`flex items-center justify-between p-4 hover:bg-[#1E293B] transition-colors ${getRowHighlight(entry.rank)}`}
              >
                <div className="flex items-center gap-4">
                  {getRankBadge(entry.rank)}
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={entry.user_picture} />
                    <AvatarFallback className="bg-[#334155] text-white">
                      {entry.user_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-white">{entry.user_name}</p>
                    <p className="text-xs text-[#64748B]">Rank #{entry.rank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold text-[#FF5722]">
                    {entry.total_score || entry.score || 0}
                  </p>
                  <p className="text-xs text-[#64748B]">points</p>
                </div>
              </div>
            ))}
            {currentLeaderboard.length === 0 && (
              <div className="py-16 text-center">
                <Basketball size={64} className="mx-auto mb-4 text-[#64748B] opacity-50" />
                <p className="text-[#64748B] text-lg">No predictions yet</p>
                <p className="text-[#64748B] text-sm mt-2">
                  Be the first to make predictions and claim the top spot!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#0F172A] border-[#334155]">
          <CardContent className="pt-6">
            <p className="text-[#64748B] text-xs uppercase tracking-wider mb-1">Total Participants</p>
            <p className="font-heading text-3xl font-bold text-white">{currentLeaderboard.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0F172A] border-[#334155]">
          <CardContent className="pt-6">
            <p className="text-[#64748B] text-xs uppercase tracking-wider mb-1">Highest Score</p>
            <p className="font-heading text-3xl font-bold text-[#FF5722]">
              {currentLeaderboard[0]?.total_score || currentLeaderboard[0]?.score || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#0F172A] border-[#334155]">
          <CardContent className="pt-6">
            <p className="text-[#64748B] text-xs uppercase tracking-wider mb-1">Average Score</p>
            <p className="font-heading text-3xl font-bold text-white">
              {currentLeaderboard.length > 0 
                ? Math.round(currentLeaderboard.reduce((acc, e) => acc + (e.total_score || e.score || 0), 0) / currentLeaderboard.length)
                : 0
              }
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#0F172A] border-[#334155]">
          <CardContent className="pt-6">
            <p className="text-[#64748B] text-xs uppercase tracking-wider mb-1">Tournaments</p>
            <p className="font-heading text-3xl font-bold text-white">{tournaments.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
