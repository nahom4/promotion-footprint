"use client";

import { FormEvent, useState } from "react";
import type { FootprintReport } from "@/lib/types";

export default function Home() {
  const [company, setCompany] = useState("");
  const [report, setReport] = useState<FootprintReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError(""); setReport(null);
    try {
      const r = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ company }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Analysis failed");
      setReport(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Analysis failed"); }
    finally { setLoading(false); }
  }

  return <main className="shell">
    <nav className="nav"><div className="container"><div className="brand">Promotion <span>Footprint</span></div></div></nav>
    <div className="container">
      <section className="hero">
        <div className="eyebrow">Competitor intelligence</div>
        <h1>See where a company promotes itself.</h1>
        <p>Search public marketing signals across major digital channels, rank the visible footprint, and keep the evidence behind every finding.</p>
        <form className="search" onSubmit={submit}>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company or product — e.g. Zoorya" aria-label="Company or product" />
          <button className="primary" disabled={loading || !company.trim()}>{loading ? "Scanning…" : "Analyze footprint"}</button>
        </form>
        {error && <div className="error">{error}</div>}
        {loading && <div className="status">Checking Google, Meta, LinkedIn, YouTube and TikTok public surfaces. Some sources may take longer or refuse automated access.</div>}
      </section>

      {report && <section className="section">
        <div className="grid" style={{ marginBottom: 16 }}>
          <div className="card"><div className="muted">Promotion footprint</div><div className="score">{report.score}<span style={{fontSize:18}}>/100</span></div><div className="note">Observable promotional intensity, not ad spend or ROI.</div></div>
          <div className="card"><div className="muted">Company</div><h2>{report.company}</h2><div className="note">Generated {new Date(report.generatedAt).toLocaleString()}</div></div>
          <div className="card"><div className="muted">Themes detected</div><h2>{report.themes.length}</h2><div className="note">Based only on collected evidence.</div></div>
        </div>

        <h2>Channel footprint</h2>
        <div className="grid">
          {report.channels.map((c, i) => <div className="card" key={c.platform}>
            <div className="row"><span className="rank">#{i+1}</span><strong>{c.platform}</strong><span>{c.score}</span></div>
            <div className="bar"><div style={{ width: `${c.score}%` }} /></div>
            <p className="note">{c.observations} observations · {c.paidSignals} paid signals · {c.confidence}% confidence</p>
            {c.observationsList.map((o, j) => <div className="evidence" key={j}><strong>{o.title}</strong><br/>{o.description.slice(0, 220)}<br/><a className="link" href={o.url} target="_blank" rel="noreferrer">Evidence ↗</a></div>)}
            {!c.observations && <div className="note">No public observation collected. This does not mean the company does not use this channel.</div>}
          </div>)}
        </div>

        <h2 style={{marginTop:40}}>Themes</h2>
        <div className="grid">{report.themes.map(t => <div className="card" key={t.name}><strong>{t.name}</strong><div className="score" style={{fontSize:38}}>{t.count}</div><div className="note">matching observations</div></div>)}</div>
        <h2 style={{marginTop:40}}>Method limitations</h2>
        <div className="card">{report.limitations.map(x => <p className="note" key={x}>• {x}</p>)}</div>
      </section>}
    </div>
  </main>;
}
