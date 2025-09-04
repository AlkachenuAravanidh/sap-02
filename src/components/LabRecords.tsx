import React, { useState } from 'react';
import { Upload, FileText, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { labService } from '../services/labService';
import { LabSubject, LabDate } from '../types/attendance';
import { compressImagesToPdf } from '../utils/pdfUtils';

export const LabRecords: React.FC = () => {
  const [labSubjects, setLabSubjects] = useState<LabSubject[]>([]);
  const [labDates, setLabDates] = useState<LabDate[]>([]);
  const [selectedLab, setSelectedLab] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [experimentTitle, setExperimentTitle] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadLabSubjects = async () => {
    setIsLoading(true);
    try {
      const subjects = await labService.getLabSubjects();
      setLabSubjects(subjects);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load lab subjects' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadLabDates = async (labCode: string) => {
    setIsLoading(true);
    try {
      const dates = await labService.getLabDates(labCode);
      setLabDates(dates);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load lab dates' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLabChange = (labCode: string) => {
    setSelectedLab(labCode);
    setSelectedWeek('');
    setExperimentTitle('');
    if (labCode) {
      loadLabDates(labCode);
    } else {
      setLabDates([]);
    }
  };

  const handleWeekChange = (weekNumber: string) => {
    setSelectedWeek(weekNumber);
    const selectedDate = labDates.find(d => d.weekNumber === weekNumber);
    if (selectedDate) {
      setExperimentTitle(selectedDate.experimentTitle);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLab || !selectedWeek || !experimentTitle || selectedImages.length === 0) {
      setMessage({ type: 'error', text: 'Please fill all fields and select images' });
      return;
    }

    setIsLoading(true);
    try {
      const pdfBlob = await compressImagesToPdf(selectedImages);
      const pdfFile = new File([pdfBlob], 'lab_record.pdf', { type: 'application/pdf' });
      
      const result = await labService.uploadLabRecord(selectedLab, selectedWeek, experimentTitle, pdfFile);
      
      setMessage({
        type: result.success ? 'success' : 'error',
        text: result.message
      });

      if (result.success) {
        setSelectedImages([]);
        setExperimentTitle('');
        setSelectedWeek('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload lab record' });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadLabSubjects();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Upload className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">Upload Lab Records</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lab Subject
              </label>
              <select
                value={selectedLab}
                onChange={(e) => handleLabChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">Select Lab Subject</option>
                {labSubjects.map((subject) => (
                  <option key={subject.value} value={subject.value}>
                    {subject.text}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Week
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => handleWeekChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isLoading || !selectedLab}
              >
                <option value="">Select Week</option>
                {labDates.filter(d => d.isAvailable).map((date) => (
                  <option key={date.weekNumber} value={date.weekNumber}>
                    {date.weekText} - Due: {date.submissionDate}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experiment Title
            </label>
            <input
              type="text"
              value={experimentTitle}
              onChange={(e) => setExperimentTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter experiment title"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lab Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors duration-200">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="images"
                disabled={isLoading}
              />
              <label htmlFor="images" className="cursor-pointer">
                <span className="text-sm text-gray-600">
                  Click to select images or drag and drop
                </span>
              </label>
              {selectedImages.length > 0 && (
                <div className="mt-2 text-sm text-indigo-600">
                  {selectedImages.length} image(s) selected
                </div>
              )}
            </div>
          </div>

          {message && (
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !selectedLab || !selectedWeek || !experimentTitle || selectedImages.length === 0}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              'Upload Lab Record'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};