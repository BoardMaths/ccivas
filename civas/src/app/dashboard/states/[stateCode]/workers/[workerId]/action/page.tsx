import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CareerActionForm from "./CareerActionForm";

export default async function CareerActionPage({
    params
}: {
    params: Promise<{ stateCode: string, workerId: string }>
}) {
    const { stateCode, workerId } = await params;

    const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        include: {
            state: true,
            cadre: true
        }
    });

    if (!worker) notFound();

    return (
        <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/50 pb-20">
            <CareerActionForm worker={worker} stateCode={stateCode} />
        </div>
    );
}
