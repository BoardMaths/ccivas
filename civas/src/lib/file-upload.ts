/**
 * Unified File Upload Utility
 * Supports both Cloudinary and AWS S3 with environment-based switching
 * Default provider: Cloudinary
 */

import { uploadToS3 } from "./aws-upload";

// Get the upload provider from environment (default: cloudinary)
const UPLOAD_PROVIDER =
    process.env.NEXT_PUBLIC_UPLOAD_PROVIDER || "cloudinary";

// Cloudinary config
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface UploadResult {
    url: string;
    publicId?: string;
}

export interface UploadOptions {
    folder?: string;
}

/**
 * Upload an image file to the configured provider (Cloudinary or AWS S3)
 * @param file - The file to upload
 * @param options - Upload options
 * @returns Promise with the upload result containing the URL
 */
export async function uploadFile(
    file: File,
    options?: UploadOptions
): Promise<UploadResult> {
    // Validate file
    if (!file) {
        throw new Error("No file provided");
    }

    // Validate file type (images only)
    const validImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
    ];
    if (!validImageTypes.includes(file.type)) {
        throw new Error(
            "Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or PDF"
        );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        throw new Error("File size too large. Maximum size is 10MB");
    }

    if (UPLOAD_PROVIDER === "aws") {
        return uploadToAWS(file, options);
    } else {
        return uploadToCloudinary(file, options);
    }
}

/**
 * Upload to Cloudinary (client-side unsigned upload)
 */
async function uploadToCloudinary(
    file: File,
    options?: UploadOptions
): Promise<UploadResult> {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error(
            "Cloudinary configuration missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"
        );
    }

    console.log("[cloudinary-upload] Pre-flight check:", {
        cloudName: CLOUDINARY_CLOUD_NAME,
        preset: CLOUDINARY_UPLOAD_PRESET,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        folder: options?.folder
    });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    if (options?.folder) {
        formData.append("folder", options.folder);
    }

    try {
        const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
        console.log("[cloudinary-upload] Uploading to:", url);

        const response = await fetch(url, {
            method: "POST",
            body: formData,
        }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("[cloudinary-upload] Error response:", errorData);
            throw new Error(
                errorData.error?.message || "Failed to upload image to Cloudinary"
            );
        }

        const data = await response.json();
        console.log("[cloudinary-upload] Success:", {
            url: data.secure_url,
            publicId: data.public_id
        });
        return {
            url: data.secure_url,
            publicId: data.public_id,
        };
    } catch (error) {
        console.error("[cloudinary-upload] Catch error:", error);
        if (error instanceof Error) {
            throw new Error(`Cloudinary upload failed: ${error.message}`);
        }
        throw new Error("Cloudinary upload failed: Unknown error");
    }
}

/**
 * Upload to AWS S3 (via server action)
 */
async function uploadToAWS(
    file: File,
    options?: UploadOptions
): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", file);

    if (options?.folder) {
        formData.append("folder", options.folder);
    }

    const result = await uploadToS3(formData);
    return { url: result.url };
}

/**
 * Get the current upload provider
 */
export function getUploadProvider(): "cloudinary" | "aws" {
    return UPLOAD_PROVIDER as "cloudinary" | "aws";
}
