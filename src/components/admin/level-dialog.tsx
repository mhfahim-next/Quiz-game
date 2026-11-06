"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveLevel } from "@/lib/admin/actions";
import type { Tables } from "@/lib/supabase/database.types";
import { Field } from "./field";
import { SubmitButton } from "./submit-button";
import { useAdminForm } from "./use-admin-form";

export function LevelDialog({ categoryId, level }: { categoryId: string; level?: Tables<"levels"> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {level ? (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} aria-label="লেভেল সম্পাদনা">
          <Pencil />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus /> নতুন লেভেল
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{level ? `লেভেল ${level.position} সম্পাদনা` : "নতুন লেভেল"}</DialogTitle>
            <DialogDescription>লেভেলের ক্রম বদলাতে তালিকার উপরে/নিচে বাটন ব্যবহার করো।</DialogDescription>
          </DialogHeader>
          {open && <LevelForm categoryId={categoryId} level={level} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function LevelForm({ categoryId, level, onDone }: { categoryId: string; level?: Tables<"levels">; onDone: () => void }) {
  const { state, onSubmit, pending, errors } = useAdminForm(saveLevel);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "সেভ হয়েছে");
      onDone();
    } else toast.error(state.error);
  }, [state, onDone]);

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {level && <input type="hidden" name="id" value={level.id} />}
      <input type="hidden" name="category_id" value={categoryId} />
      <Field label="পাস করার শতাংশ (%)" htmlFor="l-pass" error={errors.pass_percent} hint="এই শতাংশ পেলে পরের লেভেল খুলবে">
        <Input id="l-pass" name="pass_percent" type="number" min={1} max={100} required defaultValue={level?.pass_percent ?? 70} />
      </Field>
      <Field label="প্রশ্নের সংখ্যা" htmlFor="l-count" error={errors.question_count} hint="প্রশ্নভান্ডার থেকে এতগুলো র‍্যান্ডমভাবে আসবে">
        <Input id="l-count" name="question_count" type="number" min={1} max={50} required defaultValue={level?.question_count ?? 10} />
      </Field>
      <label className="flex items-center gap-2 font-semibold">
        <Switch name="is_published" value="true" uncheckedValue="false" defaultChecked={level?.is_published ?? false} />
        প্রকাশিত (বন্ধ থাকলে ড্রাফট)
      </label>
      <SubmitButton pending={pending}>সেভ করো</SubmitButton>
    </form>
  );
}
