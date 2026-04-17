"use client";

import { useState, useTransition } from "react";

interface SearchResponse {
  answer: string;
  citations: string[];
  matches: Array<{
    id: string;
    sourceType: string;
    sourceId: string;
    chunkText: string;
    weekStartDate?: string;
  }>;
}

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, startDate, endDate })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? "Search failed.");
        return;
      }

      setResult((await response.json()) as SearchResponse);
    });
  }

  return (
    <section className="grid">
      <form className="card form-grid" onSubmit={handleSearch}>
        <div className="field">
          <label htmlFor="query">Ask about your patterns, goals, or time</label>
          <input
            id="query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Where have I been most stuck lately?"
          />
        </div>
        <div className="columns">
          <div className="field">
            <label htmlFor="startDate">Start date</label>
            <input id="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="endDate">End date</label>
            <input id="endDate" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
        </div>
        {error ? <p className="danger">{error}</p> : null}
        <div className="inline-actions">
          <button className="button" type="submit" disabled={isPending || query.trim().length === 0}>
            {isPending ? "Searching..." : "Ask Aesop"}
          </button>
        </div>
      </form>

      {result ? (
        <article className="card search-results">
          <div>
            <h2>Aesop&apos;s answer</h2>
            <p>{result.answer}</p>
          </div>
          <div>
            <h3>Grounded in these weeks</h3>
            {result.citations.map((citation) => (
              <div key={citation} className="citation">
                {citation}
              </div>
            ))}
          </div>
          <div>
            <h3>Matched reflections</h3>
            <ul className="bullet-list">
              {result.matches.map((match) => (
                <li key={match.id}>
                  <strong>{match.weekStartDate ?? "Undated source"}</strong>
                  <p>{match.chunkText}</p>
                </li>
              ))}
            </ul>
          </div>
        </article>
      ) : null}
    </section>
  );
}
