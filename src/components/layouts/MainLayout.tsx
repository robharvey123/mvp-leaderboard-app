import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import MainHeader from '@/components/common/MainHeader';
import MainFooter from '@/components/common/MainFooter';

export default function MainLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MainHeader />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <Outlet />
      </main>
      <MainFooter />
    </div>
  );
}