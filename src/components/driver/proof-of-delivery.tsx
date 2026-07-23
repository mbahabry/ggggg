"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUpload } from "@/components/shared/image-upload";
import { uploadProofOfDeliveryAction } from "@/lib/actions/trips";

export function ProofOfDelivery({ tripId, currentUrl }: { tripId: string; currentUrl: string }) {
  const router = useRouter();

  async function handleChange(url: string) {
    const result = await uploadProofOfDeliveryAction(tripId, url);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(url ? "تم رفع إثبات التسليم" : "تم حذف إثبات التسليم");
    router.refresh();
  }

  return <ImageUpload value={currentUrl} onChange={handleChange} label="رفع صورة إثبات التسليم" />;
}
