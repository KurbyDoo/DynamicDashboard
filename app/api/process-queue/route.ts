import { NextRequest, NextResponse } from 'next/server';
import { supabaseService, type SyllabusJob, type MockLLMResults } from '@/lib/supabase-service';

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
        // 1. Verify CRON_SECRET from Authorization header
        const authHeader = request.headers.get('authorization');
        const expectedSecret = process.env.CRON_SECRET;
        
        if (!expectedSecret) {
            console.error('CRON_SECRET not configured');
            return NextResponse.json(
                { error: 'Cron configuration error' },
                { status: 500 }
            );
        }
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('Missing or invalid Authorization header');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        
        const providedSecret = authHeader.substring(7); // Remove 'Bearer ' prefix
        if (providedSecret !== expectedSecret) {
            console.error('Invalid CRON_SECRET provided');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        
        console.log('🔒 Cron authentication successful');
        
        // 2. Query for the oldest queued job and atomically lock it
        const { data: jobs, error: fetchError } = await supabaseService
            .from('syllabus_jobs')
            .select('*')
            .eq('status', 'queued')
            .order('created_at', { ascending: true })
            .limit(1);
        
        if (fetchError) {
            console.error('Error fetching queued jobs:', fetchError);
            return NextResponse.json(
                { error: 'Database query failed', details: fetchError.message },
                { status: 500 }
            );
        }
        
        // 3. If no queued jobs, exit gracefully
        if (!jobs || jobs.length === 0) {
            console.log('✅ No queued jobs found - exiting gracefully');
            return NextResponse.json({
                success: true,
                message: 'No jobs to process',
                processingTime: Date.now() - startTime
            });
        }
        
        const job = jobs[0] as SyllabusJob;
        console.log(`🔄 Processing job: ${job.id} (file: ${job.file_path})`);
        
        // 4. Atomically update status to 'processing' to lock the job
        const { data: lockedJob, error: lockError } = await supabaseService
            .from('syllabus_jobs')
            .update({
                status: 'processing',
                updated_at: new Date().toISOString()
            })
            .eq('id', job.id)
            .eq('status', 'queued') // Ensure it's still queued (prevents race conditions)
            .select()
            .single();
        
        if (lockError || !lockedJob) {
            console.log('⚠️ Job was already claimed by another worker or doesn\'t exist');
            return NextResponse.json({
                success: true,
                message: 'Job already claimed or not found',
                processingTime: Date.now() - startTime
            });
        }
        
        console.log(`🔒 Successfully locked job: ${lockedJob.id}`);
        
        try {
            // 5. Fetch the file from Supabase Storage
            console.log(`📁 Fetching file from storage: ${job.file_path}`);
            
            const { data: fileData, error: storageError } = await supabaseService.storage
                .from('syllabi')
                .download(job.file_path);
            
            if (storageError) {
                throw new Error(`Storage fetch failed: ${storageError.message}`);
            }
            
            if (!fileData) {
                throw new Error('File not found in storage');
            }
            
            const fileSize = fileData.size;
            const fileName = job.file_path.split('/').pop() || 'unknown';
            console.log(`📄 File fetched successfully: ${fileName} (${fileSize} bytes)`);
            
            // 6. Mock LLM processing with delay
            console.log('🤖 Starting mock LLM processing (dual strategy simulation)...');
            await simulateProcessing(4); // 4 second delay
            
            // 7. Generate mock results
            const mockResults = generateMockLLMResults(fileName);
            console.log('🎯 Mock LLM processing completed successfully');
            
            // 8. Update job status to 'completed' with results
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
            
            const processingTime = Date.now() - startTime;
            console.log(`✅ Job ${job.id} completed successfully in ${processingTime}ms`);
            
            return NextResponse.json({
                success: true,
                message: 'Job processed successfully',
                jobId: job.id,
                fileName: fileName,
                fileSize: fileSize,
                processingTime: processingTime,
                mockResults: {
                    assignmentsFound: mockResults.parsedSyllabus.assignments.length,
                    componentsGenerated: mockResults.dashboardLayout.components.length
                }
            });
            
        } catch (processingError) {
            // Handle processing errors - update job status to 'failed'
            console.error(`❌ Processing failed for job ${job.id}:`, processingError);
            
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
            
            return NextResponse.json({
                success: false,
                error: 'Job processing failed',
                jobId: job.id,
                details: errorMessage,
                processingTime: Date.now() - startTime
            }, { status: 500 });
        }
        
    } catch (error) {
        console.error('❌ Cron job execution failed:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return NextResponse.json({
            success: false,
            error: 'Cron execution failed',
            details: errorMessage,
            processingTime: Date.now() - startTime
        }, { status: 500 });
    }
}
