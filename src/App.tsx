import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { LabRecords } from './components/LabRecords';
import { Profile } from './components/Profile';
import { Navigation } from './components/Navigation';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useAttendance } from './hooks/useAttendance';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { attendanceData, isLoading, error, fetchAttendance } = useAttendance();
  const [currentView, setCurrentView] = useState<'dashboard' | 'lab' | 'profile'>('dashboard');
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  useEffect(() => {
    if (user && !hasInitialLoad && !attendanceData) {
      // Auto-fetch attendance data on login if not already available
      const storedData = localStorage.getItem('attendanceData');
      if (!storedData) {
        // In a real app, you'd have stored credentials securely
        // For now, we'll just load stored data if available
        setHasInitialLoad(true);
      } else {
        setHasInitialLoad(true);
      }
    }
  }, [user, hasInitialLoad, attendanceData]);

  if (!user) {
    return <LoginForm />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Fetching your attendance data..." />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return attendanceData ? <Dashboard data={attendanceData} /> : (
          <div className="text-center py-12">
            <p className="text-gray-600">No attendance data available. Please refresh or contact support.</p>
          </div>
        );
      case 'lab':
        return <LabRecords />;
      case 'profile':
        return <Profile data={attendanceData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {renderCurrentView()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;