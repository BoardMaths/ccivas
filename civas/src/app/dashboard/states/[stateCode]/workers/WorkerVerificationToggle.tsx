"use client";

import { useState } from "react";
import { verifyWorker } from "@/lib/actions";

interface WorkerVerificationToggleProps {
    workerId: string;
    initialIsVerified: boolean;
}

export default function WorkerVerificationToggle({
    workerId,
    initialIsVerified,
}: WorkerVerificationToggleProps) {
    const [isVerified, setIsVerified] = useState(initialIsVerified);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating to the worker profile first
        e.stopPropagation();

        // Optimistic update
        const newValue = !isVerified;
        setIsVerified(newValue);
        setIsLoading(true);

        try {
            const result = await verifyWorker(workerId, newValue);
            if (!result.success) {
                // Revert on failure
                setIsVerified(!newValue);
                console.error("Failed to verify worker:", result.error);
                alert("Failed to update status. Please try again.");
            }
        } catch (error) {
            // Revert on error
            setIsVerified(!newValue);
            console.error("Error verifying worker:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed ${isVerified
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50"
                    : "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50"
                }`}
            title={isVerified ? "Click to Unverify" : "Click to Verify"}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? "bg-emerald-500" : "bg-yellow-500"}`} />
            {isLoading ? "..." : isVerified ? "Verified" : "Unverified"}
        </button>
    );
}
