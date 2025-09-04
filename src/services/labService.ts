import axios from 'axios';
import * as cheerio from 'cheerio';
import { LabSubject, LabDate } from '../types/attendance';

class LabService {
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

  async getLabSubjects(): Promise<LabSubject[]> {
    try {
      const response = await this.session.get("https://samvidha.iare.ac.in/home?action=labrecord_std");
      const $ = cheerio.load(response.data);
      
      const subjects: LabSubject[] = [];
      $('#sub_code option').each((_, element) => {
        const value = $(element).attr('value');
        const text = $(element).text().trim();
        if (value && value.trim() && !text.toLowerCase().includes('select')) {
          subjects.push({ value, text });
        }
      });
      
      return subjects;
    } catch (error) {
      console.error('Error fetching lab subjects:', error);
      return [];
    }
  }

  async getLabDates(labCode: string): Promise<LabDate[]> {
    try {
      const response = await this.session.post("https://samvidha.iare.ac.in/home?action=labrecord_std", {
        sub_code: labCode
      });
      
      const $ = cheerio.load(response.data);
      const dates: LabDate[] = [];
      const currentDate = new Date();

      $('table tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length >= 5) {
          const weekText = $(cells[0]).text().trim();
          const subjectCode = $(cells[1]).text().trim();
          const experimentTitle = $(cells[2]).text().trim();
          const batchNo = $(cells[3]).text().trim();
          const submissionDate = $(cells[4]).text().trim();

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
      });

      return dates;
    } catch (error) {
      console.error('Error fetching lab dates:', error);
      return [];
    }
  }

  async uploadLabRecord(labCode: string, weekNo: string, title: string, pdfFile: File): Promise<{ success: boolean; message: string }> {
    try {
      const formData = new FormData();
      formData.append('sub_code', labCode);
      formData.append('week_no', weekNo);
      formData.append('exp_title', title);
      formData.append('prog_doc', pdfFile);

      const response = await this.session.post("https://samvidha.iare.ac.in/home?action=labrecord_std", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const responseText = response.data.toLowerCase();
      if (responseText.includes('success') || responseText.includes('uploaded')) {
        return { success: true, message: 'Lab record uploaded successfully!' };
      } else if (responseText.includes('error') || responseText.includes('failed')) {
        return { success: false, message: 'Upload failed. Please check your inputs and try again.' };
      } else {
        return { success: true, message: 'Upload completed. Please verify on the website.' };
      }
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, message: `Error uploading lab record: ${error}` };
    }
  }
}

export const labService = new LabService();