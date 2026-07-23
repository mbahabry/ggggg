"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircleIcon } from "lucide-react";

import { toggleUserActiveAction } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";

export function ToggleActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await toggleUserActiveAction(id, !isActive);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isActive ? "تم إيقاف الحساب" : "تم تفعيل الحساب");
    router.refresh();
  }

  return (
    <Button size="sm" variant={isActive ? "outline" : "default"} onClick={handleClick} disabled={loading}>
      {loading && <LoaderCircleIcon className="animate-spin" />}
      {isActive ? "إيقاف" : "تفعيل"}
    </Button>
  );
}
