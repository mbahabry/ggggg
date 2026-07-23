import { requireSession } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const alertsCount = await prisma.alert.count({ where: { isResolved: false } });

  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:flex w-64 shrink-0 border-l">
        <SidebarNav role={session.user.role} />
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          userName={session.user.name}
          userRole={session.user.role}
          alertsCount={alertsCount}
        />
        <main className="flex-1 min-w-0 p-4 md:p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
