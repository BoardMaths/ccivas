"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// S3 Client configuration
const getS3Client = () => {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !accessKeyId || !secretAccessKey) {
        throw new Error(
            "AWS configuration missing. Please set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY"
        );
    }

    return new S3Client({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
        endpoint: `https://s3.${region}.amazonaws.com`,
        forcePathStyle: true,
    });
};

const getBucketName = () => {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
        throw new Error("AWS_S3_BUCKET environment variable is not set");
    }
    return bucket;
};

export interface S3UploadResult {
    url: string;
    key: string;
}

/**
 * Upload a file to S3 via server action
 * @param formData - FormData containing the file and optional folder
 * @returns The public URL and S3 key of the uploaded file
 */
export async function uploadToS3(formData: FormData): Promise<S3UploadResult> {
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "workers";

    if (!file) {
        throw new Error("No file provided");
    }

    const s3 = getS3Client();
    const bucket = getBucketName();
    const region = process.env.AWS_REGION!;

    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}`;
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `civas/${folder}/${uniqueSuffix}-${sanitizedName}`;

    try {
        const buffer = Buffer.from(await file.arrayBuffer());

        await s3.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: buffer,
                ContentType: file.type,
                Metadata: {
                    originalName: file.name,
                    uploadedAt: new Date().toISOString(),
                },
            })
        );

        const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

        console.log("[aws-upload] Successfully uploaded file:", { key, url });

        return { url, key };
    } catch (error) {
        console.error("[aws-upload] Error uploading file to S3:", error);
        throw new Error(
            `Failed to upload file to S3: ${error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
}

/**
 * Delete a file from S3
 * @param input - Object containing either key or url
 */
export async function deleteFromS3(input: {
    key?: string;
    url?: string;
}): Promise<void> {
    const { key, url } = input;
    const bucket = getBucketName();
    const region = process.env.AWS_REGION!;

    let objectKey = key;
    const bucketHost = `${bucket}.s3.${region}.amazonaws.com/`;

    if (!objectKey && url) {
        const idx = url.indexOf(bucketHost);
        if (idx === -1) {
            throw new Error(`Invalid S3 URL format. Expected host: ${bucketHost}`);
        }
        objectKey = url.substring(idx + bucketHost.length);
    }

    if (!objectKey) {
        throw new Error("Missing key or valid url");
    }

    const s3 = getS3Client();
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

    try {
        await s3.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: objectKey,
            })
        );
        console.log("[aws-upload] Successfully deleted file:", objectKey);
    } catch (error) {
        console.error("[aws-upload] Error deleting file from S3:", error);
        throw new Error(
            `Failed to delete file from S3: ${error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
}
