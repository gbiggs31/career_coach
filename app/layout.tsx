import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Coach Aesop",
  description: "A calmer weekly coaching ritual for reflecting on your work, progress, and next steps.",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userPromise = getCurrentUser();

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${newsreader.variable}`}>
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
            Coach Aesop
          </Link>
          <nav className="topbar-nav">
            {user ? (
              <>
                <Link href="/checkins/current" className="nav-link">
                  This week
                </Link>
                <Link href="/goals" className="nav-link">
                  Progress
                </Link>
                <Link href="/search" className="nav-link">
                  Ask Aesop
                </Link>
                <div className="nav-sep" />
                <span className="user-chip">{user.name ?? user.email}</span>
                <form action="/api/auth/logout" method="post">
                  <button className="button-secondary" type="submit">
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link">
                  Log in
                </Link>
                <Link href="/signup" className="button">
                  Get started
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
