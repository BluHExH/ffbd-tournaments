"use client";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}

export default function SectionHeading({
  title,
  subtitle,
  align = "center",
  light = false,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-10 md:mb-12",
        align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      <h2
        className={cn(
          "font-heading text-3xl sm:text-4xl md:text-[2.75rem] font-bold tracking-tight",
          light ? "text-white" : "text-[#0F172A]"
        )}
      >
        {title}
      </h2>
      <div
        className={cn(
          "mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-[#FF5C00] to-[#FF8A00]",
          align === "center" && "mx-auto"
        )}
      />
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-base md:text-lg max-w-2xl leading-relaxed",
            align === "center" && "mx-auto",
            light ? "text-white/70" : "text-slate-500"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
