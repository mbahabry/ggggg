"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronRightIcon, ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPaginationRange } from "@/lib/pagination";

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return (
      <p className="text-muted-foreground text-xs">
        إجمالي النتائج: {totalItems}
      </p>
    );
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  const range = getPaginationRange(currentPage, totalPages);
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-muted-foreground text-xs">
        عرض {from}–{to} من أصل {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={currentPage <= 1}
          onClick={() => goToPage(currentPage - 1)}
        >
          <ChevronRightIcon className="size-4" />
        </Button>
        {range.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="px-1.5 text-muted-foreground text-sm">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "outline"}
              size="icon"
              className="size-8"
              onClick={() => goToPage(p)}
            >
              {p}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={currentPage >= totalPages}
          onClick={() => goToPage(currentPage + 1)}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
