"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveCategory } from "@/lib/admin/actions";
import type { Tables } from "@/lib/supabase/database.types";
import { Field } from "./field";
import { SubmitButton } from "./submit-button";
import { useAdminForm } from "./use-admin-form";

export function CategoryDialog({ category }: { category?: Tables<"categories"> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {category ? (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)} aria-label="সম্পাদনা">
          <Pencil /> সম্পাদনা
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus /> নতুন বিভাগ
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{category ? "বিভাগ সম্পাদনা" : "নতুন বিভাগ"}</DialogTitle>
            <DialogDescription>আইকন হিসেবে ইমোজি বা ছবি — যেকোনো একটি দিলেই চলবে।</DialogDescription>
          </DialogHeader>
          {open && <CategoryForm category={category} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoryForm({ category, onDone }: { category?: Tables<"categories">; onDone: () => void }) {
  const { state, onSubmit, pending, errors } = useAdminForm(saveCategory);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "সেভ হয়েছে");
      onDone();
    } else toast.error(state.error);
  }, [state, onDone]);

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      <Field label="নাম" htmlFor="c-name" error={errors.name}>
        <Input id="c-name" name="name" required maxLength={60} defaultValue={category?.name} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="slug (ইংরেজিতে)" htmlFor="c-slug" error={errors.slug} hint="যেমন: animals">
          <Input id="c-slug" name="slug" required maxLength={40} defaultValue={category?.slug} />
        </Field>
        <Field label="ক্রম" htmlFor="c-pos" error={errors.position}>
          <Input id="c-pos" name="position" type="number" min={0} max={999} defaultValue={category?.position ?? 0} />
        </Field>
      </div>
      <Field label="বর্ণনা (ঐচ্ছিক)" htmlFor="c-desc" error={errors.description}>
        <Input id="c-desc" name="description" maxLength={120} defaultValue={category?.description ?? ""} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="আইকন (ইমোজি)" htmlFor="c-icon" error={errors.icon}>
          <Input id="c-icon" name="icon" maxLength={8} defaultValue={category?.icon ?? ""} placeholder="🐘" />
        </Field>
        <Field label="রঙ" htmlFor="c-color" error={errors.color}>
          <Input id="c-color" name="color" type="color" defaultValue={category?.color ?? "#f97316"} className="h-10 p-1" />
        </Field>
      </div>
      <Field label="ছবি (ঐচ্ছিক, সর্বোচ্চ ২ MB)" htmlFor="c-image">
        {category?.image_url && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={category.image_url} alt="" className="size-14 rounded-lg object-cover" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="remove_image" value="true" /> ছবি সরাও
            </label>
          </div>
        )}
        <Input id="c-image" name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
      </Field>
      <label className="flex items-center gap-2 font-semibold">
        <Switch name="is_published" value="true" uncheckedValue="false" defaultChecked={category?.is_published ?? true} />
        প্রকাশিত
      </label>
      <SubmitButton pending={pending}>সেভ করো</SubmitButton>
    </form>
  );
}
