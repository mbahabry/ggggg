import { requirePermission } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { ToggleActiveButton } from "@/components/users/toggle-active-button";
import { ROLE_LABELS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";

export default async function UsersPage() {
  await requirePermission("manageUsers");

  const [users, unlinkedDrivers] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.driver.findMany({ where: { userId: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">المستخدمون والصلاحيات</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة حسابات المستخدمين وأدوارهم ({users.length})</p>
        </div>
        <UserFormDialog unlinkedDrivers={unlinkedDrivers} />
      </div>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-52"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell dir="ltr" className="text-right">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ROLE_LABELS[u.role]}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "success" : "destructive"}>
                        {u.isActive ? "مفعل" : "موقوف"}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <UserFormDialog
                        unlinkedDrivers={unlinkedDrivers}
                        user={{
                          id: u.id,
                          name: u.name,
                          email: u.email,
                          phone: u.phone,
                          role: u.role,
                          isActive: u.isActive,
                        }}
                      />
                      <ToggleActiveButton id={u.id} isActive={u.isActive} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
