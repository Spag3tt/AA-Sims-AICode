import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trophy, 
  ArrowUp, 
  ArrowDown,
  Minus,
  Basketball,
  ArrowsClockwise
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Standings = () => {
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState({ A: [], B: [], C: [] });
  const [activeDivision, setActiveDivision] = useState('A');
  const [refreshing, setRefreshing] = useState(false);

  const fetchStandings = async () => {
    try {
      const response = await axios.get(`${API}/standings`, { withCredentials: true });
      setStandings(response.data.standings || { A: [], B: [], C: [] });
    } catch (error) {
      console.error('Error fetching standings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStandings(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await axios.post(`${API}/cache/refresh`, {}, { withCredentials: true });
      await fetchStandings();
    } catch (error) {
      console.error('Error refreshing:', error);
      setRefreshing(false);
    }
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
            Division Standings
          </h1>
          <p className="text-[#9CA3AF] mt-1">Season 5, Week 2</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-[#334155] text-[#9CA3AF] hover:text-white hover:bg-[#1E293B]"
          data-testid="refresh-standings-btn"
        >
          <ArrowsClockwise size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="A" value={activeDivision} onValueChange={setActiveDivision}>
        <TabsList className="bg-[#0A101C] border border-[#334155] p-1">
          {['A', 'B', 'C'].map((div) => (
            <TabsTrigger
              key={div}
              value={div}
              className="data-[state=active]:bg-[#1E293B] data-[state=active]:text-white text-[#9CA3AF] px-6"
              data-testid={`tab-division-${div}`}
            >
              <div className={`w-6 h-6 rounded bg-gradient-to-br ${getDivisionColor(div)} flex items-center justify-center mr-2`}>
                <span className="text-xs font-bold text-white">{div}</span>
              </div>
              Division {div}
            </TabsTrigger>
          ))}
        </TabsList>

        {['A', 'B', 'C'].map((div) => (
          <TabsContent key={div} value={div} className="mt-6">
            <Card className="bg-[#0F172A] border-[#334155]">
              <CardHeader className="border-b border-[#334155]">
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getDivisionColor(div)} flex items-center justify-center`}>
                    <Trophy size={24} weight="fill" className="text-white" />
                  </div>
                  <div>
                    <span className="font-heading text-2xl font-bold text-white">Division {div}</span>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs text-[#10B981] flex items-center gap-1">
                        <ArrowUp size={12} /> Top 3 promoted
                      </span>
                      <span className="text-xs text-[#EF4444] flex items-center gap-1">
                        <ArrowDown size={12} /> Bottom 3 {div === 'C' ? 'eliminated' : 'relegated'}
                      </span>
                    </div>
                  </div>
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
                      {(standings[div] || []).map((team, idx) => (
                        <TableRow 
                          key={idx}
                          className={`border-b border-[#334155] hover:bg-[#1E293B] transition-colors ${getRowClass(idx, standings[div]?.length || 8)}`}
                        >
                          <TableCell className="font-mono text-[#64748B]">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-white">{team.team}</TableCell>
                          <TableCell className="text-center font-mono text-[#10B981]">{team.wins}</TableCell>
                          <TableCell className="text-center font-mono text-[#EF4444]">{team.losses}</TableCell>
                          <TableCell className="text-center font-mono text-[#9CA3AF]">
                            {typeof team.ppg === 'number' ? team.ppg.toFixed(1) : team.ppg || '-'}
                          </TableCell>
                          <TableCell className="text-center font-mono text-[#9CA3AF]">
                            {team.division_movement_score || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!standings[div] || standings[div].length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <Basketball size={48} className="mx-auto mb-4 text-[#64748B] opacity-50" />
                            <p className="text-[#64748B]">No standings data available</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-l-2 border-[#10B981]"></div>
          <span className="text-[#9CA3AF]">Promotion Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-l-2 border-[#EF4444]"></div>
          <span className="text-[#9CA3AF]">Relegation Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#64748B]">PPG = Points Per Game</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#64748B]">Div Score = Division Movement Score</span>
        </div>
      </div>
    </div>
  );
};

export default Standings;
