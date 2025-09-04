import axios from 'axios';
import * as cheerio from 'cheerio';
import { AttendanceData, Subject } from '../types/attendance';
import { format, parse } from 'date-fns';

const COLLEGE_LOGIN_URL = "https://samvidha.iare.ac.in/";
const ATTENDANCE_URL = "https://samvidha.iare.ac.in/home?action=course_content";

class AttendanceService {
  private session: any;

  constructor() {
    this.session = axios.create({
      timeout: 30000,
      withCredentials: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      // Get login page to extract any required tokens
      const loginPageResponse = await this.session.get(COLLEGE_LOGIN_URL);
      const $ = cheerio.load(loginPageResponse.data);
      
      // Extract any CSRF tokens or hidden fields
      const hiddenInputs: Record<string, string> = {};
      $('input[type="hidden"]').each((_, element) => {
        const name = $(element).attr('name');
        const value = $(element).attr('value');
        if (name && value) {
          hiddenInputs[name] = value;
        }
      });

      // Prepare login data
      const loginData = {
        txt_uname: username,
        txt_pwd: password,
        ...hiddenInputs
      };

      // Submit login form
      const loginResponse = await this.session.post(COLLEGE_LOGIN_URL, loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': COLLEGE_LOGIN_URL
        }
      });

      // Check if login was successful by looking for redirect or success indicators
      return loginResponse.request.res.responseUrl?.includes('home') || 
             loginResponse.data.includes('dashboard') ||
             loginResponse.data.includes('Course Content');
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async getAttendanceData(): Promise<AttendanceData | { error: string }> {
    try {
      const response = await this.session.get(ATTENDANCE_URL);
      const $ = cheerio.load(response.data);
      
      return this.parseAttendanceData($);
    } catch (error) {
      console.error('Attendance fetch error:', error);
      return { error: 'Failed to fetch attendance data' };
    }
  }

  private parseAttendanceData($: cheerio.CheerioAPI): AttendanceData {
    const result: AttendanceData = {
      subjects: {},
      overall: {
        present: 0,
        absent: 0,
        percentage: 0,
        safeBunkPeriods: 0
      },
      dateAttendance: {},
      streak: 0,
      attendedDays: 0,
      absentDays: 0,
      safeBunkDays: 0
    };

    let currentCourse: string | null = null;
    let totalPresent = 0;
    let totalAbsent = 0;
    const dateAttendance: Record<string, { present: number; absent: number }> = {};
    const perCourseDateAttendance: Record<string, Record<string, { present: number; absent: number }>> = {};

    $('tr').each((_, row) => {
      const text = $(row).text().trim().toUpperCase();
      if (!text || text.startsWith("S.NO") || text.includes("TOPICS COVERED")) {
        return;
      }

      // Match course headers
      const courseMatch = text.match(/^(A[A-Z]+\d+|ACDD05)\s*[-:\s]+\s*(.+)$/);
      if (courseMatch) {
        currentCourse = courseMatch[1];
        const courseName = courseMatch[2].trim();
        result.subjects[currentCourse] = {
          code: currentCourse,
          name: courseName,
          present: 0,
          absent: 0,
          percentage: 0,
          safeBunkPeriods: 0,
          attendedDays: 0,
          absentDays: 0,
          safeBunkDays: 0
        };
        perCourseDateAttendance[currentCourse] = {};
        return;
      }

      if (currentCourse) {
        const presentCount = (text.match(/PRESENT/g) || []).length;
        const absentCount = (text.match(/ABSENT/g) || []).length;
        
        result.subjects[currentCourse].present += presentCount;
        result.subjects[currentCourse].absent += absentCount;
        totalPresent += presentCount;
        totalAbsent += absentCount;

        // Parse dates
        const dateMatch = text.match(/(\d{1,2}\s[A-Za-z]{3},?\s\d{4}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}\s[A-Za-z]{3})/);
        if (dateMatch) {
          const dateStr = this.normalizeDate(dateMatch[1]);
          if (dateStr) {
            if (!dateAttendance[dateStr]) {
              dateAttendance[dateStr] = { present: 0, absent: 0 };
            }
            dateAttendance[dateStr].present += presentCount;
            dateAttendance[dateStr].absent += absentCount;

            if (!perCourseDateAttendance[currentCourse][dateStr]) {
              perCourseDateAttendance[currentCourse][dateStr] = { present: 0, absent: 0 };
            }
            perCourseDateAttendance[currentCourse][dateStr].present += presentCount;
            perCourseDateAttendance[currentCourse][dateStr].absent += absentCount;
          }
        }
      }
    });

    // Calculate percentages and metrics
    Object.values(result.subjects).forEach(subject => {
      const total = subject.present + subject.absent;
      if (total > 0) {
        subject.percentage = Math.round((subject.present / total) * 100 * 100) / 100;
      }
      subject.safeBunkPeriods = Math.max(0, Math.floor(subject.present / 3) - subject.absent);
    });

    const overallTotal = totalPresent + totalAbsent;
    if (overallTotal > 0) {
      result.overall = {
        present: totalPresent,
        absent: totalAbsent,
        percentage: Math.round((totalPresent / overallTotal) * 100 * 100) / 100,
        safeBunkPeriods: Math.max(0, Math.floor(totalPresent / 3) - totalAbsent)
      };
    }

    result.dateAttendance = dateAttendance;
    
    // Calculate streak and day metrics
    this.calculateStreakAndDays(result, dateAttendance);

    return result;
  }

  private normalizeDate(dateStr: string): string | null {
    try {
      let cleanDate = dateStr.replace(',', '').trim();
      let dt: Date;

      if (/\d{1,2}\s[A-Za-z]{3}\s\d{4}/.test(cleanDate)) {
        dt = parse(cleanDate, 'd MMM yyyy', new Date());
      } else if (/\d{1,2}\s[A-Za-z]{3}/.test(cleanDate)) {
        dt = parse(`${cleanDate} 2025`, 'd MMM yyyy', new Date());
      } else if (/\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(cleanDate)) {
        cleanDate = cleanDate.replace('/', '-');
        dt = parse(cleanDate, 'd-M-yyyy', new Date());
      } else {
        return null;
      }

      return format(dt, 'dd-MM-yyyy');
    } catch {
      return null;
    }
  }

  private calculateStreakAndDays(result: AttendanceData, dateAttendance: Record<string, { present: number; absent: number }>) {
    if (!Object.keys(dateAttendance).length) return;

    try {
      const sortedDates = Object.keys(dateAttendance).sort((a, b) => {
        const dateA = parse(a, 'dd-MM-yyyy', new Date());
        const dateB = parse(b, 'dd-MM-yyyy', new Date());
        return dateB.getTime() - dateA.getTime();
      });

      let streak = 0;
      for (const date of sortedDates) {
        if (dateAttendance[date].present > 0) {
          streak++;
        } else {
          break;
        }
      }

      result.streak = streak;
      result.attendedDays = Object.values(dateAttendance).filter(d => d.present > 0).length;
      result.absentDays = Object.values(dateAttendance).filter(d => d.present === 0 && d.absent > 0).length;
      result.safeBunkDays = Math.max(0, Math.floor(result.attendedDays / 3) - result.absentDays);
    } catch (error) {
      console.error('Error calculating streak:', error);
    }
  }
}

export const attendanceService = new AttendanceService();