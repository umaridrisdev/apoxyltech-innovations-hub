"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import type { Paginated, RolePublic, UserPrivate } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserPrivate[] | null>(null);
  const [roles, setRoles] = useState<RolePublic[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string[]>>({});
  const [successUserId, setSuccessUserId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.get<Paginated<UserPrivate>>("/users"),
      api.get<RolePublic[]>("/users/roles"),
    ])
      .then(([usersRes, rolesRes]) => {
        if (ignore) return;
        setUsers(usersRes.data);
        setRoles(rolesRes);
        setRoleDrafts(
          Object.fromEntries(usersRes.data.map((user) => [user.id, user.roles]))
        );
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load users.");
      });
    return () => {
      ignore = true;
    };
  }, []);

  const roleNames = useMemo(() => roles?.map((role) => role.name) ?? [], [roles]);

  const toggleRole = (userId: string, roleName: string) => {
    setSuccessUserId(null);
    setRoleDrafts((current) => {
      const selected = current[userId] ?? [];
      const next = selected.includes(roleName)
        ? selected.filter((name) => name !== roleName)
        : [...selected, roleName];
      return { ...current, [userId]: next };
    });
  };

  const saveRoles = async (user: UserPrivate) => {
    setSavingUserId(user.id);
    setError(null);
    setSuccessUserId(null);
    try {
      const updated = await api.patch<UserPrivate>(`/users/${user.id}/roles`, {
        roles: roleDrafts[user.id] ?? user.roles,
      });
      setUsers((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? null);
      setRoleDrafts((current) => ({ ...current, [updated.id]: updated.roles }));
      setSuccessUserId(updated.id);
    } catch (err) {
      const message =
        err instanceof ApiClientError && err.body?.error?.message
          ? err.body.error.message
          : err instanceof Error
            ? err.message
            : "Failed to update roles.";
      setError(message);
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage user accounts and assign roles directly from the admin console.
        </p>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users?.map((user) => {
              const draftRoles = roleDrafts[user.id] ?? user.roles;
              const unchanged =
                draftRoles.length === user.roles.length &&
                draftRoles.every((role) => user.roles.includes(role));

              return (
                <tr key={user.id} className="align-top">
                  <td className="px-4 py-4 font-medium text-slate-900">{user.email}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {roleNames.map((roleName) => {
                        const active = draftRoles.includes(roleName);
                        return (
                          <button
                            key={roleName}
                            type="button"
                            onClick={() => toggleRole(user.id, roleName)}
                            className={[
                              "rounded-full border px-3 py-1 text-xs font-medium transition",
                              active
                                ? "border-amber-500 bg-amber-50 text-amber-900"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                            ].join(" ")}
                          >
                            {roleName}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500">{user.status}</td>
                  <td className="px-4 py-4 text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => void saveRoles(user)}
                        disabled={savingUserId === user.id || unchanged}
                        className="rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingUserId === user.id ? "Saving..." : "Save roles"}
                      </button>
                      {successUserId === user.id && (
                        <span className="text-xs text-emerald-700">Saved</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users?.length === 0 && <p className="mt-6 text-slate-500">No users yet.</p>}
      {users === null && !error && <p className="mt-6 text-slate-500">Loading users...</p>}
      {roles === null && !error && users !== null && (
        <p className="mt-2 text-slate-500">Loading roles...</p>
      )}
    </main>
  );
}
