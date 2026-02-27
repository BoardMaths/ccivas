import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditWorkerForm from "./EditWorkerForm";

export default async function EditWorkerProfilePage({
    params
}: {
    params: Promise<{ stateCode: string; workerId: string }>
}) {
    const { stateCode, workerId } = await params;

    const worker = (await (prisma as any).worker.findUnique({
        where: { id: workerId },
        include: {
            state: true,
            cadre: true,
            promotions: { orderBy: { date: 'asc' } },
            certificates: { orderBy: { year: 'asc' } },
        }
    })) as any;

    if (!worker) notFound();

    const cadres = await (prisma as any).cadre.findMany({
        where: { stateId: worker.stateId },
        orderBy: { name: 'asc' }
    });

    const states = await prisma.state.findMany({
        orderBy: { name: 'asc' }
    });

    return <EditWorkerForm worker={worker} cadres={cadres} states={states} />;
}
