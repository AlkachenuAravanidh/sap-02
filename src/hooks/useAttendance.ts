import { useState, useEffect } from 'react';
import { AttendanceData } from '../types/attendance';
import { attendanceService } from '../services/attendanceService';

export const useAttendance = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = async () => {
    setIsLoading(true);
    setError(null);
    
    try {

      const data = await attendanceService.getAttendanceData();
      if ('error' in data) {
        throw new Error(data.error);
      }

      setAttendanceData(data);
      localStorage.setItem('attendanceData', JSON.stringify(data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attendance data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoredData = () => {
    const stored = localStorage.getItem('attendanceData');
    if (stored) {
      setAttendanceData(JSON.parse(stored));
    }
  };

  useEffect(() => {
    loadStoredData();
  }, []);

  return {
    attendanceData,
    isLoading,
    error,
    fetchAttendance,
    refreshData: loadStoredData
  };
};