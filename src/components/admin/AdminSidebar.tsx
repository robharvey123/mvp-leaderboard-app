import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  TrophyIcon, 
  UsersIcon, 
  CalendarIcon, 
  ClipboardCheckIcon, 
  SettingsIcon,
  FileTextIcon
} from 'lucide-react';

export default function AdminSidebar() {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Matches', href: '/admin/matches', icon: CalendarIcon },
    { name: 'Players', href: '/admin/players', icon: UsersIcon },
    { name: 'Back to Site', href: '/', icon: FileTextIcon },
  ];

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 lg:z-40 lg:bg-slate-800">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
                            (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-yellow-400' : 'text-slate-400 group-hover:text-slate-300'
                  } mr-3 flex-shrink-0 h-5 w-5`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}