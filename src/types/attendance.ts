export interface Subject {
  code: string;
  name: string;
  present: number;
  absent: number;
  percentage: number;
  safeBunkPeriods: number;
  attendedDays: number;
  absentDays: number;
  safeBunkDays: number;
}

export interface AttendanceData {
  subjects: Record<string, Subject>;
  overall: {
    present: number;
    absent: number;
    percentage: number;
    safeBunkPeriods: number;
  };
  dateAttendance: Record<string, { present: number; absent: number }>;
  streak: number;
  attendedDays: number;
  absentDays: number;
  safeBunkDays: number;
}

export interface LabSubject {
  value: string;
  text: string;
}

export interface LabDate {
  weekNumber: string;
  weekText: string;
  subjectCode: string;
  experimentTitle: string;
  batchNo: string;
  submissionDate: string;
  isAvailable: boolean;
}

export interface User {
  username: string;
  isLoggedIn: boolean;
}