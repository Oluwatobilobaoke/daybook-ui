"use client";

import { useState, useTransition } from "react";
import { Pill } from "@/components/ui/Pill";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  createPlanAction,
  deletePlanAction,
  movePlanAction,
  updatePlanAction,
} from "@/app/actions";
import type { Plan } from "@/lib/types";

type Props = {
  entryId: string;
  initialPlans: Plan[];
};

function formatDateLabel(iso?: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function PlanList({ entryId, initialPlans }: Props) {
  const [plans, setPlans] = useState<Plan[]>(
    [...initialPlans].sort((a, b) => a.position - b.position),
  );
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  function refresh(updated: Plan) {
    setPlans((prev) =>
      prev
        .map((p) => (p.id === updated.id ? updated : p))
        .sort((a, b) => a.position - b.position),
    );
  }

  function add() {
    const text = draft.trim();
    if (!text) return;
    startTransition(async () => {
      const res = await createPlanAction({ entryId, text });
      if (res.ok) {
        setPlans((prev) => [...prev, res.plan]);
        setDraft("");
        setError(null);
      } else {
        setError(res.message);
      }
    });
  }

  function toggleDone(plan: Plan) {
    startTransition(async () => {
      const res = await updatePlanAction({
        planId: plan.id,
        done: !plan.done,
      });
      if (res.ok) refresh(res.plan);
      else setError(res.message);
    });
  }

  function commitEdit(plan: Plan) {
    const text = editingText.trim();
    if (!text || text === plan.text) {
      setEditing(null);
      return;
    }
    startTransition(async () => {
      const res = await updatePlanAction({ planId: plan.id, text });
      if (res.ok) {
        refresh(res.plan);
        setEditing(null);
      } else {
        setError(res.message);
      }
    });
  }

  function move(plan: Plan, direction: "up" | "down") {
    startTransition(async () => {
      const res = await movePlanAction({ planId: plan.id, direction });
      if (res.ok) {
        setPlans((prev) => {
          const sorted = [...prev].sort((a, b) => a.position - b.position);
          const idx = sorted.findIndex((p) => p.id === plan.id);
          const swapIdx = direction === "up" ? idx - 1 : idx + 1;
          if (swapIdx < 0 || swapIdx >= sorted.length) return sorted;
          const a = sorted[idx];
          const b = sorted[swapIdx];
          if (!a || !b) return sorted;
          const aPos = a.position;
          const bPos = b.position;
          sorted[idx] = { ...a, position: bPos };
          sorted[swapIdx] = { ...b, position: aPos };
          return sorted.sort((x, y) => x.position - y.position);
        });
      } else {
        setError(res.message);
      }
    });
  }

  function remove(plan: Plan) {
    startTransition(async () => {
      const res = await deletePlanAction({ planId: plan.id });
      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <section aria-label="Plans" className="flex flex-col gap-3">
      <div className="daybook-meta">Plans</div>
      <ul className="flex flex-col gap-1">
        {plans.length === 0 ? (
          <li className="text-sm text-[color:var(--color-muted)]">
            No plans yet.
          </li>
        ) : null}
        {plans.map((plan, i) => {
          const isEditing = editing === plan.id;
          return (
            <li
              key={plan.id}
              className="flex items-center gap-2 group py-1 border-b border-[color:var(--color-divider)] last:border-b-0"
            >
              <input
                type="checkbox"
                checked={plan.done}
                onChange={() => toggleDone(plan)}
                aria-label={plan.done ? "Mark incomplete" : "Mark complete"}
                className="w-4 h-4 accent-[color:var(--color-fg)]"
              />
              {isEditing ? (
                <input
                  autoFocus
                  className="daybook-input py-1 text-sm flex-1"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={() => commitEdit(plan)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitEdit(plan);
                    } else if (e.key === "Escape") {
                      setEditing(null);
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className={`flex-1 text-left text-sm ${
                    plan.done ? "daybook-plan-done" : ""
                  }`}
                  onClick={() => {
                    setEditing(plan.id);
                    setEditingText(plan.text);
                  }}
                >
                  {plan.text}
                </button>
              )}
              {plan.carried_from_entry_id ? (
                <Pill tone="gray" title="Carried from prior entry">
                  carried {formatDateLabel(plan.carried_from_entry_id)}
                </Pill>
              ) : null}
              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={i === 0 || pending}
                  onClick={() => move(plan, "up")}
                  className="w-7 h-7 inline-flex items-center justify-center rounded-sm hover:bg-[color:var(--color-accent-gray)] disabled:opacity-30"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2 8 L6 4 L10 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={i === plans.length - 1 || pending}
                  onClick={() => move(plan, "down")}
                  className="w-7 h-7 inline-flex items-center justify-center rounded-sm hover:bg-[color:var(--color-accent-gray)] disabled:opacity-30"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2 4 L6 8 L10 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Delete plan"
                  onClick={() => remove(plan)}
                  disabled={pending}
                  className="w-7 h-7 inline-flex items-center justify-center rounded-sm hover:bg-[color:var(--color-accent-gray)] disabled:opacity-30"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M3 3 L9 9 M9 3 L3 9" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2">
        <Input
          name="new-plan"
          value={draft}
          placeholder="Add a plan…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" onClick={add} disabled={pending || !draft.trim()}>
          Add
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-[color:var(--color-accent-orange)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
