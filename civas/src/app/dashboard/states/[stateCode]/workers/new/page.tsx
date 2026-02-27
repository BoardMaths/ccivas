import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddWorkerForm from "./AddWorkerForm";

export default async function NewWorkerPage({
    params
}: {
    params: Promise<{ stateCode: string }>
}) {
    const { stateCode } = await params;
    const state = await prisma.state.findUnique({
        where: { code: stateCode }
    });

    if (!state) notFound();

    const cadres = await prisma.cadre.findMany({
        where: { stateId: state.id },
        orderBy: { name: "asc" }
    });

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-screen bg-zinc-50/20 dark:bg-zinc-950/20">
            <div className="mb-12">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4 bg-blue-50 dark:bg-blue-900/20 w-fit px-4 py-1.5 rounded-full">
                    <Link href={`/dashboard/states/${stateCode}`} className="hover:underline">{state.name} State Registry</Link>
                    <span className="text-zinc-300">/</span>
                    <span className="text-zinc-500">New Onboarding</span>
                </div>
                <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">Personnel Enrollment</h1>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">Capture initial appointment details to begin auditing career progression.</p>
            </div>

            <AddWorkerForm state={state} cadres={cadres} />

            <div className="mt-12 text-center pb-20">
                <Link
                    href={`/dashboard/states/${stateCode}/workers`}
                    className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                >
                    &larr; Abort Enrollment
                </Link>
            </div>
        </div>
    );
}
