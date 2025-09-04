import React from 'react';
import { Calendar, TrendingUp, Users, Clock, Target, Award, RefreshCw } from 'lucide-react';
import { AttendanceData } from '../types/attendance';
import { AttendanceCalendar } from './AttendanceCalendar';
import { SubjectCard } from './SubjectCard';
import { StatsCard } from './StatsCard';

interface DashboardProps {
  data: AttendanceData;
  onRefresh?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onRefresh }) => {
  const subjects = Object.values(data.subjects);
  const calendarData = Object.entries(data.dateAttendance).map(([date, attendance]) => ({
    date,
    value: attendance.present > 0 ? 1 : 0
  }));

  return (
    <div className="space-y-8">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Dashboard</h1>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Data</span>
          </button>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Overall Attendance"
          value={`${data.overall.percentage}%`}
          icon={TrendingUp}
          color="indigo"
          subtitle={`${data.overall.present}/${data.overall.present + data.overall.absent} classes`}
        />
        <StatsCard
          title="Current Streak"
          value={`${data.streak} days`}
          icon={Award}
          color="green"
          subtitle="Consecutive attendance"
        />
        <StatsCard
          title="Safe Bunks"
          value={`${data.overall.safeBunkPeriods}`}
          icon={Target}
          color="orange"
          subtitle="Classes you can miss"
        />
        <StatsCard
          title="Total Subjects"
          value={`${subjects.length}`}
          icon={Users}
          color="purple"
          subtitle="Active courses"
        />
      </div>

      {/* Calendar and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Attendance Calendar</h2>
            </div>
            <AttendanceCalendar data={calendarData} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Days Attended</span>
                <span className="font-semibold text-green-600">{data.attendedDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Days Absent</span>
                <span className="font-semibold text-red-600">{data.absentDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Safe Bunk Days</span>
                <span className="font-semibold text-orange-600">{data.safeBunkDays}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Subject-wise Attendance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard key={subject.code} subject={subject} />
          ))}
        </div>
      </div>
    </div>
  );
};