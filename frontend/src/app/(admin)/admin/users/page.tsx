"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Paginated, UserPrivate } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserPrivate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    api
      .get<Paginated<UserPrivate>>("/users")
      .then((res) => {
        if (!ignore) setUsers(res.data);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load users.");
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Users</h1>
      <p className="mt-1 text-sm text-slate-500">
        All registered accounts. Role changes aren't available from this UI yet —
        use the SQL snippet in the README to promote a user to admin.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500">
          <tr>
            <th className="py-2">Email</th>
            <th className="py-2">Roles</th>
            <th className="py-2">Status</th>
            <th className="py-2">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users?.map((u) => (
            <tr key={u.id}>
              <td className="py-2 font-medium">{u.email}</td>
              <td className="py-2 text-slate-600">{u.roles.join(", ") || "—"}</td>
              <td className="py-2 text-slate-500">{u.status}</td>
              <td className="py-2 text-slate-500">
                {new Date(u.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users?.length === 0 && <p className="mt-6 text-slate-500">No users yet.</p>}
      {users === null && !error && <p className="mt-6 text-slate-500">Loading...</p>}
    </main>
  );
}