import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = { sm: "size-4", md: "size-6", lg: "size-10", xl: "size-14" } as const;

type Props = {
  value: number;
  max?: number;
  size?: keyof typeof SIZES;
  /** pop the earned stars in one after another (result screen) */
  animate?: boolean;
  className?: string;
};

/** Shows `value` of `max` stars (default 3/3-style rating). */
export function StarRating({ value, max = 3, size = "md", animate = false, className }: Props) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${max} টির মধ্যে ${value}টি তারা`}
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        return (
          <Star
            key={i}
            aria-hidden
            style={animate && filled ? { animationDelay: `${i * 350}ms` } : undefined}
            className={cn(
              SIZES[size],
              filled ? "fill-yellow-400 text-yellow-500 drop-shadow" : "fill-slate-200 text-slate-300",
              animate && filled && "animate-star-in",
              animate && !filled && "opacity-70",
            )}
          />
        );
      })}
    </span>
  );
}
