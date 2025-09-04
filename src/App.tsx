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
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (user && !attendanceData && !isInitializing) {
      // Auto-fetch attendance data on login
      const storedData = localStorage.getItem('attendanceData');
      if (!storedData) {
        setIsInitializing(true);
        fetchAttendance().finally(() => setIsInitializing(false));
      }
    }
  }, [user, attendanceData, isInitializing, fetchAttendance]);

  if (!user) {
    return <LoginForm />;
  }

  if (isLoading || isInitializing) {
    return <LoadingSpinner message="Fetching your attendance data..." />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return attendanceData ? (
          <Dashboard data={attendanceData} onRefresh={fetchAttendance} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No attendance data available.</p>
            <button
              onClick={fetchAttendance}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              Fetch Attendance Data
            </button>
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
            <div className="flex items-center justify-between">
              <p className="text-red-700">{error}</p>
              <button
                onClick={fetchAttendance}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors duration-200"
              >
                Retry
              </button>
            </div>
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