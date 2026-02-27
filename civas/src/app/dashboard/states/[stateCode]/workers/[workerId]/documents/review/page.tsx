"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import WorkerAuditForm from "./worker-audit-form";
import { getWorkerAuditData } from "@/lib/actions";
import { Worker, Document, Promotion, AcademicCertificate } from "@prisma/client";
import Link from "next/link";

export default function DocumentReviewPage() {
    return (
        <Suspense fallback={<div className="flex h-64 w-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100"></div></div>}>
            <DocumentReviewContent />
        </Suspense>
    );
}

function DocumentReviewContent() {
    const router = useRouter();
    const params = useParams();
    const workerId = params?.workerId as string;
    const stateCode = params?.stateCode as string;

    const [data, setData] = useState<Worker & {
        documents: Document[],
        promotions: Promotion[],
        certificates: AcademicCertificate[]
    } | null>(null);
    const [cadres, setCadres] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAuditData = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getWorkerAuditData(workerId);
            if (result.success && result.worker) {
                setData(result.worker as any);
                setCadres((result as any).cadres || []);
            } else {
                setData(null);
            }
        } catch (error) {
            console.error("Failed to fetch audit data", error);
        } finally {
            setIsLoading(false);
        }
    }, [workerId]);

    useEffect(() => {
        fetchAuditData();
    }, [fetchAuditData]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 mb-4"></div>
                <p className="text-zinc-500 animate-pulse font-medium">Analyzing documents with AI...</p>
            </div>
        );
    }

    if (!data || data.documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center px-4">
                <div className="h-20 w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-3xl mb-4">
                    📂
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">No Documents to Audit</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-xs">
                    Please upload documents for this worker first before starting the audit.
                </p>
                <Link
                    href={`/dashboard/states/${stateCode}/workers/${workerId}/documents`}
                    className="mt-6 px-6 py-2 bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                >
                    Back to Upload
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl p-6 lg:p-12">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Worker Intelligence Audit</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    Verifying official records for <span className="font-bold text-zinc-900 dark:text-zinc-100">{data.fullName}</span>
                </p>
            </div>

            <WorkerAuditForm
                worker={data}
                stateCode={stateCode}
                cadres={cadres}
            />
        </div>
    );
}
