"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function UnauthorizedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-zinc-900 dark:to-zinc-950 px-4">
            <div className="w-full max-w-md space-y-8 rounded-3xl border border-red-200 bg-white p-10 shadow-2xl dark:border-red-900/30 dark:bg-zinc-900">
                <div className="text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <path d="M12 9v4" />
                            <path d="M12 17h.01" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Access Denied</h2>
                    <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
                        Your email address is not authorized to access the CIVAS platform.
                    </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-6 dark:bg-zinc-800/50">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        To maintain project security, only pre-approved staff members can access the dashboard. If you believe this is a mistake, please contact your state administrator.
                    </p>
                </div>

                <div className="pt-4">
                    <button
                        onClick={async () => {
                            await signOut({ redirect: false });
                            window.location.href = "/";
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                        Sign out and try another account
                    </button>
                    <Link
                        href="/"
                        className="mt-4 block text-center text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
