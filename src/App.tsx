import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import { Dashboard } from './pages/Dashboard';
import { DashboardScreen } from './pages/DashboardScreen';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UserReviewPage } from './pages/UserReviewPage';

type AppPage = 'dashboard' | 'screen' | 'login' | 'register' | 'review';

export default function App() {
  const [page, setPage] = useState<AppPage>('dashboard');

  return (
    <AuthProvider>
      <DashboardProvider>
        {page === 'login' ? (
          <LoginPage
            onDone={() => setPage('dashboard')}
            onRegister={() => setPage('register')}
          />
        ) : null}
        {page === 'register' ? (
          <RegisterPage
            onDone={() => setPage('dashboard')}
            onLogin={() => setPage('login')}
          />
        ) : null}
        {page === 'review' ? (
          <UserReviewPage onBack={() => setPage('dashboard')} />
        ) : null}
        {page === 'dashboard' ? (
          <Dashboard
            onEnterScreen={() => setPage('screen')}
            onLogin={() => setPage('login')}
            onRegister={() => setPage('register')}
            onReview={() => setPage('review')}
          />
        ) : null}
        {page === 'screen' ? (
          <DashboardScreen onBack={() => setPage('dashboard')} />
        ) : null}
      </DashboardProvider>
    </AuthProvider>
  );
}
