'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/lib/authService';
import { toast } from 'sonner';

interface SyllabusJob {
    id: string;
    file_path: string;
    status: 'unstarted' | 'processing' | 'completed' | 'failed';
    job_output: Record<string, unknown> | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

interface JobNotificationContextType {
    jobs: SyllabusJob[];
    refreshJobs: () => Promise<void>;
}

const JobNotificationContext = createContext<JobNotificationContextType | undefined>(undefined);

export function JobNotificationProvider({ children }: { children: React.ReactNode }) {
    console.log('🚀 JobNotificationProvider component mounting...');

    const [jobs, setJobs] = useState<SyllabusJob[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const previousJobsRef = useRef<SyllabusJob[]>([]);

    // Load previous jobs from localStorage on mount to persist across page navigations
    useEffect(() => {
        try {
            const savedJobs = localStorage.getItem('previousJobs');
            if (savedJobs) {
                const parsedJobs = JSON.parse(savedJobs) as SyllabusJob[];
                previousJobsRef.current = parsedJobs;
                console.log('📥 Loaded previous jobs from localStorage:', parsedJobs.length);
            }
        } catch (error) {
            console.error('Error loading previous jobs from localStorage:', error);
        }
    }, []);

    console.log('📊 JobNotificationProvider state - isAuthenticated:', isAuthenticated, 'jobs:', jobs.length);

    const refreshJobs = useCallback(async () => {
        try {
            const authResult = await AuthService.getCurrentUser();
            if (!authResult.success || !authResult.user) return;

            const { data, error } = await supabase
                .from('syllabus_jobs')
                .select('*')
                .eq('user_id', authResult.user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setJobs(data);
            }
        } catch (error) {
            console.error('Error refreshing jobs:', error);
        }
    }, []);

    useEffect(() => {
        console.log('🔄 JobNotificationProvider useEffect triggered.');

        const performJobCheck = async () => {
            console.log('📡 Starting job check...');
            try {
                const authResult = await AuthService.getCurrentUser();
                console.log('🔐 Auth check result:', authResult.success, authResult.user ? 'User found' : 'No user');

                if (!authResult.success || !authResult.user) {
                    console.log('❌ Not authenticated, setting isAuthenticated to false');
                    setIsAuthenticated(false);
                    return;
                }

                // Don't update isAuthenticated state here to avoid re-triggering useEffect
                // Just continue with the job check if user is authenticated
                console.log('✅ User is authenticated, continuing with job check');

                const { data, error } = await supabase
                    .from('syllabus_jobs')
                    .select('*')
                    .eq('user_id', authResult.user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error checking for job updates:', error);
                    return;
                }

                const currentJobs = data || [];
                const previousJobs = previousJobsRef.current;

                console.log('📊 Current jobs from DB:', currentJobs.length, 'Previous jobs:', previousJobs.length);
                console.log('📋 Current job statuses:', currentJobs.map(j => `${j.id.slice(-8)}: ${j.status}`));
                console.log('📋 Previous job statuses:', previousJobs.map(j => `${j.id.slice(-8)}: ${j.status}`));

                const hasUpdates = currentJobs.some(newJob => {
                    const oldJob = previousJobs.find(j => j.id === newJob.id);
                    return oldJob && (oldJob.status !== newJob.status || oldJob.updated_at !== newJob.updated_at);
                });

                console.log('🔍 Has updates:', hasUpdates);

                if (hasUpdates) {
                    // Find newly completed jobs - handle both processing->completed AND unstarted->completed transitions
                    const newlyCompleted = currentJobs.filter(newJob => {
                        const oldJob = previousJobs.find(j => j.id === newJob.id);
                        const isNewlyCompleted = oldJob &&
                            (oldJob.status === 'processing' || oldJob.status === 'unstarted') &&
                            newJob.status === 'completed';
                        if (isNewlyCompleted) {
                            console.log('✅ Found newly completed job:', newJob.id, 'Old status:', oldJob.status, 'New status:', newJob.status);
                        }
                        return isNewlyCompleted;
                    });

                    // Find newly failed jobs - handle both processing->failed AND unstarted->failed transitions
                    const newlyFailed = currentJobs.filter(newJob => {
                        const oldJob = previousJobs.find(j => j.id === newJob.id);
                        const isNewlyFailed = oldJob &&
                            (oldJob.status === 'processing' || oldJob.status === 'unstarted') &&
                            newJob.status === 'failed';
                        if (isNewlyFailed) {
                            console.log('❌ Found newly failed job:', newJob.id, 'Old status:', oldJob.status, 'New status:', newJob.status);
                        }
                        return isNewlyFailed;
                    });

                    console.log('📋 Newly completed:', newlyCompleted.length, 'Newly failed:', newlyFailed.length);

                    // Show notifications for completed jobs
                    newlyCompleted.forEach(job => {
                        const fileName = job.file_path.split('/').pop()?.replace(/^[0-9a-f-]+-/, '') || 'your file';
                        console.log("🎉 Showing completion notification for:", job.id, fileName);
                        toast.success(`🎉 Processing completed for ${fileName}! Your dashboard is ready.`, {
                            duration: 6000,
                            action: {
                                label: 'View Jobs',
                                onClick: () => window.location.href = '/jobs'
                            }
                        });
                    });

                    // Show notifications for failed jobs
                    newlyFailed.forEach(job => {
                        const fileName = job.file_path.split('/').pop()?.replace(/^[0-9a-f-]+-/, '') || 'your file';
                        console.log("💥 Showing failure notification for:", job.id, fileName);
                        toast.error(`❌ Processing failed for ${fileName}. Please try again.`, {
                            duration: 6000,
                            action: {
                                label: 'View Jobs',
                                onClick: () => window.location.href = '/jobs'
                            }
                        });
                    });
                }

                // Update the ref with current jobs for next comparison
                previousJobsRef.current = currentJobs;

                // Save to localStorage to persist across page navigations
                try {
                    localStorage.setItem('previousJobs', JSON.stringify(currentJobs));
                    console.log('💾 Saved current jobs to localStorage for next comparison');
                } catch (error) {
                    console.error('Error saving jobs to localStorage:', error);
                }

                // Always update the jobs list (for other components to use)
                console.log('🔄 Updating jobs state');
                setJobs(currentJobs);
            } catch (error) {
                console.error('Error in job check:', error);
            }
        };

        // Initial check
        console.log('🏁 Performing initial job check...');
        performJobCheck();

        // Set up polling every 10 seconds  
        console.log('⏰ Setting up 10-second polling interval...');
        const interval = setInterval(() => {
            console.log('⏰ Interval tick - performing job check... (timestamp:', new Date().toLocaleTimeString(), ')');
            performJobCheck();
        }, 10000);

        return () => {
            console.log('🧹 Cleaning up interval');
            clearInterval(interval);
        };
    }, []); // Empty dependency array - we want this effect to run once on mount and set up persistent polling

    console.log('🎯 JobNotificationProvider about to render context provider');

    const contextValue = useMemo(() => ({ jobs, refreshJobs }), [jobs, refreshJobs]);

    return (
        <JobNotificationContext.Provider value={contextValue}>
            {children}
        </JobNotificationContext.Provider>
    );
}

export function useJobNotifications() {
    const context = useContext(JobNotificationContext);
    if (context === undefined) {
        throw new Error('useJobNotifications must be used within a JobNotificationProvider');
    }
    return context;
}
