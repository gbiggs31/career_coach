import { requireUser } from "@/lib/auth/session";
import { SearchPanel } from "@/components/search-panel";

export default async function SearchPage() {
  await requireUser();
  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <div className="pill">Review is a first-class feature</div>
          <h1>Search & Q&A</h1>
          <p>Phase 1 starts with keyword and date-range retrieval over normalized documents, with citations to the original weeks.</p>
        </div>
      </section>
      <SearchPanel />
    </main>
  );
}
