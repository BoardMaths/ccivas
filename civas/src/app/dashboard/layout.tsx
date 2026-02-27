import { proxy } from "@/lib/auth";
import { Sidebar, MobileNav } from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authenticate using proxy
  const { role } = await proxy();

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-zinc-50 dark:bg-black">
      {/* Sidebar - Desktop */}
      <Sidebar userRole={role} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="container mx-auto">{children}</div>
      </main>

      {/* Mobile Nav - Bottom Bar */}
      <MobileNav userRole={role} />
    </div>
  );
}
