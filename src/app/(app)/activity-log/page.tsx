import { HistoryIcon } from "lucide-react";

import { requirePermission } from "@/lib/require-auth";
import { getActivityLogList } from "@/lib/queries/activity-log";
import { parsePageParam } from "@/lib/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("viewActivityLog");
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const entityType = typeof sp.entityType === "string" ? sp.entityType : undefined;

  const { logs, total, totalPages, entityTypes } = await getActivityLogList({ q, entityType, page });

  const entityOptions = entityTypes.map((e) => ({ value: e, label: e }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">سجل النشاط</h1>
        <p className="text-muted-foreground text-sm mt-1">سجل جميع العمليات المهمة التي تمت في النظام ({total})</p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput placeholder="بحث بالوصف أو اسم المستخدم..." />
            <FilterSelect paramKey="entityType" placeholder="نوع الكيان" options={entityOptions} />
          </div>

          {logs.length === 0 ? (
            <EmptyState icon={HistoryIcon} title="لا يوجد نشاط مسجل" description="لم يتم العثور على سجلات مطابقة" />
          ) : (
            <>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{log.entityType}</Badge>
                      <Badge variant="secondary">{log.action}</Badge>
                      <span className="text-muted-foreground text-xs">{formatDateTime(log.createdAt)}</span>
                    </div>
                    <p className="mt-1.5">{log.description}</p>
                    <p className="text-muted-foreground text-xs mt-1">بواسطة: {log.userName}</p>
                    {(log.oldValue || log.newValue) && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {log.oldValue ? (
                          <div className="rounded bg-muted p-2 overflow-x-auto">
                            <p className="text-muted-foreground mb-1">القيمة السابقة</p>
                            <pre className="whitespace-pre-wrap break-all">
                              {JSON.stringify(log.oldValue, null, 2)}
                            </pre>
                          </div>
                        ) : (
                          <div />
                        )}
                        {log.newValue && (
                          <div className="rounded bg-muted p-2 overflow-x-auto">
                            <p className="text-muted-foreground mb-1">القيمة الجديدة</p>
                            <pre className="whitespace-pre-wrap break-all">
                              {JSON.stringify(log.newValue, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <PaginationControls currentPage={page} totalPages={totalPages} totalItems={total} pageSize={10} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
