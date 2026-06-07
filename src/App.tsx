import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PredictionsProvider } from './contexts/PredictionsContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Predict from './pages/Predict';
import Standings from './pages/Standings';
import Bracket from './pages/Bracket';
import Leaderboard from './pages/Leaderboard';
import Leagues from './pages/Leagues';
import Profile from './pages/Profile';
import Rules from './pages/Rules';
import Admin from './pages/Admin';
import UserView from './pages/UserView';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/predict" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="predict" element={<Predict />} />
        <Route path="standings" element={<Standings />} />
        <Route path="bracket" element={<Bracket />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="user/:userId" element={<UserView />} />
        <Route path="leagues" element={<Leagues />} />
        <Route path="profile" element={<Profile />} />
        <Route path="rules" element={<Rules />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PredictionsProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </PredictionsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
