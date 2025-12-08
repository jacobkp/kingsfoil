'use client';

import { useState, useRef, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useBillData } from '@/lib/BillContext';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';

const EXAMPLE_CONTEXTS = [
  "Emergency room visit for broken arm",
  "Routine annual physical exam",
  "Consultation for persistent headaches",
  "Blood work ordered at annual checkup",
  "X-ray for sports injury",
  "Follow-up appointment after surgery",
  "Urgent care visit for flu symptoms",
];

export default function Home() {
  const router = useRouter();
  const { updateBillData } = useBillData();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userContext, setUserContext] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File must be under 10MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, JPEG, or PNG file');
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleAnalyzeBill = async () => {
    if (!selectedFile) return;

    setUploading(true);

    // Store file and user context in context
    updateBillData({
      file: selectedFile,
      fileUrl: previewUrl,
      userContext: userContext.trim() || null,
    });

    // Navigate to analyzing screen
    router.push('/analyzing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center p-8">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Medical Bill Analyzer
          </h1>
          <p className="text-gray-600">
            Upload your medical bill to detect errors and save money
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Drag and drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-[#1A6354] bg-teal-50'
                : 'border-gray-300 hover:border-[#1A6354] hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!selectedFile ? (
              <>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-4 text-sm text-gray-600">
                  <span className="font-medium text-[#1A6354]">Click to upload</span>
                  {' '}or drag and drop
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PDF, JPEG, or PNG (max 10MB)
                </p>
              </>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                {selectedFile.type.startsWith('image/') ? (
                  <div className="relative w-32 h-32 mx-auto">
                    <Image
                      src={previewUrl!}
                      alt="Bill preview"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 mx-auto flex items-center justify-center bg-gray-100 rounded-lg">
                    <svg
                      className="h-16 w-16 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove file
                </button>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* User Context Input - Only show when file is selected */}
          {selectedFile && (
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="userContext" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your visit (Optional)
                </label>
                <textarea
                  id="userContext"
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value.slice(0, 500))}
                  placeholder="e.g., Emergency room visit for broken arm"
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A6354] focus:border-transparent resize-none text-base text-gray-900 placeholder:text-gray-400"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {userContext.length}/500 characters
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowExamples(!showExamples)}
                    className="text-xs text-[#1A6354] hover:text-[#0f4a3f] flex items-center gap-1"
                  >
                    {showExamples ? (
                      <>
                        Hide examples <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        Show examples <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Example suggestions */}
              {showExamples && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-700">Click to use:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_CONTEXTS.map((example, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setUserContext(example);
                          setShowExamples(false);
                        }}
                        className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-teal-50 hover:border-[#1A6354] transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Important note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>How this helps:</strong> Your description helps us detect errors specific to your visit (e.g., charged for services you didn&apos;t receive). This is optional and will be verified against the bill.
                </p>
              </div>
            </div>
          )}

          {/* Analyze button */}
          <button
            onClick={handleAnalyzeBill}
            disabled={!selectedFile || uploading}
            className={`mt-6 w-full py-3 px-4 rounded-lg font-medium transition-all ${
              selectedFile && !uploading
                ? 'bg-[#1A6354] text-white hover:bg-[#0f4a3f] hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {uploading ? 'Starting Analysis...' : 'Analyze Bill'}
          </button>
        </div>

        {/* Coming soon badge */}
        <div className="mt-6 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            🔜 Coming Soon: Direct API access and auto-pull from insurance providers
          </span>
        </div>

        {/* HIPAA Disclaimer */}
        <div className="mt-4 text-center">
          <div className="inline-block max-w-2xl px-4 py-3 rounded-lg bg-orange-50 border border-orange-200">
            <p className="text-xs text-orange-800">
              <span className="font-semibold">Early prototype version.</span> Data not protected completely via HIPAA. We do not store or retain any uploaded information on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
