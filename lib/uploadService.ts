import { supabase } from '@/lib/supabase';
import { AuthService } from '@/lib/authService';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
    success: boolean;
    data?: {
        filePath: string;
        publicUrl: string;
        fileName: string;
        fileSize: number;
    };
    error?: string;
    needsAuth?: boolean; // Indicates if authentication is required
}

export interface UploadStatus {
    isUploading: boolean;
    success: boolean;
    error: string | null;
    fileUrl: string | null;
}

export class UploadService {
    /**
     * Uploads a file to Supabase Storage
     * @param file - The file to upload
     * @returns Promise<UploadResult> - Result of the upload operation
     */
    static async uploadFileToSupabase(file: File): Promise<UploadResult> {
        try {
            // Check if user is authenticated
            const authResult = await AuthService.getCurrentUser();

            if (!authResult.success || !authResult.user) {
                return {
                    success: false,
                    needsAuth: true,
                    error: 'Authentication required. Please complete the captcha to continue.'
                };
            }

            const userId = authResult.user.id;

            // Generate unique filename
            const uniqueFilename = `${uuidv4()}-${file.name}`;
            const filePath = `${userId}/${uniqueFilename}`;

            // Upload file to Supabase Storage
            const { data, error } = await supabase.storage
                .from('syllabi')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                return {
                    success: false,
                    error: `Upload failed: ${error.message}`
                };
            }

            // Get public URL for the uploaded file
            const { data: { publicUrl } } = supabase.storage
                .from('syllabi')
                .getPublicUrl(filePath);

            const result = {
                success: true,
                data: {
                    filePath: data.path,
                    publicUrl: publicUrl,
                    fileName: file.name,
                    fileSize: file.size
                }
            };

            // Log success for debugging
            console.log('File uploaded successfully:', result.data);

            return result;

        } catch (error) {
            console.error('Upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            };
        }
    }

    /**
     * Creates initial upload status
     */
    static createInitialStatus(): UploadStatus {
        return {
            isUploading: false,
            success: false,
            error: null,
            fileUrl: null
        };
    }

    /**
     * Updates upload status to uploading state
     */
    static createUploadingStatus(): UploadStatus {
        return {
            isUploading: true,
            success: false,
            error: null,
            fileUrl: null
        };
    }

    /**
     * Updates upload status to success state
     */
    static createSuccessStatus(fileUrl: string): UploadStatus {
        return {
            isUploading: false,
            success: true,
            error: null,
            fileUrl: fileUrl
        };
    }

    /**
     * Updates upload status to error state
     */
    static createErrorStatus(error: string): UploadStatus {
        return {
            isUploading: false,
            success: false,
            error: error,
            fileUrl: null
        };
    }
}
