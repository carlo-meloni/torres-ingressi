"use client";

import { useState, useTransition } from "react";

import { createUser, deleteUser, updateUser } from "@/actions/users";
import { formatDate } from "@/lib/format";
import { ROLE_META, ROLE_ORDER } from "@/lib/user-role";
import type { Role } from "@/generated/prisma/enums";
import type { UserInput, UserListItem } from "@/types/user";

type Toast = { id: number; kind: "success" | "error"; message: string };

/**
 * Gestione utenti (CRUD) riservata al sysadmin. Mantiene la lista come stato
 * locale — aggiornato dopo ogni Server Action andata a buon fine — per un
 * feedback immediato; le `revalidatePath` lato server riallineano le viste.
 *
 * `currentUserId` identifica l'account loggato: non è eliminabile e non può
 * perdere il ruolo di sysadmin (le azioni server applicano comunque la regola).
 */
export function UserManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserListItem[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function notify(kind: Toast["kind"], message: string) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-brand-primary">Utenti</h1>
          <p className="text-sm text-brand-muted">
            Gestisci gli account e i ruoli — {users.length}{" "}
            {users.length === 1 ? "utente" : "utenti"} (solo sysadmin).
          </p>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-b from-brand-accent to-brand-accent-hover px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200 ease-out-soft hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-accent/35 active:translate-y-0"
          >
            + Nuovo utente
          </button>
        )}
      </header>

      {creating && (
        <UserForm
          submitLabel="Crea utente"
          onCancel={() => setCreating(false)}
          onSubmit={async (values) => {
            const result = await createUser(values);
            if (result.success) {
              setUsers((prev) => [
                {
                  id: result.data.id,
                  name: values.name?.trim() || null,
                  email: values.email.trim().toLowerCase(),
                  role: values.role,
                  createdAt: result.data.createdAt,
                },
                ...prev,
              ]);
              setCreating(false);
              notify("success", "Utente creato.");
            } else {
              notify("error", result.error);
            }
            return result.success;
          }}
        />
      )}

      {users.length === 0 && !creating ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-brand-surface-muted bg-white px-6 py-20 text-center">
          <p className="text-sm font-medium text-brand-muted">
            Nessun utente. Creane uno per dare accesso al sistema.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {users.map((user) =>
            editingId === user.id ? (
              <li key={user.id}>
                <UserForm
                  submitLabel="Salva modifiche"
                  initial={user}
                  isSelf={user.id === currentUserId}
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (values) => {
                    const result = await updateUser(user.id, values);
                    if (result.success) {
                      setUsers((prev) =>
                        prev.map((u) =>
                          u.id === user.id
                            ? {
                                ...u,
                                name: values.name?.trim() || null,
                                email: values.email.trim().toLowerCase(),
                                role: values.role,
                              }
                            : u,
                        ),
                      );
                      setEditingId(null);
                      notify("success", "Utente aggiornato.");
                    } else {
                      notify("error", result.error);
                    }
                    return result.success;
                  }}
                />
              </li>
            ) : (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === currentUserId}
                onEdit={() => setEditingId(user.id)}
                onDelete={async () => {
                  const result = await deleteUser(user.id);
                  if (result.success) {
                    setUsers((prev) => prev.filter((u) => u.id !== user.id));
                    notify("success", "Utente eliminato.");
                  } else {
                    notify("error", result.error);
                  }
                }}
              />
            ),
          )}
        </ul>
      )}

      <ToastViewport toasts={toasts} />
    </div>
  );
}

