import { NextRequest, NextResponse } from 'next/server';
import { supabaseService, type SyllabusJob, type MockLLMResults } from '@/lib/supabase-service';
import { createClient } from '@supabase/supabase-js';

// Utility function to simulate processing delay
const simulateProcessing = (seconds: number = 4): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
};

// Generate mock LLM results (simulating the dual LLM strategy)
const generateMockLLMResults = (fileName: string): MockLLMResults => {
    return {
        parsedSyllabus: {
            courseInfo: {
                name: `Course extracted from ${fileName}`,
                instructor: "Dr. Mock Professor",
                semester: "Spring 2025",
                credits: 3
            },
            assignments: [
                {
                    name: "Assignment 1",
                    dueDate: "2025-02-15",
                    weight: 20,
                    type: "homework"
                },
                {
                    name: "Midterm Exam",
                    dueDate: "2025-03-15",
                    weight: 30,
                    type: "exam"
                },
                {
                    name: "Final Project",
                    dueDate: "2025-05-01",
                    weight: 35,
                    type: "project"
                },
                {
                    name: "Participation",
                    dueDate: "2025-05-15",
                    weight: 15,
                    type: "participation"
                }
            ],
            gradingScale: {
                A: 90,
                B: 80,
                C: 70,
                D: 60,
                F: 0
            },
            schedule: [
                {
                    date: "2025-01-20",
                    topic: "Introduction to Course",
                    readings: ["Chapter 1", "Syllabus"]
                },
                {
                    date: "2025-01-27",
                    topic: "Fundamentals",
                    readings: ["Chapter 2", "Article A"]
                },
                {
                    date: "2025-02-03",
                    topic: "Advanced Topics",
                    readings: ["Chapter 3", "Article B"]
                }
            ]
        },
        dashboardLayout: {
            components: [
                {
                    type: 'timeline',
                    position: { x: 0, y: 0, width: 12, height: 4 },
                    config: { showAssignments: true, showExams: true }
                },
                {
                    type: 'pie-chart',
                    position: { x: 0, y: 4, width: 6, height: 4 },
                    config: { dataSource: 'grades', showLegend: true }
                },
                {
                    type: 'assignment-list',
                    position: { x: 6, y: 4, width: 6, height: 4 },
                    config: { sortBy: 'dueDate', showCompleted: false }
                },
                {
                    type: 'grade-breakdown',
                    position: { x: 0, y: 8, width: 12, height: 3 },
                    config: { showPercentages: true, showTargets: true }
                }
            ],
            theme: {
                primaryColor: "#3B82F6",
                layout: "grid"
            }
        }
    };
};

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    
    try {
        // 1. Authenticate the user making the request
        const userSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Get the user's session from the request
        const { data: { user }, error: authError } = await userSupabase.auth.getUser(
            request.headers.get('Authorization')?.replace('Bearer ', '') || ''
        );

        if (authError || !user) {
            console.error('Authentication failed:', authError);
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        console.log(`🔐 Authenticated user: ${user.id}`);

        // 2. Parse the request body to get the job ID
        const body = await request.json();
        const { jobId } = body;
        
        if (!jobId) {
            console.error('Job ID is required');
            return NextResponse.json(
                { error: 'Job ID is required' },
                { status: 400 }
            );
        }
        
        console.log(`🔄 Starting processing for job: ${jobId}`);
        
        // 3. Fetch the specific job and verify ownership
        const { data: jobs, error: fetchError } = await supabaseService
            .from('syllabus_jobs')
            .select('*')
            .eq('id', jobId)
            .eq('user_id', user.id) // Ensure the job belongs to the authenticated user
            .eq('status', 'unstarted')
            .limit(1);
        
        if (fetchError) {
            console.error('Error fetching job:', fetchError);
            return NextResponse.json(
                { error: 'Database query failed', details: fetchError.message },
                { status: 500 }
            );
        }
        
        // 4. If job not found, not owned by user, or not in unstarted state, return error
        if (!jobs || jobs.length === 0) {
            console.log('❌ Job not found, not owned by user, or not in unstarted state');
            return NextResponse.json({
                success: false,
                error: 'Job not found, not authorized, or already processed',
                processingTime: Date.now() - startTime
            }, { status: 404 });
        }
        
        const job = jobs[0] as SyllabusJob;
        console.log(`🔄 Processing job: ${job.id} (file: ${job.file_path}) for user: ${user.id}`);
        
        // 5. Atomically update status to 'processing' to lock the job
        const { data: lockedJob, error: lockError } = await supabaseService
            .from('syllabus_jobs')
            .update({
                status: 'processing',
                updated_at: new Date().toISOString()
            })
            .eq('id', job.id)
            .eq('user_id', user.id) // Double-check ownership during update
            .eq('status', 'unstarted') // Ensure it's still unstarted (prevents race conditions)
            .select()
            .single();
        
        if (lockError || !lockedJob) {
            console.log('⚠️ Job was already processed or doesn\'t exist');
            return NextResponse.json({
                success: false,
                error: 'Job was already processed or not found',
                processingTime: Date.now() - startTime
            }, { status: 409 });
        }
        
        console.log(`🔒 Successfully locked job: ${lockedJob.id}`);
        
        // 6. Return success immediately after locking the job
        // The actual processing will continue in the background
        const processingTime = Date.now() - startTime;
        console.log(`✅ Job ${lockedJob.id} started processing in ${processingTime}ms`);
        
        // Start background processing (don't await this)
        processJobInBackground(job).catch(error => {
            console.error(`❌ Background processing failed for job ${job.id}:`, error);
        });
        
        return NextResponse.json({
            success: true,
            message: 'Job processing started successfully',
            jobId: job.id,
            fileName: job.file_path.split('/').pop() || 'unknown',
            processingTime: processingTime
        });
        
    } catch (error) {
        console.error('❌ Job processing execution failed:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return NextResponse.json({
            success: false,
            error: 'Job processing execution failed',
            details: errorMessage,
            processingTime: Date.now() - startTime
        }, { status: 500 });
    }
}

