import { useState } from 'react';
import { DashboardProvider } from './context/DashboardContext';
import { Dashboard } from './pages/Dashboard';
import { DashboardScreen } from './pages/DashboardScreen';

export default function App() {
  const [screenMode, setScreenMode] = useState<'dashboard' | 'screen'>(
    'dashboard',
  );

  return (
    <DashboardProvider>
      {screenMode === 'dashboard' ? (
        <Dashboard onEnterScreen={() => setScreenMode('screen')} />
      ) : (
        <DashboardScreen onBack={() => setScreenMode('dashboard')} />
      )}
    </DashboardProvider>
  );
}
