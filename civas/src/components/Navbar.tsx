import Link from "next/link";
import { auth } from "@/auth";
import { signOut } from "@/auth";

export default async function Navbar() {
    const session = await auth();

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/75 backdrop-blur-lg dark:border-zinc-800 dark:bg-black/75 transition-all">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Civas
                        </span>
                    </Link>

                    <div className="hidden items-center space-x-4 md:flex">
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {!session ? (
                        <>
                            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">
                                Sign in
                            </Link>
                            <Link href="/register" className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors">
                                Get Started
                            </Link>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <span className="hidden text-sm text-zinc-600 dark:text-zinc-400 sm:inline-block">
                                {session.user?.name || session.user?.email}
                            </span>
                            <form action={async () => {
                                "use server"
                                await signOut({ redirectTo: "/" })
                            }}>
                                <button type="submit" className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-colors">
                                    Logout
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
