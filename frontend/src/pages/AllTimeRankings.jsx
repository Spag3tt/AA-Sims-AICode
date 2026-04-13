import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trophy, 
  Medal,
  Basketball,
  MagnifyingGlass,
  ArrowUp,
  ArrowDown,
  Minus
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AllTimeRankings = () => {
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await axios.get(`${API}/all-time-rankings`, { withCredentials: true });
        setRankings(response.data.rankings || []);
      } catch (error) {
        console.error('Error fetching rankings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  const filteredRankings = rankings.filter(team =>
    (team.team || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRankBadge = (rank) => {
    const r = Number(rank);
    if (r === 1) return 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white';
    if (r === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-800';
    if (r === 3) return 'bg-gradient-to-br from-amber-700 to-amber-900 text-white';
    return 'bg-[#1E293B] text-[#9CA3AF]';
  };

  const getDivBadge = (div) => {
    switch (div?.toUpperCase()) {
      case 'A': return 'badge-div-a';
      case 'B': return 'badge-div-b';
      case 'C': return 'badge-div-c';
      default: return 'bg-[#334155] text-[#9CA3AF]';
    }
  };

  const getMovementIcon = (m) => {
    const num = Number(m);
    if (num > 0) return <ArrowUp size={14} className="text-[#10B981]" />;
    if (num < 0) return <ArrowDown size={14} className="text-[#EF4444]" />;
    return <Minus size={14} className="text-[#64748B]" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-[#1E293B]" />
        <Skeleton className="h-12 w-full max-w-md bg-[#1E293B]" />
        <Skeleton className="h-[600px] w-full bg-[#1E293B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
          All-Time Rankings
        </h1>
        <p className="text-[#9CA3AF] mt-1">Complete historical performance across all seasons</p>
      </div>

      <div className="relative max-w-md">
        <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <Input
          placeholder="Search teams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-[#0F172A] border-[#334155] text-white placeholder:text-[#64748B] focus:border-[#FF5722]"
          data-testid="search-teams-input"
        />
      </div>

      <Card className="bg-[#0F172A] border-[#334155]">
        <CardHeader className="border-b border-[#334155]">
          <CardTitle className="flex items-center gap-3">
            <Medal size={28} weight="duotone" className="text-[#FF5722]" />
            <span className="font-heading text-xl font-bold text-white">
              {filteredRankings.length} Teams Ranked
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-responsive">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#0A101C] border-b border-[#334155]">
                  <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold w-16">Rank</TableHead>
                  <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold">Team</TableHead>
                  <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">W-L</TableHead>
                  <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">Win%</TableHead>
                  <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">PPG</TableHead>
                  <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">PAPG</TableHead>
                  <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">PDPG</TableHead>
                  <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">Div</TableHead>
                  <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">Mvmt</TableHead>
                  <TableHead className="text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold text-center">Titles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRankings.map((team, idx) => {
                  const totalTitles = (Number(team.a_champs) || 0) + (Number(team.b_champs) || 0) + (Number(team.c_champs) || 0);

                  return (
                    <TableRow 
                      key={idx}
                      className="border-b border-[#334155] hover:bg-[#1E293B] transition-colors"
                    >
                      <TableCell>
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-mono font-bold text-sm ${getRankBadge(team.rank)}`}>
                          {Math.round(Number(team.rank))}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-white">{team.team}</TableCell>
                      <TableCell className="text-center font-mono text-[#9CA3AF]">
                        <span className="text-[#10B981]">{Math.round(Number(team.wins))}</span>
                        <span className="text-[#64748B]">-</span>
                        <span className="text-[#EF4444]">{Math.round(Number(team.losses))}</span>
                      </TableCell>
                      <TableCell className="text-center font-mono text-[#F59E0B] font-semibold">
                        {team.win_rate}
                      </TableCell>
                      <TableCell className="text-center font-mono text-[#9CA3AF]">{team.ppg}</TableCell>
                      <TableCell className="text-center font-mono text-[#9CA3AF]">{team.papg}</TableCell>
                      <TableCell className="text-center font-mono">
                        <span className={Number(team.pdpg) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                          {team.pdpg}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getDivBadge(team.current_div)}`}>
                          {team.current_div}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {getMovementIcon(team.movement)}
                      </TableCell>
                      <TableCell className="text-center">
                        {totalTitles > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <Trophy size={16} weight="fill" className="text-[#F59E0B]" />
                            <span className="font-mono font-bold text-[#F59E0B]">{totalTitles}</span>
                          </div>
                        ) : (
                          <span className="text-[#64748B]">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredRankings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <Basketball size={48} className="mx-auto mb-4 text-[#64748B] opacity-50" />
                      <p className="text-[#64748B]">
                        {searchTerm ? 'No teams match your search' : 'No ranking data available'}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AllTimeRankings;
