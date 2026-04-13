import React from 'react';
import { useAuth } from '../App';
import { Button } from '../components/ui/button';
import { 
  Trophy, 
  ChartLineUp, 
  Target, 
  Medal,
  GoogleLogo,
  ArrowRight,
  Basketball
} from '@phosphor-icons/react';

const Landing = () => {
  const { login, user, loading } = useAuth();

  // If user is already logged in, redirect to dashboard
  if (!loading && user) {
    window.location.href = '/dashboard';
    return null;
  }

  const features = [
    {
      icon: ChartLineUp,
      title: "Live Standings",
      description: "Track all 3 divisions with real-time stats, PPG, PAPG, and win rates updated from Google Sheets."
    },
    {
      icon: Trophy,
      title: "Championship History",
      description: "Explore complete records of every season's champions, scores, and tournament brackets."
    },
    {
      icon: Target,
      title: "Bracket Predictions",
      description: "Predict tournament outcomes every 10 seasons for the mega 24-team March Madness style bracket."
    },
    {
      icon: Medal,
      title: "Global Leaderboard",
      description: "Compete with others to prove you're the best predictor with our real-time leaderboard system."
    }
  ];

  return (
    <div className="min-h-screen bg-[#05080F]">
      {/* Hero Section */}
      <div className="hero-background min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Basketball size={40} weight="duotone" className="text-[#FF5722]" />
            <span className="font-heading text-2xl font-bold tracking-tight text-white">
              NCAA SIM
            </span>
          </div>
          <Button 
            onClick={login}
            className="bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold uppercase tracking-wider"
            data-testid="header-login-btn"
          >
            Sign In
          </Button>
        </header>

        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.1s' }}>
              <span className="inline-block px-4 py-2 bg-[#FF5722]/20 text-[#FF5722] rounded-full text-sm font-semibold uppercase tracking-wider mb-6">
                Season 5 Now Live
              </span>
            </div>
            
            <h1 className="font-heading text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s' }}>
              NCAA GAME
              <span className="block text-[#FF5722]">SIMULATION</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#9CA3AF] max-w-2xl mx-auto mb-10 animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s' }}>
              Track 24 teams across 3 divisions. Follow the action as teams fight for promotion, 
              battle against relegation, and compete in epic tournaments every season.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up opacity-0" style={{ animationDelay: '0.4s' }}>
              <Button 
                onClick={login}
                size="lg"
                className="bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold uppercase tracking-wider px-8 py-6 text-lg group animate-pulse-glow"
                data-testid="hero-login-btn"
              >
                <GoogleLogo size={24} weight="bold" className="mr-2" />
                Sign in with Google
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Stats Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 animate-fade-in-up opacity-0" style={{ animationDelay: '0.5s' }}>
              {[
                { value: '24', label: 'Active Teams' },
                { value: '5', label: 'Seasons Played' },
                { value: '3', label: 'Divisions' },
                { value: '7', label: 'Weeks/Season' },
              ].map((stat, i) => (
                <div key={i} className="bg-[#0F172A]/80 backdrop-blur border border-[#334155] rounded-lg p-4">
                  <p className="font-heading text-3xl md:text-4xl font-bold text-[#FF5722]">{stat.value}</p>
                  <p className="text-sm text-[#9CA3AF]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="pb-8 text-center animate-bounce">
          <span className="text-[#64748B] text-sm">Scroll to explore</span>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 px-6 bg-[#0A101C]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-[#9CA3AF] text-center max-w-2xl mx-auto mb-12">
            A complete simulation tracking experience with real-time stats, historical data, and prediction games.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={i}
                  className="bg-[#0F172A] border border-[#334155] rounded-lg p-6 card-hover"
                  data-testid={`feature-card-${i}`}
                >
                  <div className="w-12 h-12 bg-[#FF5722]/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon size={24} weight="duotone" className="text-[#FF5722]" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-[#9CA3AF] text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Division Explanation */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white text-center mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Division A */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
                <Trophy size={40} weight="fill" className="text-white" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-yellow-400 mb-2">Division A</h3>
              <p className="text-[#9CA3AF]">
                The elite 8. Top 3 compete for the championship trophy. Bottom 3 get relegated to Division B.
              </p>
            </div>

            {/* Division B */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
                <ChartLineUp size={40} weight="fill" className="text-white" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-gray-300 mb-2">Division B</h3>
              <p className="text-[#9CA3AF]">
                The proving ground. Top 3 get promoted to A. Bottom 3 drop to C. Fight for your spot.
              </p>
            </div>

            {/* Division C */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center">
                <Target size={40} weight="fill" className="text-white" />
              </div>
              <h3 className="font-heading text-2xl font-bold text-amber-600 mb-2">Division C</h3>
              <p className="text-[#9CA3AF]">
                Survival mode. Top 3 climb to B. Bottom 3 are eliminated forever, replaced by new teams.
              </p>
            </div>
          </div>

          {/* Tournament Info */}
          <div className="mt-16 bg-[#0F172A] border border-[#334155] rounded-lg p-8 text-center">
            <h3 className="font-heading text-2xl font-bold text-[#FF5722] mb-4">
              Mega Tournament Every 10 Seasons
            </h3>
            <p className="text-[#9CA3AF] max-w-2xl mx-auto">
              All 24 teams compete in a March Madness style bracket. Make your predictions 
              and compete on the global leaderboard to prove you know the game better than anyone.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#0A101C] to-[#05080F]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Join?
          </h2>
          <p className="text-[#9CA3AF] mb-8">
            Sign in with Google to start tracking your favorite teams and making predictions.
          </p>
          <Button 
            onClick={login}
            size="lg"
            className="bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold uppercase tracking-wider px-8 py-6 text-lg"
            data-testid="cta-login-btn"
          >
            <GoogleLogo size={24} weight="bold" className="mr-2" />
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#334155]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Basketball size={24} weight="duotone" className="text-[#FF5722]" />
            <span className="font-heading font-bold text-white">NCAA SIM</span>
          </div>
          <p className="text-[#64748B] text-sm">
            Data synced from Google Sheets
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
