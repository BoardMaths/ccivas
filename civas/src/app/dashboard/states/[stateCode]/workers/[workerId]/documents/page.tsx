import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import NewDocumentForm from "./new-document-form";
import DeleteDocumentButton from "./delete-document-button";


export default async function WorkerDocumentsPage({
    params
}: {
    params: Promise<{ stateCode: string; workerId: string }>
}) {
    const { stateCode, workerId } = await params;

    const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        include: { documents: { orderBy: { createdAt: "desc" } } }
    });

    if (!worker) notFound();

    const unverifiedDocs = worker.documents.filter(doc => !doc.isVerified);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                        <Link href={`/dashboard/states/${stateCode}`} className="hover:underline">State</Link>
                        <span>/</span>
                        <Link href={`/dashboard/states/${stateCode}/workers`} className="hover:underline">Workers</Link>
                        <span>/</span>
                        <span>{worker.fullName}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Worker Documents</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Manage documents for {worker.fullName} ({worker.staffId})</p>
                </div>
                <Link
                    href={`/dashboard/states/${stateCode}/workers`}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800"
                >
                    Back to List
                </Link>
            </div>

            {/* 
            {unverifiedDocs.length > 0 && (
                <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold">
                            !
                        </span>
                        <div>
                            <h3 className="font-semibold text-amber-900 dark:text-amber-400">Action Required</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-500">
                                You have {unverifiedDocs.length} document{unverifiedDocs.length !== 1 ? 's' : ''} pending review.
                            </p>
                        </div>
                    </div>
                    <Link
                        href={`/dashboard/states/${stateCode}/workers/${workerId}/documents/review`}
                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                    >
                        Review & Audit Documents ({unverifiedDocs.length})
                    </Link>
                </div>
            )}
            */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                        <p className="text-sm text-zinc-500">Document uploading is temporarily disabled.</p>
                    </div>
                    {/* <NewDocumentForm workerId={worker.id} /> */}
                </div>

                {/* Right Column: List */}
                <div className="lg:col-span-2">
                    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Uploaded Documents</h2>
                            <span className="text-xs text-zinc-500">{worker.documents.length} Total</span>
                        </div>

                        {worker.documents.length === 0 ? (
                            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
                                No documents uploaded yet.
                            </div>
                        ) : (
                            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {worker.documents.map((doc) => (
                                    <li key={doc.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold text-xs uppercase relative">
                                                {doc.type.substring(0, 3)}
                                                {doc.isVerified && (
                                                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                        {doc.name || doc.type.replace(/_/g, " ")}
                                                    </p>
                                                    {!doc.isVerified && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium whitespace-nowrap">Pending Verification</span>
                                                    )}
                                                    {doc.isVerified && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium whitespace-nowrap">Verified</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-zinc-500">
                                                    Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg dark:text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors"
                                            >
                                                View
                                            </a>
                                            <DeleteDocumentButton documentId={doc.id} workerId={worker.id} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
