import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "outline" | "success" | "warning";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        {
          default: "bg-accent-soft text-accent-ink",
          secondary: "bg-slate-100/90 text-slate-700",
          outline: "border border-slate-300/80 text-slate-700 bg-white/50",
          success: "bg-emerald-100 text-emerald-800",
          warning: "bg-amber-100/90 text-amber-900",
        }[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
