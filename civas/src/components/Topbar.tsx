import { signOut } from "@/auth";

export default function Topbar() {
    return (
        <header className="w-full bg-white shadow p-4 flex justify-between items-center transition-all dark:bg-zinc-950 dark:border-b dark:border-zinc-800">
            <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">Dashboard</h2>

            <form action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
            }}>
                <button type="submit" className="text-red-500 font-medium hover:text-red-600 transition-colors">
                    Logout
                </button>
            </form>
        </header>
    );
}
