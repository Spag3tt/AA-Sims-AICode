import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trophy, 
  Medal,
  Basketball,
  MagnifyingGlass
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const History = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API}/history`, { withCredentials: true });
        setHistory(response.data.history || []);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(champ => {
    const matchesSearch = 
      (champ.a_champion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (champ.b_champion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (champ.c_champion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (champ.runner_up || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeason = seasonFilter === 'all' || String(Math.round(Number(champ.season))) === seasonFilter;
    
    return matchesSearch && matchesSeason;
  });

  const seasons = [...new Set(history.map(h => Math.round(Number(h.season))))].filter(Boolean).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-[#1E293B]" />
        <Skeleton className="h-[600px] w-full bg-[#1E293B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
          Championship History
        </h1>
        <p className="text-[#9CA3AF] mt-1">Complete record of all division championships</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <Input
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#0F172A] border-[#334155] text-white placeholder:text-[#64748B] focus:border-[#FF5722]"
            data-testid="search-history-input"
          />
        </div>
        <Select value={seasonFilter} onValueChange={setSeasonFilter}>
          <SelectTrigger className="w-40 bg-[#0F172A] border-[#334155] text-white" data-testid="season-filter">
            <SelectValue placeholder="Season" />
          </SelectTrigger>
          <SelectContent className="bg-[#0F172A] border-[#334155]">
            <SelectItem value="all" className="text-white hover:bg-[#1E293B]">All Seasons</SelectItem>
            {seasons.map((s) => (
              <SelectItem key={s} value={String(s)} className="text-white hover:bg-[#1E293B]">
                Season {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Championship Cards by Season */}
      <div className="space-y-8">
        {filteredHistory
          .sort((a, b) => Number(b.season) - Number(a.season))
          .map((champ, idx) => {
            const season = Math.round(Number(champ.season));
            
            return (
              <Card key={idx} className="bg-[#0F172A] border-[#334155] overflow-hidden">
                <CardHeader className="border-b border-[#334155]">
                  <CardTitle className="flex items-center gap-3">
                    <Trophy size={24} weight="duotone" className="text-[#FF5722]" />
                    <span className="font-heading text-2xl font-bold text-white">Season {season}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* A Division Champion */}
                    <div className="space-y-4">
                      <div className="h-2 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-full" />
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-lg flex items-center justify-center">
                          <Trophy size={24} weight="fill" className="text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-[#64748B] uppercase tracking-wider">A Division Champion</p>
                          <p className="font-heading text-xl font-bold text-white">{champ.a_champion || 'TBD'}</p>
                        </div>
                      </div>
                    </div>

                    {/* B Division Champion */}
                    <div className="space-y-4">
                      <div className="h-2 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full" />
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-lg flex items-center justify-center">
                          <Medal size={24} weight="fill" className="text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-[#64748B] uppercase tracking-wider">B Division Champion</p>
                          <p className="font-heading text-xl font-bold text-white">{champ.b_champion || 'TBD'}</p>
                        </div>
                      </div>
                    </div>

                    {/* C Division Champion */}
                    <div className="space-y-4">
                      <div className="h-2 bg-gradient-to-r from-amber-700 to-amber-900 rounded-full" />
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-700 to-amber-900 rounded-lg flex items-center justify-center">
                          <Medal size={24} weight="fill" className="text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-[#64748B] uppercase tracking-wider">C Division Champion</p>
                          <p className="font-heading text-xl font-bold text-white">{champ.c_champion || 'TBD'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Championship Game Details */}
                  <div className="mt-6 bg-[#111827] border border-[#334155] rounded-lg p-6">
                    <h4 className="font-heading text-lg font-bold text-[#FF5722] mb-4">A Division Championship Game</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-[#10B981] font-bold text-lg">{champ.a_champion}</p>
                        <p className="text-xs text-[#64748B]">Seed #{champ.seed ? Math.round(Number(champ.seed)) : '-'} | Pre-Tourney Rank #{champ.pre_tourney_rank ? Math.round(Number(champ.pre_tourney_rank)) : '-'}</p>
                      </div>
                      <div className="px-6 text-center">
                        <p className="font-mono text-3xl font-bold text-white">
                          {champ.points_for ? Math.round(Number(champ.points_for)) : '-'} - {champ.points_against ? Math.round(Number(champ.points_against)) : '-'}
                        </p>
                        <p className="text-sm text-[#10B981] font-semibold mt-1">
                          +{champ.win_margin ? Math.round(Number(champ.win_margin)) : '-'} margin
                        </p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-[#EF4444] font-bold text-lg">{champ.runner_up}</p>
                        <p className="text-xs text-[#64748B]">Runner-Up</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {filteredHistory.length === 0 && (
        <Card className="bg-[#0F172A] border-[#334155]">
          <CardContent className="py-12 text-center">
            <Basketball size={64} className="mx-auto mb-4 text-[#64748B] opacity-50" />
            <p className="text-[#64748B] text-lg">
              {searchTerm || seasonFilter !== 'all' ? 'No championships match your filters' : 'No championship history available'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default History;
