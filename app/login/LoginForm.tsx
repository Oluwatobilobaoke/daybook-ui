"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requestMagicLinkAction } from "@/app/actions";
import { ensureCsrf } from "@/lib/csrf";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") ||
  "http://localhost:8376";

export function LoginForm() {
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Prime the CSRF cookie on mount so subsequent POSTs include the token.
  useEffect(() => {
    void ensureCsrf(API_BASE);
  }, []);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await requestMagicLinkAction(formData);
      if (res.ok) {
        setSent(res.email);
      } else {
        setError(res.message);
      }
    });
  }

  if (sent) {
    return (
      <div
        role="status"
        className="border border-[color:var(--color-fg)] rounded-sm p-5"
      >
        <p className="font-semibold">We sent a link to {sent}.</p>
        <p className="mt-2 text-sm text-[color:var(--color-muted)]">
          Click the link in your inbox to sign in. The link expires in 15
          minutes and is single-use.
        </p>
        <button
          type="button"
          className="mt-4 underline underline-offset-2 text-sm"
          onClick={() => {
            setSent(null);
          }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4" noValidate>
      <label htmlFor="email" className="daybook-meta">
        Email
      </label>
      <Input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
      />
      {error ? (
        <p
          role="alert"
          className="text-sm text-[color:var(--color-accent-orange)]"
        >
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="accent"
        disabled={pending}
        className="self-start"
      >
        {pending ? "Sending…" : "Send link"}
      </Button>
    </form>
  );
}
