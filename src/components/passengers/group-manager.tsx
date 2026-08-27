"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PassengerGroup } from "@/types/trip";

interface GroupManagerProps {
  groups: PassengerGroup[];
  onAdd: (name: string) => void;
  onRename: (groupId: string, name: string) => void;
  onDelete: (groupId: string) => void;
}

export function GroupManager({
  groups,
  onAdd,
  onRename,
  onDelete,
}: GroupManagerProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  return (
    <section className="material rounded-2xl p-4 md:p-5">
      <h2 className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Groups
      </h2>
      <div className="mt-3 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="New group"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="pressable"
            onClick={() => {
              if (newName.trim()) {
                onAdd(newName.trim());
                setNewName("");
              }
            }}
          >
            Create
          </Button>
        </div>
        {groups.length === 0 ? (
          <p className="text-sm text-slate-400">No groups yet</p>
        ) : (
          <ul className="space-y-2">
            {groups.map((group) => (
              <li
                key={group.id}
                className="flex items-center gap-2 rounded-xl bg-white/70 p-2"
              >
                {editingId === group.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-9"
                    />
                    <Button
                      size="sm"
                      className="pressable"
                      onClick={() => {
                        onRename(group.id, editName);
                        setEditingId(null);
                      }}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">
                      {group.name}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(group.id);
                        setEditName(group.name);
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(group.id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
