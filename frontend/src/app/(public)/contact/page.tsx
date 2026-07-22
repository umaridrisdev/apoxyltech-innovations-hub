"use client";

import { useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import type { LeadCreateResponse } from "@/lib/types";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = new FormData(e.currentTarget);
    try {
      await api.post<LeadCreateResponse>("/leads", {
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone") || null,
        message: form.get("message"),
      });
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiClientError ? err.message : "Something went wrong.");
    }
  }

  if (status === "sent") {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Thanks — we got it.</h1>
        <p className="mt-2 text-slate-600">Someone from our team will follow up shortly.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-2xl font-semibold">Get in touch</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          name="name"
          required
          placeholder="Name"
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <input
          name="phone"
          placeholder="Phone (optional)"
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <textarea
          name="message"
          required
          maxLength={5000}
          rows={5}
          placeholder="How can we help?"
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {status === "submitting" ? "Sending..." : "Send"}
        </button>
      </form>
    </main>
  );
}
