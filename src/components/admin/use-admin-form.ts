"use client";

import { useActionState, useCallback, useTransition } from "react";
import type { ActionResult } from "@/lib/admin/schemas";

type FormAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

/**
 * Wraps a Server Action for an admin form.
 *
 * We deliberately do NOT use <form action={...}>: React 19 resets uncontrolled inputs after such an
 * action finishes, which would wipe everything the admin typed whenever validation fails.
 * Submitting through onSubmit + startTransition keeps the inputs as they are.
 */
export function useAdminForm(action: FormAction) {
  const [state, run] = useActionState(action, null);
  const [pending, startTransition] = useTransition();

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      startTransition(() => run(data));
    },
    [run],
  );

  const errors: Record<string, string> = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  return { state, onSubmit, pending, errors };
}
