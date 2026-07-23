import { Building2Icon } from "lucide-react";

import { requirePermission } from "@/lib/require-auth";
import { getCustomersList } from "@/lib/queries/customers";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { SearchInput } from "@/components/shared/search-input";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { formatSAR } from "@/lib/format";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("manageCustomers");
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const { customers, total, totalPages } = await getCustomersList({ q, page });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">العملاء</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة بيانات العملاء ({total} عميل)</p>
        </div>
        <CustomerFormDialog />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <SearchInput placeholder="بحث بالاسم أو رقم الجوال..." />

          {customers.length === 0 ? (
            <EmptyState icon={Building2Icon} title="لا يوجد عملاء" description="لم يتم العثور على عملاء مطابقين" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم العميل</TableHead>
                      <TableHead>مسؤول التواصل</TableHead>
                      <TableHead>الجوال</TableHead>
                      <TableHead>عدد الرحلات</TableHead>
                      <TableHead>إجمالي التعاملات</TableHead>
                      <TableHead>الرصيد المستحق</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.contactName ?? "—"}</TableCell>
                        <TableCell dir="ltr" className="text-right">{c.phone}</TableCell>
                        <TableCell className="tabular-nums">{c.tripsCount}</TableCell>
                        <TableCell>{formatSAR(c.totalDealsValue)}</TableCell>
                        <TableCell className={c.outstandingBalance > 0 ? "text-destructive font-medium" : ""}>
                          {formatSAR(c.outstandingBalance)}
                        </TableCell>
                        <TableCell>
                          <CustomerFormDialog customer={c} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls currentPage={page} totalPages={totalPages} totalItems={total} pageSize={10} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
