import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Home, Trophy, Users, Settings, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const location = useLocation();
  
  const routes = [
    {
      name: 'Home',
      path: '/',
      icon: <Home className="h-4 w-4 mr-2" />
    },
    {
      name: 'Leaderboard',
      path: '/leaderboard',
      icon: <Trophy className="h-4 w-4 mr-2" />
    },
    {
      name: 'Scorecard Analysis',
      path: '/scorecard-analysis',
      icon: <FileText className="h-4 w-4 mr-2" />
    },
    {
      name: 'Admin',
      path: '/admin',
      icon: <Settings className="h-4 w-4 mr-2" />
    }
  ];
  
  return (
    <nav className="flex items-center justify-between px-4 py-3 border-b">
      <div className="flex items-center">
        <Link to="/" className="flex items-center font-bold text-xl">
          <span className="text-primary mr-1">BW</span>
          <span>Cricket Club</span>
        </Link>
      </div>
      
      <div className="hidden md:flex space-x-1">
        {routes.map((route) => (
          <Button
            key={route.path}
            variant={location.pathname === route.path ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              "transition-colors",
              location.pathname === route.path 
                ? "" 
                : "text-muted-foreground hover:text-foreground"
            )}
            asChild
          >
            <Link to={route.path}>
              {route.icon}
              {route.name}
            </Link>
          </Button>
        ))}
      </div>
      
      <div className="flex items-center space-x-2">
        <ThemeToggle />
      </div>
    </nav>
  );
}