import { AttendanceData } from '../types/attendance';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

class AttendanceService {
  private credentials: { username: string; password: string } | null = null;

  async login(username: string, password: string): Promise<boolean> {
    try {
      // Store credentials for later use
      this.credentials = { username, password };
      
      // Test login by attempting to fetch attendance data
      const result = await this.getAttendanceData();
      return !('error' in result);
    } catch (error) {
      console.error('Login failed:', error);
      this.credentials = null;
      return false;
    }
  }

  async getAttendanceData(): Promise<AttendanceData | { error: string }> {
    if (!this.credentials) {
      return { error: 'Not logged in' };
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          username: this.credentials.username,
          password: this.credentials.password
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if ('error' in data) {
        return { error: data.error };
      }

      return data as AttendanceData;
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
      return { error: 'Failed to fetch attendance data. Please try again.' };
    }
  }

  logout() {
    this.credentials = null;
  }
}

export const attendanceService = new AttendanceService();