"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [timezone, setTimezone] = useState("Europe/London");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, timezone })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? "Authentication failed.");
        return;
      }

      router.push("/");
      router.refresh();
    });
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {mode === "signup" ? (
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>
      {mode === "signup" ? (
        <div className="field">
          <label htmlFor="timezone">Timezone</label>
          <input id="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} />
        </div>
      ) : null}
      {error ? <p className="danger">{error}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
      </button>
    </form>
  );
}
