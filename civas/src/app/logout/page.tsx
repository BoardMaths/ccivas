'use client';

import { signOut } from "next-auth/react";

export default function LogoutPage() {
    return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-50 dark:bg-black">
            <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h1 className="mb-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Ready to leave?
                </h1>
                <p className="mb-8 text-zinc-600 dark:text-zinc-400">
                    We hope to see you back soon. Click below to securely sign out.
                </p>
                <button
                    onClick={async () => {
                        await signOut({ redirect: false });
                        window.location.href = "/";
                    }}
                    className="inline-flex h-12 w-full items-center justify-center rounded-full bg-red-600 px-6 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:hover:bg-red-500"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
