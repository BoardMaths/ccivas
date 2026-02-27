"use client";

import { useTransition } from "react";
import { deleteDocument } from "@/lib/actions";

interface DeleteDocumentButtonProps {
    documentId: string;
    workerId: string;
}

export default function DeleteDocumentButton({ documentId, workerId }: DeleteDocumentButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
            startTransition(async () => {
                await deleteDocument(documentId, workerId);
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
        >
            {isPending ? "Deleting..." : "Delete"}
        </button>
    );
}
