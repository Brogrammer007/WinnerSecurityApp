import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Učitavanje...</div>
      </div>
    );
  }

  // Not logged in - go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in - redirect based on role
  // We use 'user' directly as it contains the role in our local store implementation
  const redirectPath = user.role === 'admin' ? '/dashboard/admin' : '/dashboard/worker';
  return <Navigate to={redirectPath} replace />;
};

export default Index;
