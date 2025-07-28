import { createClient } from '@supabase/supabase-js';

// Support both manual env vars and Vercel-Supabase integration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Course {
    id: string;
    name: string;
    instructor: string;
    user_id: string;
    syllabus_data: Record<string, unknown>; // JSON field containing parsed syllabus
    dashboard_layout: Record<string, unknown>; // JSON field containing LLM-generated layout
    created_at: string;
    updated_at: string;
}

export interface SyllabusFile {
    id: string;
    course_id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    uploaded_at: string;
}

// Helper functions for database operations
export async function createCourse(courseData: Partial<Course>) {
    const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getCourse(courseId: string) {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

    if (error) throw error;
    return data;
}

export async function getUserCourses(userId: string) {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function updateCourseDashboard(courseId: string, dashboardLayout: Record<string, unknown>) {
    const { data, error } = await supabase
        .from('courses')
        .update({
            dashboard_layout: dashboardLayout,
            updated_at: new Date().toISOString()
        })
        .eq('id', courseId)
        .select()
        .single();

    if (error) throw error;
    return data;
}
