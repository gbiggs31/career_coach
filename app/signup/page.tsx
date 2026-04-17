import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/login-form";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <main className="auth-shell">
      <section className="card stack">
        <div>
          <div className="pill">Create your workspace</div>
          <h1>Create account</h1>
          <p className="muted">This keeps the app directly usable on your machine without needing an external auth provider.</p>
        </div>
        <LoginForm mode="signup" />
        <p className="muted">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
