import { prisma } from "@/lib/prisma";
import { proxy } from "@/lib/auth";
import { createState, deleteState, bulkLoadStates } from "@/lib/actions";
import { revalidatePath } from "next/cache";

export default async function StatesRegistryPage() {
    // Security Guard: Allow Admin and SuperAdmin
    const { role } = await proxy(["ADMIN", "SUPERADMIN"]);

    const states = await prisma.state.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: {
                select: {
                    workers: true,
                },
            },
        },
    });

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                        States Registry
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Manage state-level workspaces and registries.
                    </p>
                </div>

                <div className="flex gap-4">
                    <form
                        action={async () => {
                            "use server";
                            await bulkLoadStates();
                        }}
                    >
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            Load Default States
                        </button>
                    </form>
                    <form
                        action={async (formData) => {
                            "use server";
                            const name = formData.get("name") as string;
                            const code = formData.get("code") as string;
                            if (name && code) {
                                await createState({ name, code });
                            }
                        }}
                        className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm dark:bg-zinc-950 dark:border-zinc-800"
                    >
                        <input
                            name="name"
                            placeholder="State Name (e.g. Lagos)"
                            required
                            className="px-4 py-2 text-sm bg-transparent border-none focus:ring-0 text-zinc-900 dark:text-zinc-50 w-48"
                        />
                        <input
                            name="code"
                            placeholder="Code (e.g. LAS)"
                            required
                            className="px-4 py-2 text-sm bg-transparent border-none focus:ring-0 text-zinc-900 dark:text-zinc-50 w-24"
                        />
                        <button
                            type="submit"
                            className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            Add State
                        </button>
                    </form>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-900/50">
                                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                                    State Name
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                                    Code
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
                                    Total Workers
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {states.map((state) => (
                                <tr
                                    key={state.id}
                                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                            {state.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                                            {state.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                                        {state._count.workers}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <form
                                            action={async () => {
                                                "use server";
                                                const confirmed = true; // Simple confirmation handling could be added client-side
                                                if (confirmed) {
                                                    await deleteState(state.id);
                                                }
                                            }}
                                        >
                                            <button
                                                type="submit"
                                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                                            >
                                                Delete
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {states.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-500 dark:text-zinc-400 mb-6">No states found in the registry.</p>
                    <form
                        action={async () => {
                            "use server";
                            await bulkLoadStates();
                        }}
                    >
                        <button
                            type="submit"
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                        >
                            Load All Nigerian States
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
