"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImageUpIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImageUpload({
  value,
  onChange,
  label = "رفع صورة",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "فشل رفع الصورة");
        return;
      }
      onChange(data.url);
    } catch {
      toast.error("حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-32 h-32">
          <Image src={value} alt={label} fill className="rounded-lg border object-cover" />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -left-2 size-6 rounded-full"
            onClick={() => onChange("")}
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <LoaderCircleIcon className="animate-spin" /> : <ImageUpIcon />}
          {label}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
