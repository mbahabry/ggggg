import { requireDriver } from "@/lib/require-auth";
import { DriverTopbar } from "@/components/layout/driver-topbar";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await requireDriver();

  return (
    <div className="min-h-screen flex flex-col">
      <DriverTopbar userName={session.user.name} />
      <main className="flex-1 p-4 md:p-6 max-w-2xl w-full mx-auto space-y-6">{children}</main>
    </div>
  );
}
