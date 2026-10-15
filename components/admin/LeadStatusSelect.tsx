"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadStatus } from "@/lib/contact/leads";

const STATUSES: LeadStatus[] = ["new", "replied", "archived"];

export default function LeadStatusSelect({ id, status, label }: { id: string; status: LeadStatus; label: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");

  const change = async (next: LeadStatus) => {
    const previous = value;
    setValue(next);
    setState("saving");
    try {
      const response = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next })
      });
      if (!response.ok) throw new Error(String(response.status));
      setState("idle");
      router.refresh();
    } catch {
      setValue(previous);
      setState("error");
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <select
        aria-label={`Status of the message from ${label}`}
        value={value}
        disabled={state === "saving"}
        onChange={(event) => void change(event.target.value as LeadStatus)}
        className="rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-txt focus:border-teal"
      >
        {STATUSES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span role="status" className="font-mono text-[11px] text-txtdim">
        {state === "saving" ? "saving…" : state === "error" ? <span className="text-danger">failed</span> : ""}
      </span>
    </span>
  );
}
