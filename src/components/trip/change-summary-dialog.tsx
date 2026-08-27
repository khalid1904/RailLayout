"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { RefreshDiff } from "@/lib/trip/refresh";

interface ChangeSummaryDialogProps {
  diff: RefreshDiff | null;
  open: boolean;
  onApply: () => void;
  onDismiss: () => void;
}

export function ChangeSummaryDialog({
  diff,
  open,
  onApply,
  onDismiss,
}: ChangeSummaryDialogProps) {
  if (!diff?.hasChanges) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onDismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changes detected</DialogTitle>
        </DialogHeader>
        <div className="max-h-[50vh] space-y-3 overflow-y-auto">
          {diff.changes.map((change, i) => (
            <div
              key={`${change.passengerId}-${change.field}-${i}`}
              className="rounded-lg bg-stone-50 p-3 text-sm"
            >
              <p className="font-medium capitalize">
                {change.field === "berth"
                  ? "Seat changed"
                  : change.field === "coach"
                    ? "Coach changed"
                    : `${change.field} changed`}
              </p>
              <p className="text-stone-600">{change.passengerName}</p>
              <p className="mt-1 font-mono text-stone-500">
                {change.before} → {change.after}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={onApply} className="flex-1">
            Apply changes
          </Button>
          <Button variant="outline" onClick={onDismiss} className="flex-1">
            Dismiss
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
