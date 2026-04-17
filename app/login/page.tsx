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
          <div className="pill">Local-first auth</div>
          <h1>Log in</h1>
          <p className="muted">Use your account to keep weekly history private and available across sessions.</p>
        </div>
        <LoginForm mode="login" />
        <p className="muted">
          Need an account? <Link href="/signup">Create one</Link>
        </p>
      </section>
    </main>
  );
}
