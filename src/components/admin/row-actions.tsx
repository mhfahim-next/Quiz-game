"use client";

import { useTransition } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { ActionResult } from "@/lib/admin/schemas";

function report(res: ActionResult, okMessage?: string) {
  if (res.ok) {
    if (okMessage) toast.success(okMessage);
  } else toast.error(res.error);
}

export function DeleteButton({
  action,
  confirmText,
  label = "মুছে ফেলো",
}: {
  action: () => Promise<ActionResult>;
  confirmText: string;
  label?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      disabled={pending}
      aria-label={label}
      title={label}
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        start(async () => report(await action(), "মুছে ফেলা হয়েছে"));
      }}
    >
      <Trash2 />
    </Button>
  );
}

export function PublishSwitch({
  checked,
  action,
  label,
}: {
  checked: boolean;
  action: (published: boolean) => Promise<ActionResult>;
  label: string;
}) {
  const [pending, start] = useTransition();
  return (
    <label className="inline-flex items-center gap-2 text-sm font-semibold">
      <Switch
        checked={checked}
        disabled={pending}
        aria-label={label}
        onCheckedChange={(v) => start(async () => report(await action(v)))}
      />
      <span className={checked ? "text-green-700" : "text-slate-500"}>{checked ? "প্রকাশিত" : "ড্রাফট"}</span>
    </label>
  );
}

export function MoveButtons({
  onMove,
  canUp,
  canDown,
}: {
  onMove: (direction: "up" | "down") => Promise<ActionResult>;
  canUp: boolean;
  canDown: boolean;
}) {
  const [pending, start] = useTransition();
  const go = (d: "up" | "down") => start(async () => report(await onMove(d)));
  return (
    <span className="inline-flex gap-1">
      <Button type="button" size="icon-sm" variant="outline" disabled={pending || !canUp} aria-label="উপরে সরাও" onClick={() => go("up")}>
        <ArrowUp />
      </Button>
      <Button type="button" size="icon-sm" variant="outline" disabled={pending || !canDown} aria-label="নিচে সরাও" onClick={() => go("down")}>
        <ArrowDown />
      </Button>
    </span>
  );
}
