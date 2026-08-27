"use client";

import { useCallback, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTripStore } from "@/store/trip-store";
import {
  extractPnrsFromText,
  isValidPnr,
  normalizePnr,
} from "@/lib/validation/pnr-input";
import { maskPnr } from "@/lib/privacy/mask-pnr";
import type { PNRRecord } from "@/types/pnr";
import { diffPNRRecords } from "@/lib/trip/refresh";

async function fetchSinglePNR(
  pnr: string,
  skipCache = false
): Promise<{ success: true; data: PNRRecord } | { success: false; error: string }> {
  const res = await fetch("/api/pnr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pnr, skipCache }),
  });
  const json = await res.json();
  if (!json.success) {
    return { success: false, error: json.error?.message ?? "Unable to retrieve PNR" };
  }
  return { success: true, data: json.data };
}

export function PnrInputPanel() {
  const {
    pendingPnrs,
    fetchQueue,
    trip,
    addPendingPnr,
    addPendingPnrs,
    removePendingPnr,
    setFetchQueue,
    updateFetchQueueItem,
    setTripFromPnrs,
    addPnrsToTrip,
  } = useTripStore();

  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  const handleAdd = useCallback(() => {
    setInputError("");
    const extracted = extractPnrsFromText(input);
    if (extracted.length > 0) {
      addPendingPnrs(extracted);
      setInput("");
      return;
    }
    const pnr = normalizePnr(input);
    if (!isValidPnr(pnr)) {
      setInputError("Enter a valid 10-digit PNR");
      return;
    }
    addPendingPnr(pnr);
    setInput("");
  }, [input, addPendingPnr, addPendingPnrs]);

  const handleFetch = useCallback(async () => {
    if (pendingPnrs.length === 0 || isFetching) return;
    setIsFetching(true);
    const queue = pendingPnrs.map((pnr) => ({
      pnr,
      status: "pending" as const,
    }));
    setFetchQueue(queue);

    const successful: PNRRecord[] = [];

    for (const item of queue) {
      updateFetchQueueItem(item.pnr, { status: "fetching" });
      const result = await fetchSinglePNR(item.pnr);
      if (result.success) {
        updateFetchQueueItem(item.pnr, { status: "success" });
        successful.push(result.data);
      } else {
        updateFetchQueueItem(item.pnr, {
          status: "error",
          error: result.error,
        });
      }
    }

    if (successful.length > 0) {
      if (trip) {
        addPnrsToTrip(successful);
      } else {
        setTripFromPnrs(successful);
      }
    }

    setIsFetching(false);
  }, [
    pendingPnrs,
    isFetching,
    setFetchQueue,
    updateFetchQueueItem,
    trip,
    addPnrsToTrip,
    setTripFromPnrs,
  ]);

  const showQueue = fetchQueue.length > 0 && isFetching;

  return (
    <section className="material rounded-2xl p-4 md:p-5">
      <h2 className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Add PNRs
      </h2>
      <div className="mt-3 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter PNR or paste multiple"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            inputMode="numeric"
          />
          <Button
            type="button"
            variant="secondary"
            className="pressable"
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        {inputError && (
          <p className="text-sm text-red-600">{inputError}</p>
        )}

        {pendingPnrs.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">Added PNRs</p>
            <ul className="space-y-1">
              {pendingPnrs.map((pnr) => (
                <li
                  key={pnr}
                  className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-sm"
                >
                  <span className="font-mono">{maskPnr(pnr)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePendingPnr(pnr)}
                    disabled={isFetching}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showQueue && (
          <div className="space-y-2 rounded-xl bg-white/70 p-3">
            <p className="text-sm font-medium">Fetching live journey details</p>
            {fetchQueue.map((item) => (
              <div key={item.pnr} className="flex items-center gap-2 text-sm">
                {item.status === "fetching" && (
                  <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
                )}
                {item.status === "success" && (
                  <Badge variant="success">✓</Badge>
                )}
                {item.status === "error" && (
                  <Badge variant="warning">✗</Badge>
                )}
                {item.status === "pending" && (
                  <span className="text-slate-400">⟳</span>
                )}
                <span className="font-mono">{maskPnr(item.pnr)}</span>
                {item.error && (
                  <span className="text-red-600">{item.error}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {!showQueue &&
          fetchQueue.some((q) => q.status === "error") &&
          !isFetching && (
            <div className="space-y-2">
              {fetchQueue
                .filter((q) => q.status === "error")
                .map((item) => (
                  <div
                    key={item.pnr}
                    className="material rounded-xl border border-red-200/50 bg-red-50/60 p-3 text-sm"
                  >
                    <p className="font-mono font-medium">
                      PNR {maskPnr(item.pnr)}
                    </p>
                    <p className="text-red-700">{item.error}</p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="pressable"
                        onClick={async () => {
                          updateFetchQueueItem(item.pnr, {
                            status: "fetching",
                          });
                          const result = await fetchSinglePNR(item.pnr);
                          if (result.success) {
                            if (trip) addPnrsToTrip([result.data]);
                            else setTripFromPnrs([result.data]);
                            removePendingPnr(item.pnr);
                          } else {
                            updateFetchQueueItem(item.pnr, {
                              status: "error",
                              error: result.error,
                            });
                          }
                        }}
                      >
                        Retry
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePendingPnr(item.pnr)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}

        <Button
          className="pressable w-full"
          onClick={handleFetch}
          disabled={pendingPnrs.length === 0 || isFetching}
        >
          {isFetching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching...
            </>
          ) : (
            "Fetch Live Details"
          )}
        </Button>
      </div>
    </section>
  );
}

export async function refreshTripPnrs(
  pnrs: string[]
): Promise<{ records: PNRRecord[]; diff: ReturnType<typeof diffPNRRecords> }> {
  const records: PNRRecord[] = [];
  for (const pnr of pnrs) {
    const result = await fetchSinglePNR(pnr, true);
    if (result.success) records.push(result.data);
  }
  return { records, diff: { changes: [], hasChanges: false } };
}
