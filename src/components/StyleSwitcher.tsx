import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STYLE_VARIANTS = {
  classic: "font-serif border-neutral-300 text-neutral-800 bg-stone-50 tracking-wide",
  flowing: "font-sans italic border-sky-200 text-sky-900 bg-sky-50/50 tracking-normal",
  formal: "font-mono uppercase border-black text-black bg-white tracking-tight font-bold",
  modern: "font-sans tracking-widest border-zinc-800 text-white bg-zinc-900 rounded-none",
} as const;

type StyleVariant = keyof typeof STYLE_VARIANTS;

const STYLE_OPTIONS: Array<{
  value: StyleVariant;
  label: string;
}> = [
  { value: "classic", label: "Classic" },
  { value: "flowing", label: "Flowing" },
  { value: "formal", label: "Formal" },
  { value: "modern", label: "Modern" },
];

export function StyleSwitcher() {
  const [activeStyle, setActiveStyle] = useState<StyleVariant>("classic");

  return (
    <div className="space-y-6 p-6">
      <div className={cn("p-4 border-2 transition-all duration-300", STYLE_VARIANTS[activeStyle])}>
        Preview Text
      </div>

      <div className="flex flex-wrap gap-2">
        {STYLE_OPTIONS.map((style) => (
          <Button
            key={style.value}
            type="button"
            size="xs"
            variant={activeStyle === style.value ? "default" : "outline"}
            onClick={() => setActiveStyle(style.value)}
          >
            {style.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
