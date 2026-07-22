"use client";

import { useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import type { UserPublic } from "@/lib/types";

export default function RegisterPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = new FormData(e.currentTarget);
    try {
      await api.post<UserPublic>("/auth/register", {
        email: form.get("email"),
        password: form.get("password"),
        company_name: form.get("company_name") || null,
      });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiClientError ? err.message : "Registration failed.");
    }
  }

  if (status === "done") {
    return (
      <main className="mx-auto max-w-sm px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="mt-2 text-slate-600">
          We sent a verification link — confirm it before logging in.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <input
          name="company_name"
          placeholder="Company name (optional)"
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <input
          name="password"
          type="password"
          required
          minLength={12}
          placeholder="Password (min. 12 characters)"
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {status === "submitting" ? "Creating account..." : "Create account"}
        </button>
      </form>
    </main>
  );
}