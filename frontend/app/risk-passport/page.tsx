"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const checks = [
  { id: "mfa", label: "Multi-factor authentication is enabled for important accounts", area: "Cyber Liability" },
  { id: "backup", label: "Critical business data is backed up and recovery is tested", area: "Cyber Liability" },
  { id: "response", label: "We have a documented cyber incident response process", area: "Cyber Liability" },
  { id: "governance", label: "Directors review governance, compliance and key business risks", area: "D&O" },
  { id: "disclosures", label: "Company financial and legal disclosures are kept up to date", area: "D&O" },
  { id: "keyperson", label: "We have identified roles where one person's absence could disrupt operations", area: "Key-Person" },
  { id: "continuity", label: "We have a continuity or succession plan for critical roles", area: "Key-Person" },
];

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f5f8fd", color: "#17243a", padding: "36px 18px", fontFamily: "Arial, sans-serif" },
  wrap: { maxWidth: 980, margin: "0 auto" },
  top: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 28 },
  brand: { fontWeight: 800, fontSize: 20, color: "#17243a", textDecoration: "none" },
  panel: { background: "#fff", border: "1px solid #e1e8f2", borderRadius: 18, padding: 26, marginBottom: 18, boxShadow: "0 10px 30px rgba(24,52,91,.04)" },
  eyebrow: { color: "#2457d6", fontSize: 11, letterSpacing: 2, fontWeight: 800 },
  heading: { fontSize: 34, lineHeight: 1.15, margin: "12px 0", letterSpacing: -1 },
  muted: { color: "#68758a", lineHeight: 1.65 },
  button: { border: 0, borderRadius: 10, padding: "12px 18px", background: "#2457d6", color: "#fff", fontWeight: 700, cursor: "pointer" },
  outline: { border: "1px solid #d8e2f1", borderRadius: 10, padding: "10px 15px", background: "#fff", color: "#2457d6", textDecoration: "none", fontWeight: 700 },
  item: { display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0", borderBottom: "1px solid #edf1f6" },
  score: { fontSize: 48, fontWeight: 800, color: "#2457d6", lineHeight: 1 },
  tag: { display: "inline-block", background: "#eaf0ff", color: "#2457d6", borderRadius: 30, padding: "7px 11px", margin: "5px 6px 0 0", fontSize: 12, fontWeight: 700 },
};

