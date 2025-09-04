import React from 'react';
import { BarChart3, Upload, User, LogOut, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentView: 'dashboard' | 'lab' | 'profile';
  onViewChange: (view: 'dashboard' | 'lab' | 'profile') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'lab', label: 'Lab Records', icon: Upload },
    { id: 'profile', label: 'Profile', icon: User }
  ] as const;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">AttendanceTracker</span>
            </div>
            
            <div className="hidden md:flex space-x-1">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onViewChange(id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    currentView === id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};