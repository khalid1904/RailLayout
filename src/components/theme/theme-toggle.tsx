"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";

export function ThemeToggle() {
  const { mode, cycleMode } = useTheme();

  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
  const label =
    mode === "dark"
      ? "Dark theme"
      : mode === "light"
        ? "Light theme"
        : "System theme";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="pressable h-10 w-10 shrink-0"
      onClick={cycleMode}
      aria-label={`Theme: ${label}. Click to cycle.`}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