export default function BusinessRiskPassport() {
  const [answers, setAnswers] = useState<string[]>([]);
  const [companyType, setCompanyType] = useState("Technology / SaaS");
  const [submitted, setSubmitted] = useState(false);
  const score = Math.round((answers.length / checks.length) * 100);
  const recommendations = useMemo(() => {
    const areas = new Set<string>();
    if (!answers.includes("mfa") || !answers.includes("backup") || !answers.includes("response")) areas.add("Cyber Liability");
    if (!answers.includes("governance") || !answers.includes("disclosures")) areas.add("D&O");
    if (!answers.includes("keyperson") || !answers.includes("continuity")) areas.add("Key-Person");
    return Array.from(areas);
  }, [answers]);

  function toggle(id: string) {
    setAnswers(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
    setSubmitted(false);
  }

  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <header style={styles.top}>
          <Link href="/" style={styles.brand}>CoverBridge <span style={{ color: "#2457d6" }}> / Risk Passport</span></Link>
          <Link href="/" style={styles.outline}>Back to workspace</Link>
        </header>

        <section style={styles.panel}>
          <div style={styles.eyebrow}>COVERBRIDGE BUSINESS RISK PASSPORT</div>
          <h1 style={styles.heading}>Understand your business risk readiness.</h1>
          <p style={styles.muted}>Complete this short self-check to get a practical preparedness snapshot and a shortlist of insurance topics to discuss with a qualified broker.</p>
          <p style={{ ...styles.muted, fontSize: 13, marginTop: 16 }}><strong>Important:</strong> This is an educational readiness indicator, not an insurance quote, underwriting decision, guarantee of cover or regulated insurance advice.</p>
        </section>

        <section style={styles.panel}>
          <h2 style={{ marginTop: 0 }}>1. Tell us about your business</h2>
          <label style={{ display: "block", marginTop: 18, fontWeight: 700 }}>Business type</label>
          <select value={companyType} onChange={e => setCompanyType(e.target.value)} style={{ width: "100%", maxWidth: 440, padding: 12, border: "1px solid #d8e2f1", borderRadius: 9, marginTop: 8 }}>
            {["Technology / SaaS", "Professional services", "Manufacturing", "Healthcare", "Retail / E-commerce", "Financial services", "Other"].map(x => <option key={x}>{x}</option>)}
          </select>
        </section>

        <section style={styles.panel}>
          <h2 style={{ marginTop: 0 }}>2. Business preparedness checklist</h2>
          <p style={styles.muted}>Tick each statement that is currently true for your business.</p>
          {checks.map(item => (
            <label key={item.id} style={styles.item}>
              <input type="checkbox" checked={answers.includes(item.id)} onChange={() => toggle(item.id)} style={{ width: 18, height: 18, marginTop: 2, accentColor: "#2457d6" }} />
              <span><strong>{item.label}</strong><small style={{ display: "block", color: "#77849a", marginTop: 5 }}>{item.area}</small></span>
            </label>
          ))}
          <button type="button" style={{ ...styles.button, marginTop: 20 }} onClick={() => setSubmitted(true)}>Generate my Risk Passport</button>
        </section>

        {submitted && <section style={styles.panel} aria-live="polite">
          <div style={styles.eyebrow}>YOUR READINESS SNAPSHOT · {companyType}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap", margin: "18px 0" }}>
            <div style={styles.score}>{score}<span style={{ fontSize: 20 }}>/100</span></div>
            <div><h2 style={{ margin: "0 0 6px" }}>{score >= 80 ? "Strong preparation signals" : score >= 45 ? "Some preparation in place" : "More preparation recommended"}</h2><p style={styles.muted}>Based only on the checklist answers you selected.</p></div>
          </div>
          <div style={{ height: 12, background: "#eaf0f8", borderRadius: 20, overflow: "hidden" }}><div style={{ width: score + "%", height: "100%", background: "#2457d6", borderRadius: 20 }} /></div>
          <h3 style={{ marginTop: 26 }}>Insurance topics to discuss with a broker</h3>
          {recommendations.map(x => <span key={x} style={styles.tag}>{x}</span>)}
          <p style={{ ...styles.muted, marginTop: 16 }}>These topics are matched to checklist gaps for discussion only. A broker or insurer must assess your circumstances, eligibility, policy wording, exclusions and limits.</p>
          <h3 style={{ marginTop: 24 }}>Suggested next steps</h3>
          <ul style={{ ...styles.muted, paddingLeft: 22, lineHeight: 1.9 }}>
            {(!answers.includes("mfa") || !answers.includes("backup") || !answers.includes("response")) && <li>Review access controls, backups and incident response readiness.</li>}
            {(!answers.includes("governance") || !answers.includes("disclosures")) && <li>Review director governance processes and keep company disclosures current.</li>}
            {(!answers.includes("keyperson") || !answers.includes("continuity")) && <li>Identify critical roles and document a continuity or succession plan.</li>}
            {answers.length === checks.length && <li>Keep evidence of these controls current and review the checklist periodically with your broker.</li>}
          </ul>
          <button type="button" style={styles.outline as React.CSSProperties} onClick={() => window.print()}>Print / Save Risk Passport</button>
        </section>}
        <footer style={{ textAlign: "center", color: "#7a8799", fontSize: 12, padding: 16 }}>CoverBridge MVP · Preparedness guidance only · Not an insurance policy or binding quote</footer>
      </div>
    </main>
  );
}
