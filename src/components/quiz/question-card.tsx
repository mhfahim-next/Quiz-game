import { Card } from "@/components/ui/card";
import { toBanglaNumber } from "@/lib/bangla";
import { SpeakButton } from "./speak-button";

type Props = {
  number: number;
  total: number;
  text: string;
  imageUrl?: string | null;
};

/** The question text, optional picture and the speaker button. */
export function QuestionCard({ number, total, text, imageUrl }: Props) {
  return (
    <Card className="gap-3 rounded-3xl border-2 border-violet-200 bg-white p-4 shadow-md sm:p-6">
      <div className="flex items-center justify-between text-sm font-bold text-violet-600">
        <span>
          প্রশ্ন {toBanglaNumber(number)} / {toBanglaNumber(total)}
        </span>
      </div>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          loading="eager"
          className="mx-auto max-h-48 w-auto max-w-full rounded-2xl object-contain sm:max-h-64"
        />
      )}
      <div className="flex items-start gap-3">
        <h1 className="flex-1 text-2xl font-extrabold leading-snug text-slate-800 sm:text-3xl">{text}</h1>
        <SpeakButton text={text} />
      </div>
    </Card>
  );
}
