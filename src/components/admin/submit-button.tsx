import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  pending,
  className,
}: {
  children: React.ReactNode;
  pending: boolean;
  className?: string;
}) {
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
