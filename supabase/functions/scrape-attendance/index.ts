import { corsHeaders } from '../_shared/cors.ts';

interface AttendanceRequest {
  username: string;
  password: string;
}

interface Subject {
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

interface AttendanceData {
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

const COLLEGE_LOGIN_URL = "https://samvidha.iare.ac.in/";
const ATTENDANCE_URL = "https://samvidha.iare.ac.in/home?action=course_content";

async function scrapeAttendanceData(username: string, password: string): Promise<AttendanceData | { error: string }> {
  try {
    // First, get the login page to extract any CSRF tokens
    const loginPageResponse = await fetch(COLLEGE_LOGIN_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!loginPageResponse.ok) {
      throw new Error('Failed to access login page');
    }

    const loginPageHtml = await loginPageResponse.text();
    
    // Extract any hidden form fields or CSRF tokens
    const hiddenInputs: Record<string, string> = {};
    const hiddenInputMatches = loginPageHtml.matchAll(/<input[^>]*type=["']hidden["'][^>]*>/gi);
    for (const match of hiddenInputMatches) {
      const nameMatch = match[0].match(/name=["']([^"']+)["']/);
      const valueMatch = match[0].match(/value=["']([^"']+)["']/);
      if (nameMatch && valueMatch) {
        hiddenInputs[nameMatch[1]] = valueMatch[1];
      }
    }

    // Prepare login form data
    const formData = new URLSearchParams();
    formData.append('txt_uname', username);
    formData.append('txt_pwd', password);
    
    // Add any hidden fields
    Object.entries(hiddenInputs).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Submit login form
    const loginResponse = await fetch(COLLEGE_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': COLLEGE_LOGIN_URL
      },
      body: formData.toString(),
      redirect: 'manual' // Handle redirects manually to check for success
    });

    // Check if login was successful
    if (loginResponse.status === 302 || loginResponse.url?.includes('home')) {
      // Login successful, now fetch attendance data
      const attendanceResponse = await fetch(ATTENDANCE_URL, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': loginResponse.headers.get('set-cookie') || ''
        }
      });

      if (!attendanceResponse.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const attendanceHtml = await attendanceResponse.text();
      return parseAttendanceData(attendanceHtml);
    } else {
      return { error: 'Invalid username or password' };
    }
  } catch (error) {
    console.error('Scraping error:', error);
    return { error: `Failed to fetch attendance data: ${error.message}` };
  }
}

function parseAttendanceData(html: string): AttendanceData {
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

  // Extract table rows from HTML
  const tableRowMatches = html.matchAll(/<tr[^>]*>(.*?)<\/tr>/gis);
  
  for (const rowMatch of tableRowMatches) {
    const rowHtml = rowMatch[1];
    const text = rowHtml.replace(/<[^>]*>/g, '').trim().toUpperCase();
    
    if (!text || text.startsWith("S.NO") || text.includes("TOPICS COVERED")) {
      continue;
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
      continue;
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
        const dateStr = normalizeDate(dateMatch[1]);
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
  }

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
  calculateStreakAndDays(result, dateAttendance);

  return result;
}

function normalizeDate(dateStr: string): string | null {
  try {
    let cleanDate = dateStr.replace(',', '').trim();
    let dt: Date;

    if (/\d{1,2}\s[A-Za-z]{3}\s\d{4}/.test(cleanDate)) {
      dt = new Date(cleanDate);
    } else if (/\d{1,2}\s[A-Za-z]{3}/.test(cleanDate)) {
      dt = new Date(`${cleanDate} 2025`);
    } else if (/\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(cleanDate)) {
      const parts = cleanDate.replace('/', '-').split('-');
      dt = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      return null;
    }

    const day = dt.getDate().toString().padStart(2, '0');
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const year = dt.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return null;
  }
}

function calculateStreakAndDays(result: AttendanceData, dateAttendance: Record<string, { present: number; absent: number }>) {
  if (!Object.keys(dateAttendance).length) return;

  try {
    const sortedDates = Object.keys(dateAttendance).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('-').map(Number);
      const [dayB, monthB, yearB] = b.split('-').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { username, password }: AttendanceRequest = await req.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const attendanceData = await scrapeAttendanceData(username, password);

    return new Response(JSON.stringify(attendanceData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in scrape-attendance function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});