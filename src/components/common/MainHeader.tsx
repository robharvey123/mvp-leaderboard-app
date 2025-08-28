import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export default function MainHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'Players', href: '/players' },
    { name: 'Matches', href: '/matches' },
    { name: 'Scorecard Analysis', href: '/scorecard-analysis' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-900 dark:from-blue-900 dark:to-blue-950 shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex flex-shrink-0 items-center">
            <Link to="/" className="text-xl font-bold text-white">
              Brookweald CC MVP
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map(link => (
              <Link
                key={link.name}
                to={link.href}
                className={`${
                  location.pathname === link.href
                    ? 'text-white border-b-2 border-white'
                    : 'text-blue-100 hover:text-white'
                } px-3 py-2 text-sm font-medium`}
              >
                {link.name}
              </Link>
            ))}
            {isAdmin() && (
              <Link
                to="/admin"
                className={`${
                  location.pathname.startsWith('/admin')
                    ? 'text-white border-b-2 border-white'
                    : 'text-blue-100 hover:text-white'
                } px-3 py-2 text-sm font-medium`}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-white dark:text-gray-100">Welcome, {user.name}</span>
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-white hover:bg-blue-800 dark:bg-blue-900 dark:hover:bg-blue-950">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild className="text-white hover:bg-blue-800 dark:bg-blue-900 dark:hover:bg-blue-950">
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-100 hover:text-white hover:bg-blue-800 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navLinks.map(link => (
              <Link
                key={link.name}
                to={link.href}
                className={`${
                  location.pathname === link.href
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                } block rounded-md px-3 py-2 text-base font-medium`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {isAdmin() && (
              <Link
                to="/admin"
                className={`${
                  location.pathname.startsWith('/admin')
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                } block rounded-md px-3 py-2 text-base font-medium`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
          {user ? (
            <div className="border-t border-blue-800 pt-4 pb-3">
              <div className="flex items-center px-5">
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{user.name}</div>
                  <div className="text-sm font-medium text-blue-100">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-blue-800 pt-4 pb-3 px-2 space-y-1">
              <Link
                to="/login"
                className="block rounded-md px-3 py-2 text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block rounded-md px-3 py-2 text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}