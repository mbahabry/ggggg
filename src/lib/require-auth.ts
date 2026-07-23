import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { can, type PermissionKey } from "@/lib/permissions";
import type { Session } from "next-auth";

export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requirePermission(permission: PermissionKey): Promise<Session> {
  const session = await requireSession();
  if (!can(session.user.role, permission)) {
    redirect("/403");
  }
  return session;
}

export async function requireDriver(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "DRIVER") {
    redirect("/403");
  }
  return session;
}
