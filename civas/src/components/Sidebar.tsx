"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  requiredRole?: "USER" | "ADMIN" | "SUPERADMIN";
}

const globalItems: SidebarItem[] = [
  {
    name: "Workspace Selection",
    href: "/dashboard",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    name: "Users",
    href: "/dashboard/users",
    requiredRole: "ADMIN", // Admin and Superadmin can see this
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    name: "Activity Logs",
    href: "/dashboard/activity-logs",
    requiredRole: "SUPERADMIN",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
  {
    name: "States Registry",
    href: "/dashboard/states",
    requiredRole: "ADMIN",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

const getStateItems = (stateCode: string): SidebarItem[] => [
  {
    name: "Home",
    href: `/dashboard/states/${stateCode}`,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    name: "Workers",
    href: `/dashboard/states/${stateCode}/workers`,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    name: "New Profile",
    href: `/dashboard/states/${stateCode}/workers/upload`,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
];

export function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const params = useParams();
  const stateCode = params.stateCode as string | undefined;

  const filterByRole = (items: SidebarItem[]) =>
    items.filter((item) => {
      if (!item.requiredRole) return true;
      if (item.requiredRole === "SUPERADMIN") return userRole === "SUPERADMIN";
      if (item.requiredRole === "ADMIN")
        return userRole === "SUPERADMIN" || userRole === "ADMIN";
      return true;
    });

  const activeGlobal = filterByRole(globalItems);
  const activeState = stateCode ? filterByRole(getStateItems(stateCode)) : [];

  const NavLink = ({ item }: { item: SidebarItem }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`group flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-all ${isActive
          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          }`}
      >
        <span
          className={`mr-3 transition-colors ${isActive
            ? "text-blue-600 dark:text-blue-400"
            : "text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-50"
            }`}
        >
          {item.icon}
        </span>
        {item.name}
      </Link>
    );
  };

  return (
    <aside className="hidden w-64 border-r border-zinc-200 bg-white/50 backdrop-blur-md dark:border-zinc-800 dark:bg-black/50 md:block">
      <div className="flex h-full flex-col px-3 py-6">
        <div className="space-y-6">
          {/* Global Registry Links */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Central Registry
            </p>
            <div className="space-y-1">
              {activeGlobal.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* State-Specific Links */}
          {stateCode && (
            <div>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Current Workspace
              </p>
              <div className="space-y-1">
                {activeState.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const params = useParams();
  const stateCode = params.stateCode as string | undefined;

  const filterByRole = (items: SidebarItem[]) =>
    items.filter((item) => {
      if (!item.requiredRole) return true;
      if (item.requiredRole === "SUPERADMIN") return userRole === "SUPERADMIN";
      if (item.requiredRole === "ADMIN")
        return userRole === "SUPERADMIN" || userRole === "ADMIN";
      return true;
    });

  // In mobile, we might want to prioritize state items if in a state
  const items = stateCode
    ? [...filterByRole(getStateItems(stateCode)), globalItems[0]] // State items + Workspace select
    : filterByRole(globalItems);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/75 backdrop-blur-lg dark:border-zinc-800 dark:bg-black/75 md:hidden">
      <div className="flex items-center justify-around p-2 pb-safe">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center p-2 transition-colors ${isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-zinc-600 dark:text-zinc-400"
                }`}
            >
              <span className="mb-1">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
