"use client";

import { useRef, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchInput({
  placeholder = "بحث...",
  paramKey = "q",
}: {
  placeholder?: string;
  paramKey?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentValue = searchParams.get(paramKey) ?? "";
  const [, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(newValue: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (newValue) {
        params.set(paramKey, newValue);
      } else {
        params.delete(paramKey);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 350);
  }

  return (
    <div className="relative w-full sm:w-72">
      <SearchIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        key={currentValue}
        defaultValue={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="pr-8"
      />
    </div>
  );
}
