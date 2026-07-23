import { WalletIcon } from "lucide-react";

import { requirePermission } from "@/lib/require-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getFinanceList, getFinanceSummary } from "@/lib/queries/finance";
import { parsePageParam } from "@/lib/pagination";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FilterSelect } from "@/components/shared/filter-select";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { FinanceFormDialog } from "@/components/finance/finance-form-dialog";
import { MarkPaidButton } from "@/components/finance/mark-paid-button";
import { FINANCE_TYPE_LABELS, FINANCE_CATEGORY_LABELS } from "@/lib/status-labels";
import { formatSAR, formatDate } from "@/lib/format";
import { TrendingUpIcon, TrendingDownIcon, ScaleIcon, AlertCircleIcon } from "lucide-react";
import type { FinanceType, FinanceCategory } from "@/generated/prisma/client";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePermission("viewFinance");
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const type = typeof sp.type === "string" ? (sp.type as FinanceType) : undefined;
  const category = typeof sp.category === "string" ? (sp.category as FinanceCategory) : undefined;

  const canManage = can(session.user.role, "manageFinance");

  const [{ transactions, total, totalPages }, summary, customers, trucks, drivers] = await Promise.all([
    getFinanceList({ type, category, page }),
    getFinanceSummary(),
    canManage ? prisma.customer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : Promise.resolve([]),
    canManage ? prisma.truck.findMany({ select: { id: true, internalNumber: true }, orderBy: { internalNumber: "asc" } }) : Promise.resolve([]),
    canManage ? prisma.driver.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : Promise.resolve([]),
  ]);

  const typeOptions = Object.entries(FINANCE_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  const categoryOptions = Object.entries(FINANCE_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">المالية</h1>
          <p className="text-muted-foreground text-sm mt-1">الإيرادات والمصروفات والمستحقات</p>
        </div>
        {canManage && <FinanceFormDialog customers={customers} trucks={trucks} drivers={drivers} />}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="إيرادات الشهر الحالي" value={formatSAR(summary.month.revenue)} icon={TrendingUpIcon} tone="success" />
        <StatCard title="مصروفات الشهر الحالي" value={formatSAR(summary.month.expense)} icon={TrendingDownIcon} tone="destructive" />
        <StatCard title="صافي ربح الشهر" value={formatSAR(summary.month.net)} icon={ScaleIcon} tone={summary.month.net >= 0 ? "success" : "destructive"} />
        <StatCard title="إجمالي المستحقات" value={formatSAR(summary.outstanding)} icon={AlertCircleIcon} tone="warning" />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect paramKey="type" placeholder="النوع" options={typeOptions} />
            <FilterSelect paramKey="category" placeholder="التصنيف" options={categoryOptions} />
          </div>

          {transactions.length === 0 ? (
            <EmptyState icon={WalletIcon} title="لا توجد حركات مالية" description="لم يتم العثور على حركات مالية مطابقة" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الوصف</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>التصنيف</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                      {canManage && <TableHead className="w-40"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium max-w-56 truncate">{t.description}</TableCell>
                        <TableCell>
                          <Badge variant={t.type === "REVENUE" ? "success" : "destructive"}>
                            {FINANCE_TYPE_LABELS[t.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {FINANCE_CATEGORY_LABELS[t.category]}
                        </TableCell>
                        <TableCell className={t.type === "REVENUE" ? "text-success font-medium" : "text-destructive font-medium"}>
                          {formatSAR(t.amount.toString())}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(t.date)}</TableCell>
                        <TableCell>
                          <Badge variant={t.isPaid ? "success" : "warning"}>{t.isPaid ? "مدفوعة" : "مستحقة"}</Badge>
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <MarkPaidButton id={t.id} isPaid={t.isPaid} />
                          </TableCell>
                        )}
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