/** Riga di un utente con badge del ruolo e azioni. */
function UserRow({
  user,
  isSelf,
  onEdit,
  onDelete,
}: {
  user: UserListItem;
  isSelf: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-surface-muted bg-white px-5 py-4 transition-shadow hover:shadow-sm">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-brand-primary">
            {user.name ?? user.email}
          </span>
          <RoleBadge role={user.role} />
          {isSelf && (
            <span className="rounded-full bg-brand-surface px-2 py-0.5 text-xs font-medium text-brand-muted">
              Tu
            </span>
          )}
        </div>
        {user.name && (
          <p className="truncate text-sm text-brand-muted">{user.email}</p>
        )}
        <p className="text-xs text-brand-muted">
          Creato il {formatDate(user.createdAt)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {confirmingDelete ? (
          <>
            <span className="text-sm text-brand-muted">Eliminare?</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(onDelete)}
              className="rounded-md bg-status-full px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
            >
              Sì, elimina
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmingDelete(false)}
              className="rounded-md border border-brand-surface-muted px-3 py-1.5 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-surface disabled:opacity-60"
            >
              Annulla
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={onEdit}
              className="rounded-md border border-brand-surface-muted px-3 py-1.5 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-surface disabled:opacity-60"
            >
              Modifica
            </button>
            {!isSelf && (
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmingDelete(true)}
                className="rounded-md border border-brand-surface-muted px-3 py-1.5 text-sm font-medium text-status-full transition-colors hover:bg-status-full/5 disabled:opacity-60"
              >
                Elimina
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}

/** Form condiviso per creazione e modifica di un utente. */
function UserForm({
  initial,
  submitLabel,
  isSelf = false,
  onSubmit,
  onCancel,
}: {
  initial?: UserListItem;
  submitLabel: string;
  /** L'account loggato non può cambiare il proprio ruolo (no lockout). */
  isSelf?: boolean;
  /** Ritorna `true` se l'azione è andata a buon fine (per chiudere il form). */
  onSubmit: (values: UserInput) => Promise<boolean>;
  onCancel: () => void;
}) {
  const isEditing = initial !== undefined;
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState<Role>(initial?.role ?? "BIGLIETTAIO");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setError("L'email è obbligatoria.");
      return;
    }
    if (!isEditing && password.length < 8) {
      setError("La password deve avere almeno 8 caratteri.");
      return;
    }
    if (isEditing && password !== "" && password.length < 8) {
      setError("La password deve avere almeno 8 caratteri.");
      return;
    }
    setError(null);
    startTransition(async () => {
      await onSubmit({ name, email, role, password });
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-2xl border border-brand-accent/20 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-primary">
            Nome{" "}
            <span className="font-normal text-brand-muted">— opzionale</span>
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            autoFocus
            placeholder="Mario Rossi"
            className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 ease-out-soft placeholder:text-brand-muted/50 hover:border-brand-primary/30 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-primary">
            Email <span className="text-brand-accent">*</span>
          </span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="mario@torres.it"
            className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 ease-out-soft placeholder:text-brand-muted/50 hover:border-brand-primary/30 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-primary">
            Ruolo <span className="text-brand-accent">*</span>
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={isSelf}
            className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 ease-out-soft hover:border-brand-primary/30 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ROLE_ORDER.map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r].label}
              </option>
            ))}
          </select>
          {isSelf ? (
            <span className="text-xs text-brand-muted">
              Non puoi cambiare il tuo stesso ruolo.
            </span>
          ) : (
            <span className="text-xs text-brand-muted">
              {ROLE_META[role].description}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-primary">
            Password{" "}
            {isEditing ? (
              <span className="font-normal text-brand-muted">
                — lascia vuota per non cambiarla
              </span>
            ) : (
              <span className="text-brand-accent">*</span>
            )}
          </span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            placeholder={isEditing ? "••••••••" : "Almeno 8 caratteri"}
            className="w-full rounded-xl border border-brand-surface-muted bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all duration-200 ease-out-soft placeholder:text-brand-muted/50 hover:border-brand-primary/30 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10"
          />
        </label>
      </div>

      {error && <p className="text-xs text-status-full">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-linear-to-b from-brand-accent to-brand-accent-hover px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-accent/25 transition-all duration-200 ease-out-soft hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
        >
          {pending ? "Salvataggio…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-full px-5 py-2.5 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-surface disabled:opacity-60"
        >
          Annulla
        </button>
      </div>
    </form>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const meta = ROLE_META[role];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}
    >
      {meta.label}
    </span>
  );
}

/** Toast effimeri per le azioni admin (in basso a destra). */
function ToastViewport({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={
            toast.kind === "success"
              ? "rounded-xl border border-status-open/20 bg-white px-4 py-3 text-sm font-medium text-brand-primary shadow-lg shadow-black/5"
              : "rounded-xl border border-status-full/20 bg-white px-4 py-3 text-sm font-medium text-status-full shadow-lg shadow-black/5"
          }
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
