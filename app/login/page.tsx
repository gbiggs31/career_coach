import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <main className="auth-shell">
      <section className="card stack">
        <div>
          <div className="pill">Welcome back</div>
          <h1>Step back into your weekly practice</h1>
          <p className="muted">Log in to continue your reflections, revisit older weeks, and keep your coaching history private.</p>
        </div>
        <LoginForm mode="login" />
        <p className="muted">
          Need an account? <Link href="/signup">Create one</Link>
        </p>
      </section>
    </main>
  );
}
