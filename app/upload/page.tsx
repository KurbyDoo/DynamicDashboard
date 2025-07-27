'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { UploadService, UploadStatus } from '@/lib/uploadService';
import { AuthService } from '@/lib/authService';
import CaptchaComponent from '@/components/ui/CaptchaComponent';

export default function UploadPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>(UploadService.createInitialStatus());
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Check authentication status on component mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authResult = await AuthService.getCurrentUser();
                if (authResult.success && authResult.user) {
                    setIsAuthenticated(true);
                    setShowCaptcha(false);
                } else {
                    setIsAuthenticated(false);
                    setShowCaptcha(true);
                }
            } catch (error) {
                console.error('Initial auth check failed:', error);
                setIsAuthenticated(false);
                setShowCaptcha(true);
            } finally {
                setAuthLoading(false);
            }
        };

        checkAuth();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            // Check if file type is acceptable
            const acceptedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (acceptedTypes.includes(file.type) ||
                file.name.toLowerCase().endsWith('.pdf') ||
                file.name.toLowerCase().endsWith('.doc') ||
                file.name.toLowerCase().endsWith('.docx')) {
                setSelectedFile(file);
            }
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const removeFile = () => {
        setSelectedFile(null);
        setUploadStatus(UploadService.createInitialStatus());
    };

    const handleCaptchaVerify = async (token: string) => {
        setAuthError(null);

        try {
            const authResult = await AuthService.signInAnonymously(token);

            if (authResult.success) {
                setIsAuthenticated(true);
                setShowCaptcha(false);
                toast.success('Authentication successful! You can now upload your file.');
                console.log('User authenticated successfully');
            } else {
                setAuthError(authResult.error || 'Authentication failed');
                setIsAuthenticated(false);
                toast.error('Authentication failed. Please try again.');
            }
        } catch (error) {
            console.error('Captcha verification error:', error);
            setAuthError('Failed to verify captcha. Please try again.');
            setIsAuthenticated(false);
            toast.error('Failed to verify captcha. Please try again.');
        }
    }; const handleCaptchaError = (error: Error | unknown) => {
        console.error('Captcha error:', error);
        setAuthError('Captcha verification failed. Please try again.');
        setIsAuthenticated(false);
    };

    const handleCaptchaExpire = () => {
        console.log('Captcha expired');
        setAuthError('Captcha expired. Please complete it again.');
        setIsAuthenticated(false);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to upload.');
            return;
        }

        if (!isAuthenticated) {
            toast.error('Please complete authentication first.');
            setShowCaptcha(true);
            return;
        }

        setUploadStatus(UploadService.createUploadingStatus());

        const result = await UploadService.uploadFileToSupabase(selectedFile);

        if (result.success && result.data) {
            // Log file URL to console for debugging
            console.log('File uploaded successfully. URL:', result.data.publicUrl);

            // Show success toast
            toast.success('File uploaded successfully!');

            // Clear the selected file to reset the form
            setSelectedFile(null);
            setUploadStatus(UploadService.createInitialStatus());

            // Reset file inputs
            const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
            fileInputs.forEach(input => {
                input.value = '';
            });
        } else {
            // Show error toast
            toast.error(result.error || 'Upload failed. Please try again.');
            setUploadStatus(UploadService.createErrorStatus(result.error || 'Upload failed'));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Upload Your Syllabus
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Select your course syllabus file to generate an intelligent dashboard with AI-powered insights.
                        We support PDF, DOC, and DOCX formats.
                    </p>
                </div>

                {/* Upload Area */}
                <div className="max-w-2xl mx-auto">
                    <div
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver
                            ? 'border-blue-500 bg-blue-50'
                            : selectedFile
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {!selectedFile ? (
                            <>
                                {/* Upload Icon */}
                                <div className="mx-auto mb-4">
                                    <svg
                                        className="w-16 h-16 text-gray-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>

                                {/* Upload Text */}
                                <div className="mb-6">
                                    <p className="text-xl font-medium text-gray-900 mb-2">
                                        {isDragOver
                                            ? 'Drop your file here'
                                            : isAuthenticated
                                                ? 'Drag and drop your syllabus'
                                                : 'Please complete authentication first'
                                        }
                                    </p>
                                    {isAuthenticated && <p className="text-gray-600">or</p>}
                                </div>

                                {/* File Input Button */}
                                {isAuthenticated && !authLoading && (
                                    <label
                                        htmlFor="file-upload"
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors"
                                    >
                                        <svg
                                            className="w-5 h-5 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                            />
                                        </svg>
                                        Choose File
                                    </label>
                                )}

                                <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleFileChange}
                                    disabled={!isAuthenticated}
                                />

                                {/* Supported Formats */}
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500">
                                        Supported formats: PDF, DOC, DOCX
                                    </p>
                                </div>
                            </>
                        ) : (
                            /* Selected File Display */
                            <div className="text-center">
                                {/* Success Icon */}
                                <div className="mx-auto mb-4">
                                    <svg
                                        className="w-16 h-16 text-green-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>

                                {/* File Info */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        File Selected
                                    </h3>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <svg
                                                    className="w-8 h-8 text-red-500 mr-3"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                <div className="text-left">
                                                    <p className="font-medium text-gray-900">
                                                        {selectedFile.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatFileSize(selectedFile.size)}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={removeFile}
                                                className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Upload Another File Button */}
                                <label
                                    htmlFor="file-upload-replace"
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors mr-3"
                                >
                                    Choose Different File
                                </label>

                                <input
                                    id="file-upload-replace"
                                    name="file-upload-replace"
                                    type="file"
                                    className="sr-only"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleFileChange}
                                />

                                {/* Process Button - Only show if authenticated */}
                                {isAuthenticated && !authLoading && (
                                    <button
                                        onClick={handleUpload}
                                        disabled={uploadStatus.isUploading}
                                        className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md transition-colors ${uploadStatus.isUploading
                                            ? 'text-white bg-blue-400 cursor-not-allowed'
                                            : 'text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                                            }`}
                                    >
                                        {uploadStatus.isUploading ? (
                                            <>
                                                <svg
                                                    className="w-4 h-4 mr-2 animate-spin"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="m15.84 3.13a11.1 11.1 0 00-7.68 0c-.85.25-1.72.55-2.54.9-.82.35-1.6.75-2.33 1.2a11.1 11.1 0 00-3.97 4.54c-.32.76-.58 1.54-.78 2.34-.2.8-.34 1.61-.42 2.43a11.1 11.1 0 001.26 7.04c.49.78 1.05 1.51 1.68 2.18a11.1 11.1 0 007.04 1.26c.82-.08 1.63-.22 2.43-.42.8-.2 1.58-.46 2.34-.78a11.1 11.1 0 004.54-3.97c.45-.73.85-1.51 1.2-2.33.35-.82.65-1.69.9-2.54a11.1 11.1 0 000-7.68c-.25-.85-.55-1.72-.9-2.54-.35-.82-.75-1.6-1.2-2.33a11.1 11.1 0 00-4.54-3.97c-.76-.32-1.54-.58-2.34-.78a11.1 11.1 0 00-2.43-.42z"
                                                    />
                                                </svg>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <svg
                                                    className="w-4 h-4 mr-2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V9"
                                                    />
                                                </svg>
                                                Upload to Storage
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Captcha Section - Show if not authenticated or auth loading */}
                    {(showCaptcha || (!isAuthenticated && !authLoading)) && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-yellow-900 mb-4">
                                    Authentication Required
                                </h3>
                                <p className="text-sm text-yellow-700 mb-6">
                                    Please complete the captcha verification to upload your file.
                                </p>

                                <CaptchaComponent
                                    onVerify={handleCaptchaVerify}
                                    onError={handleCaptchaError}
                                    onExpire={handleCaptchaExpire}
                                    disabled={false}
                                />

                                {authError && (
                                    <div className="mt-4 text-sm text-red-600">
                                        {authError}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Loading indicator during auth check */}
                    {authLoading && (
                        <div className="mt-4 text-center">
                            <div className="inline-flex items-center px-4 py-2">
                                <svg
                                    className="w-4 h-4 mr-2 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                <span className="text-sm text-gray-600">Checking authentication...</span>
                            </div>
                        </div>
                    )}

                    {/* Additional Info */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-start">
                            <svg
                                className="w-6 h-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <div>
                                <h3 className="text-sm font-medium text-blue-900 mb-1">
                                    What happens next?
                                </h3>
                                <div className="text-sm text-blue-700">
                                    <p className="mb-2">
                                        Once you upload your syllabus, our AI will:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Extract key dates and deadlines</li>
                                        <li>Identify assignment weights and grading criteria</li>
                                        <li>Generate a personalized dashboard layout</li>
                                        <li>Create visual charts and timelines</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
