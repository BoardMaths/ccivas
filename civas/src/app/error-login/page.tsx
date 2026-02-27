import {
  LoginLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Authentication Error
        </h1>
        {
          // Note: In Next.js 15+, searchParams is a promise
        }
        <ErrorMessage searchParams={searchParams} />

        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          Something went wrong during sign in. Please try again.
        </p>
        <div className="flex flex-col gap-4">
          <LoginLink className="inline-flex h-12 w-full items-center justify-center rounded-full bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
            Try Again
          </LoginLink>
          <RegisterLink className="inline-flex h-12 w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-medium text-black transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-800 dark:bg-black dark:text-white dark:hover:bg-zinc-900">
            Create Account
          </RegisterLink>
        </div>
      </div>
    </div>
  );
}

// Client component to unwrap the promise could be cleaner, but async component is fine too
async function ErrorMessage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const error = params?.error;

  if (!error) return <h2 className="mb-4 text-xl font-semibold">Welcome Back</h2>;

  return (
    <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/20 dark:text-red-400">
      {decodeURIComponent(String(error))}
    </div>
  );
}
