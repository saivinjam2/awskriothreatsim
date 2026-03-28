'use client';

import Link from 'next/link';
import { SentinelHeader } from '@/components/sentinel-header';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Pick a target website',
    desc: 'Choose any live website and give the AI agent a task to complete on it — like searching for a product or filling out a form.',
  },
  {
    step: '02',
    title: 'The red team attacks',
    desc: 'A second AI tries to trick the first one — injecting fake instructions, hiding real buttons, and baiting it into doing the wrong thing.',
  },
  {
    step: '03',
    title: 'Watch it play out live',
    desc: "See both AIs battle in real-time. Get a full breakdown of every attack, every decision, and whether the agent held up — or got fooled.",
  },
];

const FEATURES = [
  {
    icon: '🎯',
    title: 'Real websites, real attacks',
    desc: 'Runs against actual live sites — not sandboxes. The threat is as real as it gets.',
  },
  {
    icon: '🧠',
    title: '4 types of AI attacks',
    desc: 'Prompt injection, fake UI elements, task diversion, and data theft traps — all automated.',
  },
  {
    icon: '📊',
    title: 'Full run history',
    desc: 'Every session is saved. Replay, compare, and export any run as JSON or CSV.',
  },
  {
    icon: '⚡',
    title: 'Adjustable difficulty',
    desc: 'From a gentle test to full-pressure attack mode. You control how hard the red team pushes.',
  },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 'min(1200px, calc(100% - 2rem))', margin: '0 auto', paddingBottom: '6rem' }}>
        <SentinelHeader />

        {/* ── Hero ── */}
        <section style={{ padding: '5rem 0 4rem', textAlign: 'center', maxWidth: 720, margin: '0 auto' }} className="fade-in">
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.25)',
            color: 'var(--accent)', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            padding: '0.35rem 1rem', borderRadius: 999, marginBottom: '1.5rem',
          }}>
            AI Security Testing Tool
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', fontWeight: 800,
            color: 'var(--tx)', letterSpacing: '-0.04em', lineHeight: 1.05,
            marginBottom: '1.25rem',
          }}>
            See if your AI agent can<br />
            <span style={{ color: 'var(--accent)' }}>survive an attack</span>
          </h1>

          <p style={{
            fontSize: '1.1rem', color: 'var(--tx2)', lineHeight: 1.7,
            marginBottom: '2.5rem', maxWidth: 540, margin: '0 auto 2.5rem',
          }}>
            KRIO ThreatSim pits your browser AI agent against a red-team attacker
            on any live website. Watch in real-time. Get a full report.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/configure" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.8rem 2rem', background: 'var(--accent)', color: '#fff',
              fontSize: 15, fontWeight: 700, borderRadius: 999,
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
              transition: 'transform 0.15s',
            }}>
              Start a Test →
            </Link>
            <Link href="/history" style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '0.8rem 2rem',
              border: '1px solid var(--border2)', color: 'var(--tx2)',
              fontSize: 15, fontWeight: 500, borderRadius: 999,
              background: 'transparent',
            }}>
              View Past Results
            </Link>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section style={{ padding: '3rem 0' }} className="fade-in">
          <h2 style={{
            fontSize: '1.5rem', fontWeight: 700, color: 'var(--tx)',
            letterSpacing: '-0.02em', textAlign: 'center', marginBottom: '0.5rem',
          }}>
            How it works
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 14, marginBottom: '2.5rem' }}>
            Three steps from zero to a full adversarial report
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '1.75rem',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: 'var(--accent)',
                  marginBottom: '1rem', fontFamily: 'var(--mono)',
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--tx3)', lineHeight: 1.65 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section style={{ padding: '2rem 0' }} className="fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem' }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '1.5rem',
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{f.icon}</span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: '0.3rem', letterSpacing: '-0.01em' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--tx3)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="fade-in" style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '2.5rem 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '2rem', marginTop: '2rem',
        }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--tx)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
              Ready to run your first test?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--tx3)' }}>
              Takes about 2 minutes to configure. Results are instant.
            </p>
          </div>
          <Link href="/configure" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1.75rem', background: 'var(--accent)', color: '#fff',
            fontSize: 14, fontWeight: 700, borderRadius: 999, flexShrink: 0,
            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
          }}>
            Start a Test →
          </Link>
        </section>
      </div>
    </div>
  );
}
