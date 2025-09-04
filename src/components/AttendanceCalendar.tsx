import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

interface CalendarData {
  date: string;
  value: number;
}

interface AttendanceCalendarProps {
  data: CalendarData[];
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ data }) => {
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAttendanceForDate = (date: Date) => {
    const dateStr = format(date, 'dd-MM-yyyy');
    const isoDateStr = format(date, 'yyyy-MM-dd');
    return data.find(d => d.date === isoDateStr || d.date === dateStr);
  };

  const getDateColor = (date: Date) => {
    const attendance = getAttendanceForDate(date);
    if (!attendance) return 'bg-gray-100';
    return attendance.value > 0 ? 'bg-green-500' : 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        
        {days.map(day => {
          const attendance = getAttendanceForDate(day);
          const isToday = isSameDay(day, currentDate);
          
          return (
            <div
              key={day.toISOString()}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-lg transition-all duration-200
                ${isSameMonth(day, currentDate) ? 'text-gray-900' : 'text-gray-400'}
                ${isToday ? 'ring-2 ring-indigo-500' : ''}
                ${getDateColor(day)}
                ${attendance ? 'text-white font-medium' : 'hover:bg-gray-200'}
              `}
              title={attendance ? `${attendance.value > 0 ? 'Present' : 'Absent'} on ${format(day, 'dd MMM yyyy')}` : ''}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">Present</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">Absent</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-100 rounded border"></div>
          <span className="text-gray-600">No Class</span>
        </div>
      </div>
    </div>
  );
};