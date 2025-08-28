import { Link } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Settings, Bell } from 'lucide-react';

export default function AdminHeader() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-slate-900 shadow">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/admin" className="text-xl font-bold text-white">
                Brookweald CC <span className="text-yellow-400">Admin</span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-gray-300 hover:text-white">
              <Bell className="h-5 w-5" />
            </button>
            <button className="text-gray-300 hover:text-white">
              <Settings className="h-5 w-5" />
            </button>
            
            <div className="ml-3 relative flex items-center">
              <span className="text-sm text-white mr-3">
                {user?.name || 'Admin User'}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="text-white hover:bg-slate-800 border-slate-700"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}