import { requireUser } from "@/lib/auth/session";
import { SearchPanel } from "@/components/search-panel";

export default async function SearchPage() {
  await requireUser();
  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <div className="pill">Ask Aesop</div>
          <h1>Search your own story</h1>
          <p>Ask what keeps recurring, where your attention has gone, or what has changed over time. Answers stay tied back to the weeks they came from.</p>
        </div>
      </section>
      <SearchPanel />
    </main>
  );
}
