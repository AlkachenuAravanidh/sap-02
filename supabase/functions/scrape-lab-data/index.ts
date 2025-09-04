import { corsHeaders } from '../_shared/cors.ts';

interface LabSubjectsRequest {
  username: string;
  password: string;
}

interface LabDatesRequest {
  username: string;
  password: string;
  labCode: string;
}

interface LabUploadRequest {
  username: string;
  password: string;
  labCode: string;
  weekNo: string;
  title: string;
  pdfBase64: string;
}

async function getLabSubjects(username: string, password: string) {
  try {
    // Login first
    const loginFormData = new URLSearchParams();
    loginFormData.append('txt_uname', username);
    loginFormData.append('txt_pwd', password);

    const loginResponse = await fetch(COLLEGE_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: loginFormData.toString(),
      redirect: 'manual'
    });

    if (loginResponse.status !== 302) {
      throw new Error('Login failed');
    }

    const cookies = loginResponse.headers.get('set-cookie') || '';

    // Fetch lab record page
    const labResponse = await fetch("https://samvidha.iare.ac.in/home?action=labrecord_std", {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookies
      }
    });

    const labHtml = await labResponse.text();
    
    // Parse lab subjects from select options
    const subjects: Array<{ value: string; text: string }> = [];
    const selectMatches = labHtml.matchAll(/<select[^>]*id=["']sub_code["'][^>]*>(.*?)<\/select>/gis);
    
    for (const selectMatch of selectMatches) {
      const optionsHtml = selectMatch[1];
      const optionMatches = optionsHtml.matchAll(/<option[^>]*value=["']([^"']+)["'][^>]*>(.*?)<\/option>/gi);
      
      for (const optionMatch of optionMatches) {
        const value = optionMatch[1].trim();
        const text = optionMatch[2].replace(/<[^>]*>/g, '').trim();
        
        if (value && !text.toLowerCase().includes('select')) {
          subjects.push({ value, text });
        }
      }
    }

    return subjects;
  } catch (error) {
    console.error('Error fetching lab subjects:', error);
    return [];
  }
}

async function getLabDates(username: string, password: string, labCode: string) {
  try {
    // Login and get cookies
    const loginFormData = new URLSearchParams();
    loginFormData.append('txt_uname', username);
    loginFormData.append('txt_pwd', password);

    const loginResponse = await fetch(COLLEGE_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: loginFormData.toString(),
      redirect: 'manual'
    });

    const cookies = loginResponse.headers.get('set-cookie') || '';

    // Submit lab code to get dates
    const labFormData = new URLSearchParams();
    labFormData.append('sub_code', labCode);

    const labResponse = await fetch("https://samvidha.iare.ac.in/home?action=labrecord_std", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookies
      },
      body: labFormData.toString()
    });

    const labHtml = await labResponse.text();
    
    // Parse lab dates from table
    const dates: Array<{
      weekNumber: string;
      weekText: string;
      subjectCode: string;
      experimentTitle: string;
      batchNo: string;
      submissionDate: string;
      isAvailable: boolean;
    }> = [];

    const currentDate = new Date();
    const tableMatches = labHtml.matchAll(/<tr[^>]*>(.*?)<\/tr>/gis);
    
    for (const tableMatch of tableMatches) {
      const rowHtml = tableMatch[1];
      const cellMatches = rowHtml.matchAll(/<td[^>]*>(.*?)<\/td>/gi);
      const cells = Array.from(cellMatches).map(match => 
        match[1].replace(/<[^>]*>/g, '').trim()
      );

      if (cells.length >= 5) {
        const weekText = cells[0];
        const subjectCode = cells[1];
        const experimentTitle = cells[2];
        const batchNo = cells[3];
        const submissionDate = cells[4];

        const weekMatch = weekText.match(/Week-?(\d+)/i);
        if (weekMatch && experimentTitle && submissionDate) {
          let isAvailable = true;
          try {
            if (submissionDate.includes('-')) {
              const [day, month, year] = submissionDate.split('-').map(Number);
              const submissionDt = new Date(year, month - 1, day);
              isAvailable = submissionDt >= currentDate;
            }
          } catch {
            isAvailable = true;
          }

          dates.push({
            weekNumber: weekMatch[1],
            weekText,
            subjectCode,
            experimentTitle,
            batchNo,
            submissionDate,
            isAvailable
          });
        }
      }
    }

    return dates;
  } catch (error) {
    console.error('Error fetching lab dates:', error);
    return [];
  }
}

const COLLEGE_LOGIN_URL = "https://samvidha.iare.ac.in/";

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
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'subjects') {
      const { username, password }: LabSubjectsRequest = await req.json();
      const subjects = await getLabSubjects(username, password);
      
      return new Response(JSON.stringify({ subjects }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'dates') {
      const { username, password, labCode }: LabDatesRequest = await req.json();
      const dates = await getLabDates(username, password, labCode);
      
      return new Response(JSON.stringify({ dates }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'upload') {
      // For now, return a mock response since actual file upload requires more complex handling
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Lab record upload functionality is being implemented' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in scrape-lab-data function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});