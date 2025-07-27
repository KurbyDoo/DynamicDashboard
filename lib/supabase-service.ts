import { createClient } from '@supabase/supabase-js';

// Service role client for server-side operations that bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service operations');
}

export const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Types for job processing
export interface SyllabusJob {
    id: string;
    user_id: string;
    file_path: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    job_output: Record<string, unknown> | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

// Mock LLM results structure (matching project architecture)
export interface MockLLMResults {
    parsedSyllabus: {
        courseInfo: {
            name: string;
            instructor: string;
            semester: string;
            credits: number;
        };
        assignments: Array<{
            name: string;
            dueDate: string;
            weight: number;
            type: string;
        }>;
        gradingScale: {
            A: number;
            B: number;
            C: number;
            D: number;
            F: number;
        };
        schedule: Array<{
            date: string;
            topic: string;
            readings: string[];
        }>;
    };
    dashboardLayout: {
        components: Array<{
            type: 'timeline' | 'pie-chart' | 'assignment-list' | 'grade-breakdown';
            position: { x: number; y: number; width: number; height: number };
            config: Record<string, unknown>;
        }>;
        theme: {
            primaryColor: string;
            layout: 'grid' | 'flex';
        };
    };
}
