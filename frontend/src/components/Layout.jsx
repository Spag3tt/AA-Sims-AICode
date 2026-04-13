import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import {
  Trophy,
  ChartLineUp,
  UsersThree,
  ClockCounterClockwise,
  Target,
  Medal,
  House,
  SignOut,
  List,
  X,
  CaretDown,
  Basketball
} from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: House },
    { path: '/standings', label: 'Standings', icon: ChartLineUp },
    { path: '/all-time', label: 'All-Time Rankings', icon: Trophy },
    { path: '/history', label: 'Championship History', icon: ClockCounterClockwise },
    { path: '/predictions', label: 'Predictions', icon: Target },
    { path: '/leaderboard', label: 'Leaderboard', icon: Medal },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#05080F] flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 
        bg-[#0A101C] border-r border-[#334155]
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[#334155]">
          <Link to="/dashboard" className="flex items-center gap-3" data-testid="logo-link">
            <Basketball size={32} weight="duotone" className="text-[#FF5722]" />
            <span className="font-heading text-xl font-bold tracking-tight text-white">
              NCAA SIM
            </span>
          </Link>
          <button 
            className="ml-auto lg:hidden text-[#9CA3AF] hover:text-white"
            onClick={() => setSidebarOpen(false)}
            data-testid="close-sidebar-btn"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.path.replace('/', '')}`}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isActive(item.path) 
                    ? 'bg-[#1E293B] text-white border-l-4 border-[#FF5722] -ml-[4px] pl-[calc(1rem+4px)]' 
                    : 'text-[#9CA3AF] hover:bg-[#1E293B] hover:text-white'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} weight={isActive(item.path) ? 'duotone' : 'regular'} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Season Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#334155]">
          <div className="bg-[#111827] rounded-lg p-4">
            <p className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Current Season</p>
            <p className="font-heading text-2xl font-bold text-white">Season 5</p>
            <p className="text-sm text-[#9CA3AF]">Week 2 of 7</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-[#05080F]/90 backdrop-blur-xl border-b border-[#334155] sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
          {/* Mobile menu button */}
          <button 
            className="lg:hidden text-[#9CA3AF] hover:text-white"
            onClick={() => setSidebarOpen(true)}
            data-testid="open-sidebar-btn"
          >
            <List size={24} />
          </button>

          {/* Page title - could be dynamic */}
          <h1 className="font-heading text-lg md:text-xl font-semibold text-white hidden md:block">
            NCAA Game Simulation
          </h1>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 text-[#9CA3AF] hover:text-white hover:bg-[#1E293B]"
                  data-testid="user-menu-btn"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback className="bg-[#FF5722] text-white text-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline font-medium">{user?.name}</span>
                  <CaretDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#0F172A] border-[#334155]">
                <DropdownMenuItem 
                  className="text-[#9CA3AF] hover:text-white hover:bg-[#1E293B] cursor-pointer"
                  onClick={handleLogout}
                  data-testid="logout-btn"
                >
                  <SignOut size={16} className="mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
