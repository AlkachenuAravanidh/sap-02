import { LabSubject, LabDate } from '../types/attendance';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

class LabService {
  private credentials: { username: string; password: string } | null = null;

  setCredentials(username: string, password: string) {
    this.credentials = { username, password };
  }

  async getLabSubjects(): Promise<LabSubject[]> {
    if (!this.credentials) {
      throw new Error('Not logged in');
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-lab-data?action=subjects`, {
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
      return data.subjects || [];
    } catch (error) {
      console.error('Error fetching lab subjects:', error);
      return [];
    }
  }

  async getLabDates(labCode: string): Promise<LabDate[]> {
    if (!this.credentials) {
      throw new Error('Not logged in');
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-lab-data?action=dates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          username: this.credentials.username,
          password: this.credentials.password,
          labCode
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.dates || [];
    } catch (error) {
      console.error('Error fetching lab dates:', error);
      return [];
    }
  }

  async uploadLabRecord(labCode: string, weekNo: string, title: string, pdfFile: File): Promise<{ success: boolean; message: string }> {
    if (!this.credentials) {
      throw new Error('Not logged in');
    }

    try {
      // Convert PDF file to base64
      const arrayBuffer = await pdfFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-lab-data?action=upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          username: this.credentials.username,
          password: this.credentials.password,
          labCode,
          weekNo,
          title,
          pdfBase64: base64
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.success || false,
        message: data.message || 'Upload completed'
      };
    } catch (error) {
      console.error('Error uploading lab record:', error);
      return {
        success: false,
        message: `Error uploading lab record: ${error.message}`
      };
    }
  }
}

export const labService = new LabService();