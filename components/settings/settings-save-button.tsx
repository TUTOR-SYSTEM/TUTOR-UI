"use client";

import { Button } from "@/components/ui/button.ui";
import { useState } from "react";
import { Check } from "lucide-react";

export function SaveButton({ label = "Lưu thay đổi" }: { label?: string }) {
  const [saved, setSaved] = useState(false);
  const handle = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div className="flex justify-end pt-2">
      <Button variant="ghost"
        type="button"
        onClick={handle}
        className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all ${
          saved ? "bg-primary-hover" : "bg-primary hover:bg-primary-hover"
        }`}
      >
        {saved && <Check className="size-4" />}
        {saved ? "Đã lưu!" : label}
      </Button>
    </div>
  );
}
