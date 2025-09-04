import React from 'react';
import { User, Calendar, TrendingUp, Target, Award, BookOpen } from 'lucide-react';
import { AttendanceData } from '../types/attendance';
import { useAuth } from '../contexts/AuthContext';

interface ProfileProps {
  data: AttendanceData | null;
}

export const Profile: React.FC<ProfileProps> = ({ data }) => {
  const { user } = useAuth();

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">Please fetch your attendance data first.</p>
        </div>
      </div>
    );
  }

  const subjects = Object.values(data.subjects);
  const bestSubject = subjects.reduce((best, current) => 
    current.percentage > best.percentage ? current : best
  );
  const worstSubject = subjects.reduce((worst, current) => 
    current.percentage < worst.percentage ? current : worst
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.username}</h1>
            <p className="text-gray-600">Student Profile</p>
          </div>
        </div>
      </div>

      {/* Academic Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Best Performance</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Subject</p>
            <p className="font-semibold text-gray-900">{bestSubject.name}</p>
            <p className="text-2xl font-bold text-green-600">{bestSubject.percentage}%</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Needs Attention</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Subject</p>
            <p className="font-semibold text-gray-900">{worstSubject.name}</p>
            <p className="text-2xl font-bold text-orange-600">{worstSubject.percentage}%</p>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Academic Summary</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.overall.present}</p>
            <p className="text-sm text-gray-600">Classes Attended</p>
          </div>
          
          <div className="text-center">
            <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.overall.absent}</p>
            <p className="text-sm text-gray-600">Classes Missed</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.streak}</p>
            <p className="text-sm text-gray-600">Day Streak</p>
          </div>
          
          <div className="text-center">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.overall.safeBunkPeriods}</p>
            <p className="text-sm text-gray-600">Safe Bunks</p>
          </div>
        </div>
      </div>

      {/* Subject Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Subject Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Subject</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Present</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Absent</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Percentage</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Safe Bunks</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.code} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{subject.code}</p>
                      <p className="text-sm text-gray-600 truncate max-w-[200px]">{subject.name}</p>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4 text-green-600 font-medium">{subject.present}</td>
                  <td className="text-center py-3 px-4 text-red-600 font-medium">{subject.absent}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`font-bold ${
                      subject.percentage >= 75 ? 'text-green-600' :
                      subject.percentage >= 65 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {subject.percentage}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-orange-600 font-medium">{subject.safeBunkPeriods}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};