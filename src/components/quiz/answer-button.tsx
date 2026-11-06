import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AnswerState = "idle" | "correct" | "wrong" | "dimmed";

const LETTERS = ["ক", "খ", "গ", "ঘ"];
const IDLE_COLORS = [
  "bg-sky-100 border-sky-300 text-sky-900 active:bg-sky-200",
  "bg-pink-100 border-pink-300 text-pink-900 active:bg-pink-200",
  "bg-amber-100 border-amber-300 text-amber-900 active:bg-amber-200",
  "bg-emerald-100 border-emerald-300 text-emerald-900 active:bg-emerald-200",
];

type Props = {
  index: number;
  label: string;
  state: AnswerState;
  disabled?: boolean;
  onSelect: (index: number) => void;
};

/** One of the four big answer buttons. */
export function AnswerButton({ index, label, state, disabled, onSelect }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(index)}
      aria-label={`${LETTERS[index]}: ${label}${state === "correct" ? " — সঠিক" : state === "wrong" ? " — ভুল" : ""}`}
      className={cn(
        "relative flex min-h-[4.5rem] w-full items-center gap-3 rounded-3xl border-b-4 border-2 px-4 py-3 text-left text-xl font-bold shadow-sm transition-all sm:text-2xl",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-400",
        state === "idle" && IDLE_COLORS[index % 4],
        state === "idle" && !disabled && "hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2",
        state === "correct" && "animate-pop border-green-600 bg-green-400 text-white",
        state === "wrong" && "animate-shake border-red-600 bg-red-400 text-white",
        state === "dimmed" && "border-slate-200 bg-slate-100 text-slate-400",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full bg-white/80 text-lg font-extrabold",
          state === "correct" && "text-green-700",
          state === "wrong" && "text-red-700",
        )}
      >
        {state === "correct" ? <Check className="size-6" /> : state === "wrong" ? <X className="size-6" /> : LETTERS[index]}
      </span>
      <span className="flex-1 leading-tight">{label}</span>
    </button>
  );
}
