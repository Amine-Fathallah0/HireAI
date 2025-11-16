import { useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface ResumeUploadProps {
  resumeFile: File | null;
  onFileChange: (file: File | null) => void;
}

export function ResumeUpload({ 
  resumeFile, 
  onFileChange
}: ResumeUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    onFileChange(file);
  };

  const removeFile = () => {
    onFileChange(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-purple-accent-light rounded-lg">
          <FileText className="w-6 h-6 text-purple-accent" />
        </div>
        <div>
          <h3 className="text-lg font-display font-semibold text-gray-900">
            Your Resume
          </h3>
          <p className="text-sm text-gray-500">Upload your resume file</p>
        </div>
      </div>

      <div className="space-y-4">
          {!resumeFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive
                  ? 'border-talent-primary bg-talent-primary-light'
                  : 'border-gray-300 bg-gray-50 hover:border-talent-primary hover:bg-talent-primary-light'
              }`}
            >
              <input
                type="file"
                id="resume-upload"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleChange}
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer flex flex-col items-center space-y-3"
              >
                <div className="p-3 bg-white rounded-full">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    <span className="text-talent-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX or TXT (max 5MB)
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{resumeFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(resumeFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
              </button>
            </div>
          )}
        </div>

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Your resume data is processed securely and not stored on our servers.
        </p>
      </div>
    </div>
  );
}
