"use client";

import { useState } from "react";
import { DocumentType } from "@prisma/client";
import { saveDocumentWithData } from "@/lib/actions";

interface ExtractedData {
    extractedName?: string;
    extractedDate?: string;
    confidence: number;
    warnings: string[];
    rawText?: string;
    extractedData?: Record<string, any>;
}

interface DocumentReviewFormProps {
    documentId?: string; // Optional for new creates, required for updates
    workerId: string;
    documentType: DocumentType;
    documentUrl: string;
    documentName: string;
    extractedData: ExtractedData;
    onCancel: () => void;
    onSuccess: () => void;
}

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

export default function DocumentReviewForm({
    documentId,
    workerId,
    documentType,
    documentUrl,
    documentName,
    extractedData,
    onCancel,
    onSuccess,
}: DocumentReviewFormProps) {
    const [name, setName] = useState(extractedData.extractedName || "");
    const [date, setDate] = useState(() => {
        if (!extractedData.extractedDate) return "";
        try {
            return new Date(extractedData.extractedDate).toISOString().split("T")[0];
        } catch (e) {
            return "";
        }
    });
    const [nin, setNin] = useState(extractedData.extractedData?.nin || "");
    const [rank, setRank] = useState(extractedData.extractedData?.rank || "");
    const [salary, setSalary] = useState(extractedData.extractedData?.salary || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isPromotionOrAppointment = documentType.includes("PROMOTION") || documentType.includes("APPOINTMENT");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {

            let result;

            if (documentId) {
                // Update existing unverified document
                // Dynamic import to avoid server action issues in client component if not handled correctly? 
                // No, we imported at top. But we need to import updateDocumentWithData.
                // We will add the import at the top later.
                // Assuming updateDocumentWithData is available.
                const { updateDocumentWithData } = await import("@/lib/actions");

                result = await updateDocumentWithData({
                    documentId,
                    workerId,
                    name: documentName, // Or use a name state if editable
                    extractedName: name,
                    extractedDate: date || undefined,
                    nin: nin || undefined,
                    rank: rank || undefined,
                    salary: salary || undefined,
                    confidence: extractedData.confidence,
                    warnings: extractedData.warnings,
                    rawText: extractedData.rawText,
                });
            } else {
                // Create new document (fallback for old flow)
                result = await saveDocumentWithData({
                    workerId,
                    type: documentType,
                    url: documentUrl,
                    name: documentName,
                    extractedName: name,
                    extractedDate: date || undefined,
                    nin: nin || undefined,
                    rank: rank || undefined,
                    salary: salary || undefined,
                    confidence: extractedData.confidence,
                    warnings: extractedData.warnings,
                    rawText: extractedData.rawText,
                });
            }

            if (result.success) {
                onSuccess();
            } else {
                setError(result.error as string);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save document");
        } finally {
            setIsSubmitting(false);
        }
    };

    const confidenceColor =
        extractedData.confidence > 0.8
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : extractedData.confidence > 0.5
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                            Review Extracted Data
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            {DOCUMENT_TYPE_LABELS[documentType]}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            AI Confidence
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${confidenceColor}`}>
                            {Math.round(extractedData.confidence * 100)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Document Preview */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Document Preview
                </p>
                <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                    <img
                        src={documentUrl}
                        alt="Document preview"
                        className="w-full h-48 object-contain"
                    />
                    <a
                        href={documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute top-2 right-2 px-3 py-1.5 text-xs font-semibold text-white bg-black/70 hover:bg-black/90 rounded-lg backdrop-blur-sm transition-colors"
                    >
                        View Full Size
                    </a>
                </div>
            </div>

            {/* Warnings */}
            {extractedData.warnings.length > 0 && (
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-amber-50 dark:bg-amber-900/10">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                        ⚠️ Warnings
                    </p>
                    <ul className="space-y-1">
                        {extractedData.warnings.map((warning, i) => (
                            <li key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                                <span className="font-bold">•</span>
                                <span>{warning}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Please review and correct the extracted information below before proceeding.
                </p>

                {/* Name Field */}
                <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                        Full Name
                        {extractedData.extractedName && (
                            <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
                                ✓ Auto-extracted
                            </span>
                        )}
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>

                {/* Date Field */}
                <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                        {documentType === "BIRTH_CERTIFICATE_AGE_DECLARATION"
                            ? "Date of Birth"
                            : documentType.includes("APPOINTMENT") || documentType.includes("PROMOTION")
                                ? "Effective Date"
                                : "Date"}
                        {extractedData.extractedDate && (
                            <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
                                ✓ Auto-extracted
                            </span>
                        )}
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>

                {/* NIN Field (if applicable) */}
                {(documentType === "NIN_SLIP" || extractedData.extractedData?.nin) && (
                    <div>
                        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                            NIN (National Identification Number)
                            {extractedData.extractedData?.nin && (
                                <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
                                    ✓ Auto-extracted
                                </span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={nin}
                            onChange={(e) => setNin(e.target.value)}
                            placeholder="Enter NIN"
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                )}

                {/* Rank and Salary Fields (for Promotion/Appointments) */}
                {isPromotionOrAppointment && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                                Rank / Grade Level
                                {extractedData.extractedData?.rank && (
                                    <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
                                        ✓ Auto-extracted
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={rank}
                                onChange={(e) => setRank(e.target.value)}
                                placeholder="e.g. GL 08"
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                                Salary / Scale
                                {extractedData.extractedData?.salary && (
                                    <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
                                        ✓ Auto-extracted
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={salary}
                                onChange={(e) => setSalary(e.target.value)}
                                placeholder="e.g. CONPSS"
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                )}

                {/* Raw Text Summary */}
                {extractedData.rawText && (
                    <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                            AI Summary
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                            {extractedData.rawText}
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
                    >
                        {isSubmitting ? "Saving..." : "Confirm & Save Document"}
                    </button>
                </div>
            </form>
        </div>
    );
}
