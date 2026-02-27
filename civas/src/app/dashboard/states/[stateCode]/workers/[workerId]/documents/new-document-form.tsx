"use client";

import { useState, useRef } from "react";
import { createWorkerDocument } from "@/lib/actions";
import { uploadFile } from "@/lib/file-upload";
import { DocumentType } from "@prisma/client";


const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    BIRTH_CERTIFICATE_AGE_DECLARATION: "Birth Certificate / Declaration of Age",
    NOTIFICATION_OF_APPOINTMENT: "Notification of Appointment",
    CONVERSION_TO_PERMANENT_APPOINTMENT: "Conversion to Permanent Appointment",
    CONFIRMATION_OF_APPOINTMENT: "Confirmation of Appointment",
    NOTIFICATION_OF_PROMOTION: "Notification of Promotion",
    FIRST_SCHOOL_LEAVING_CERTIFICATE: "First School Leaving Certificate",
    SCHOOL_CERTIFICATE: "School Certificates",
    NIN_SLIP: "NIN Slip",
    OTHER: "Others",
};

interface ExtractedData {
    extractedName?: string;
    extractedDate?: string;
    confidence: number;
    warnings: string[];
    rawText?: string;
    extractedData?: Record<string, any>;
}

export default function NewDocumentForm({ workerId }: { workerId: string }) {
    const [name, setName] = useState("");
    const [type, setType] = useState<DocumentType>("BIRTH_CERTIFICATE_AGE_DECLARATION");
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);


    // Review step state removed
    // const [showReviewForm, setShowReviewForm] = useState(false);
    // const [uploadedUrl, setUploadedUrl] = useState("");
    // const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setMessage({ type: "error", text: "Please select a file" });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            // Step 1: Upload File
            setMessage({ type: "success", text: "Uploading file..." });
            const uploadResult = await uploadFile(file, { folder: "worker_documents" });

            // Step 2: Create Document (Analyses in background, sets isVerified=false)
            setMessage({ type: "success", text: "Processing..." });

            const result = await createWorkerDocument({
                workerId,
                type,
                url: uploadResult.url,
                name: name || file.name,
            });

            if (result.success) {
                setMessage({ type: "success", text: "Document uploaded successfully! Add another or proceed to review." });
                setFile(null);
                setName("");
                if (fileInputRef.current) fileInputRef.current.value = "";
            } else {
                setMessage({ type: "error", text: result.error || "Failed to create document" });
            }
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Upload failed" });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">

            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Add Document</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Document Type */}
                <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                        Document Type
                    </label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as DocumentType)}
                        disabled={isLoading}
                        className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:text-zinc-100 disabled:opacity-50"
                    >
                        {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((t) => (
                            <option key={t} value={t}>
                                {DOCUMENT_TYPE_LABELS[t]}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Name (Optional) */}
                <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                        Document Name (Optional)
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Front Side"
                        disabled={isLoading}
                        className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:text-zinc-100 disabled:opacity-50"
                    />
                </div>

                {/* File Input */}
                <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                        File
                    </label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        disabled={isLoading}
                        className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300 disabled:opacity-50"
                    />
                </div>

                {message && (
                    <div className={`text-sm p-3 rounded-md ${message.type === "success"
                        ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        }`}>
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || !file}
                    className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 transition-colors"
                >
                    {isLoading ? "Uploading..." : "Upload Document"}
                </button>
            </form>
        </div>
    );
}
