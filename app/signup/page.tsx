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
          <div className="pill">Create your space</div>
          <h1>Start with Coach Aesop</h1>
          <p className="muted">Create your private workspace for weekly reflection, progress coaching, and a clearer record of how your career is unfolding.</p>
        </div>
        <LoginForm mode="signup" />
        <p className="muted">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