// Background processing function (runs asynchronously)
async function processJobInBackground(job: SyllabusJob) {
    try {
        // 1. Fetch the file from Supabase Storage with timeout
        console.log(`📁 Fetching file from storage: ${job.file_path}`);
        console.log(`🌐 Environment check - Service key exists: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
        
        // Add timeout to prevent hanging
        const downloadPromise = supabaseService.storage
            .from('syllabi')
            .download(job.file_path);
            
        const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Storage download timeout after 60 seconds')), 60000)
        );
        
        const { data: fileData, error: storageError } = await Promise.race([
            downloadPromise,
            timeoutPromise
        ]);
        
        if (storageError) {
            console.error('❌ Storage error:', storageError);
            throw new Error(`Storage fetch failed: ${storageError.message}`);
        }
        
        if (!fileData) {
            console.error('❌ No file data returned from storage');
            throw new Error('File not found in storage');
        }
        
        const fileSize = fileData.size;
        const fileName = job.file_path.split('/').pop() || 'unknown';
        console.log(`📄 File fetched successfully: ${fileName} (${fileSize} bytes)`);
        
        // 2. Mock LLM processing with delay
        console.log('🤖 Starting mock LLM processing (dual strategy simulation)...');
        await simulateProcessing(30); // 4 second delay
        
        // 3. Generate mock results
        const mockResults = generateMockLLMResults(fileName);
        console.log('🎯 Mock LLM processing completed successfully');
        
        // 4. Update job status to 'completed' with results
        const { error: completionError } = await supabaseService
            .from('syllabus_jobs')
            .update({
                status: 'completed',
                job_output: mockResults,
                error_message: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
        
        if (completionError) {
            throw new Error(`Failed to update job completion: ${completionError.message}`);
        }
        
        console.log(`✅ Job ${job.id} completed successfully in background`);
        
    } catch (processingError) {
        // Handle processing errors - update job status to 'failed'
        console.error(`❌ Background processing failed for job ${job.id}:`, processingError);
        
        const errorMessage = processingError instanceof Error 
            ? processingError.message 
            : 'Unknown processing error';
        
        const { error: failureUpdateError } = await supabaseService
            .from('syllabus_jobs')
            .update({
                status: 'failed',
                error_message: errorMessage,
                updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
        
        if (failureUpdateError) {
            console.error('Failed to update job failure status:', failureUpdateError);
        }
    }
}
