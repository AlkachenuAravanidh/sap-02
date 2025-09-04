import React from 'react';
import { BookOpen, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Subject } from '../types/attendance';

interface SubjectCardProps {
  subject: Subject;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 65) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPercentageIcon = (percentage: number) => {
    if (percentage >= 75) return TrendingUp;
    if (percentage >= 65) return AlertTriangle;
    return TrendingDown;
  };

  const PercentageIcon = getPercentageIcon(subject.percentage);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{subject.code}</h3>
            <p className="text-sm text-gray-600 truncate max-w-[200px]" title={subject.name}>
              {subject.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <PercentageIcon className={`w-4 h-4 ${getPercentageColor(subject.percentage)}`} />
          <span className={`text-lg font-bold ${getPercentageColor(subject.percentage)}`}>
            {subject.percentage}%
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Present</span>
          <span className="font-medium text-green-600">{subject.present}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Absent</span>
          <span className="font-medium text-red-600">{subject.absent}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Safe Bunks</span>
          <span className="font-medium text-orange-600">{subject.safeBunkPeriods}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              subject.percentage >= 75 ? 'bg-green-500' :
              subject.percentage >= 65 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(subject.percentage, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};