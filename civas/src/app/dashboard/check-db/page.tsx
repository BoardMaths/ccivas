import { prisma } from "@/lib/prisma";

export default async function CheckDbPage() {
    const states = await prisma.state.findMany({
        select: { name: true, code: true, id: true }
    });

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-6">Database States Check</h1>
            <div className="bg-zinc-100 p-6 rounded-2xl">
                <h2 className="font-semibold mb-2">Available States:</h2>
                <ul className="list-disc pl-5">
                    {states.map(s => (
                        <li key={s.id}>
                            {s.name} - <span className="font-mono bg-white px-2 rounded border">{s.code}</span> (ID: {s.id})
                        </li>
                    ))}
                </ul>
                {states.length === 0 && <p className="text-red-500">No states found in database!</p>}
            </div>
            <div className="mt-8">
                <p>Current Page Path: <code>/dashboard/check-db</code></p>
                <p>Attempting to access: <code>/dashboard/states/EK</code></p>
            </div>
        </div>
    );
}
