'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/lib/authService';
import { toast } from 'sonner';
import { useJobNotifications } from '@/lib/JobNotificationProvider';

interface SyllabusJob {
    id: string;
    file_path: string;
    status: 'unstarted' | 'processing' | 'completed' | 'failed';
    job_output: Record<string, unknown> | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

export default function JobsPage() {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { jobs, refreshJobs } = useJobNotifications();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authResult = await AuthService.getCurrentUser();

                if (!authResult.success || !authResult.user) {
                    setIsAuthenticated(false);
                } else {
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Error checking authentication:', error);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Filter jobs into three sections
    const unstartedJobs = jobs.filter(job => job.status === 'unstarted');
    const processingJobs = jobs.filter(job => job.status === 'processing');
    const completedJobs = jobs.filter(job => job.status === 'completed' || job.status === 'failed');

    const handleStartProcessing = async (jobId: string) => {
        console.log('Start Processing clicked for job:', jobId);

        try {
            // Get the current user session to include in the request
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error('Authentication required. Please refresh the page.');
                return;
            }

            const response = await fetch('/api/process-job', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ jobId }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success('Job processing started! Your syllabus is being analyzed.');

                // Refresh the jobs from the context to get the updated state
                await refreshJobs();
            } else {
                console.error('Failed to start processing:', result);
                toast.error(result.error || 'Failed to start processing. Please try again.');
            }
        } catch (error) {
            console.error('Error starting job processing:', error);
            toast.error('An error occurred while starting the job. Please try again.');
        }
    };

    const handleRefreshJobs = async () => {
        try {
            await refreshJobs();
            toast.success('Jobs refreshed successfully!');
        } catch (error) {
            console.error('Error in handleRefreshJobs:', error);
            toast.error('An error occurred while refreshing jobs.');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'unstarted':
                return 'bg-yellow-100 text-yellow-800';
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'unstarted':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'processing':
                return (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                );
            case 'completed':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'failed':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const extractFileName = (filePath: string) => {
        // Extract filename from path like "user-id/uuid-filename.pdf"
        const parts = filePath.split('/');
        const fileName = parts[parts.length - 1];
        // Remove UUID prefix (everything before the first dash after UUID pattern)
        const match = fileName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-(.+)$/i);
        return match ? match[1] : fileName;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const renderJobCard = (job: SyllabusJob, showStartButton = false) => (
        <li key={job.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center">
                            <p className="text-lg font-medium text-gray-900 truncate">
                                {extractFileName(job.file_path)}
                            </p>
                            <div className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                {getStatusIcon(job.status)}
                                <span className="ml-1 capitalize">{job.status}</span>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Created {formatDate(job.created_at)}</span>
                            {job.updated_at !== job.created_at && (
                                <>
                                    <span className="mx-2">•</span>
                                    <span>Updated {formatDate(job.updated_at)}</span>
                                </>
                            )}
                        </div>
                        {job.error_message && (
                            <div className="mt-2 text-sm text-red-600">
                                <div className="flex items-start">
                                    <svg className="flex-shrink-0 mr-1.5 h-4 w-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{job.error_message}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                    {showStartButton && (
                        <button
                            onClick={() => handleStartProcessing(job.id)}
                            className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Start Processing
                        </button>
                    )}
                    {job.status === 'completed' && (
                        <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            View Dashboard
                        </button>
                    )}
                </div>
            </div>
        </li>
    );

    const renderSection = (title: string, jobList: SyllabusJob[], showStartButton = false, emptyMessage: string) => (
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
            {jobList.length === 0 ? (
                <div className="bg-white shadow rounded-md p-6 text-center text-gray-500">
                    {emptyMessage}
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {jobList.map(job => renderJobCard(job, showStartButton))}
                    </ul>
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center px-4 py-2">
                        <svg className="w-6 h-6 mr-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-lg text-gray-600">Loading your jobs...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="mb-4">
                        <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
                    <p className="text-gray-600 mb-6">
                        Please upload a file first to access your processing jobs.
                    </p>
                    <Link
                        href="/upload"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        Go to Upload
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
                            <p className="text-lg text-gray-600 mt-2">
                                Manage and track the status of your uploaded syllabus files
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleRefreshJobs}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh Jobs
                            </button>
                            <Link
                                href="/upload"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Upload New File
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Jobs Sections */}
                {jobs.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mb-4">
                            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
                        <p className="text-gray-600 mb-6">
                            Upload your first syllabus to see it appear in your jobs list.
                        </p>
                        <Link
                            href="/upload"
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Upload Syllabus
                        </Link>
                    </div>
                ) : (
                    <>
                        {renderSection(
                            "Ready to Start",
                            unstartedJobs,
                            true,
                            "No jobs ready to start."
                        )}
                        {renderSection(
                            "Processing",
                            processingJobs,
                            false,
                            "No jobs currently processing."
                        )}
                        {renderSection(
                            "Completed",
                            completedJobs,
                            false,
                            "No completed jobs."
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
