import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Career Coach MVP",
  description: "Structured weekly reflections with reliable memory and review."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userPromise = getCurrentUser();

  return (
    <html lang="en">
      <body>
        <AppFrame userPromise={userPromise}>{children}</AppFrame>
      </body>
    </html>
  );
}

async function AppFrame({
  children,
  userPromise
}: Readonly<{
  children: React.ReactNode;
  userPromise: ReturnType<typeof getCurrentUser>;
}>) {
  const user = await userPromise;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="topbar-brand">
            Career Coach
          </Link>
          <nav className="topbar-nav">
            {user ? (
              <>
                <span className="muted">{user.email}</span>
                <Link href="/" className="button-secondary">
                  Dashboard
                </Link>
                <form action="/api/auth/logout" method="post">
                  <button className="button-secondary" type="submit">
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="button-secondary">
                  Log in
                </Link>
                <Link href="/signup" className="button">
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
