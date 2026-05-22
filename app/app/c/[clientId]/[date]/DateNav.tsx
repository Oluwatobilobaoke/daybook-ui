"use client";

import { useRouter } from "next/navigation";

function shift(date: string, delta: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Props = {
  clientId: string;
  date: string;
};

export function DateNav({ clientId, date }: Props) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous day"
        onClick={() => router.push(`/app/c/${clientId}/${shift(date, -1)}`)}
        className="daybook-btn daybook-btn-ghost px-3 py-1"
      >
        ←
      </button>
      <input
        type="date"
        value={date}
        aria-label="Jump to date"
        onChange={(e) => {
          if (e.target.value) {
            router.push(`/app/c/${clientId}/${e.target.value}`);
          }
        }}
        className="daybook-input py-1 px-2 text-sm w-auto"
      />
      <button
        type="button"
        aria-label="Next day"
        onClick={() => router.push(`/app/c/${clientId}/${shift(date, 1)}`)}
        className="daybook-btn daybook-btn-ghost px-3 py-1"
      >
        →
      </button>
    </div>
  );
}
