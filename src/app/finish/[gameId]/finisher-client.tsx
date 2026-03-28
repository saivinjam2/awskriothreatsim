'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DuelActivityFeed } from '@/components/duel-activity-feed';
import { buildRedTeamFeedItems, buildTaskAgentFeedItems } from '@/lib/sentinel/duel-feed';
import { formatDateTime, formatDuration } from '@/lib/sentinel/format';
import type { SentinelSession } from '@/lib/sentinel/types';

export function FinisherClient({ gameId }: { gameId: string }) {
  const [session, setSession] = useState<SentinelSession | null>(null);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/sentinel/${gameId}`, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('Failed to load'); return r.json(); })
      .then((p: { session: SentinelSession }) => { setSession(p.session); setError(null); })
      .catch((e) => { setSession(null); setError((e as Error).message); });
  }, [gameId]);

  const tone = useMemo(() => {
    if (!session) return 'standoff';
    if (session.winner === 'Task Agent') return 'victory';
    if (session.winner === 'Red-Team Agent') return 'defeat';
    return 'standoff';
  }, [session]);

  const taskFeed = useMemo(
    () => buildTaskAgentFeedItems(session?.taskAgentSteps ?? []),
    [session?.taskAgentSteps],
  );
  const redFeed = useMemo(
    () => buildRedTeamFeedItems(session?.redTeamActions ?? [], { revealPayloads: Boolean(session?.endedAt) }),
    [session?.endedAt, session?.redTeamActions],
  );

  if (error) {
    return (
      <div className="fin-shell">
        <div className="fin-error">
          <p>{error}</p>
          <Link href="/" className="fin-btn primary">Start New Run</Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="fin-shell">
        <div className="fin-loading">Loading results...</div>
      </div>
    );
  }

  const blocked   = session.redTeamActions.filter(a => a.resolution === 'blocked').length;
  const breached  = session.redTeamActions.filter(a => a.resolution === 'successful' || a.resolution === 'escalated').length;
  const total     = session.redTeamActions.length;
  const blockRate = total > 0 ? Math.round((blocked / total) * 100) : 0;
  const grade     = tone === 'victory'
    ? (blockRate > 85 ? 'S' : blockRate > 70 ? 'A' : 'B')
    : (blockRate > 50 ? 'C' : 'D');
  const gradeColor = (grade === 'S' || grade === 'A')
    ? '#4ade80'
    : (grade === 'B' || grade === 'C')
      ? '#fbbf24'
      : '#f87171';

  return (
    <div className="fin-shell">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="fin-nav">
        <div className="fin-nav-left">
          <div className="fin-logo">KT</div>
          <span className="fin-brand">KRIO ThreatSim</span>
        </div>
        <div className="fin-nav-right">
          <Link href="/"        className="fin-nav-link">New Run</Link>
          <Link href="/history" className="fin-nav-link">Archive</Link>
        </div>
      </nav>

      <main className="fin-main">

        {/* ── Banner ──────────────────────────────────────────────────── */}
        <section className="fin-banner">
          <div className="fin-banner-left">
            <span className="fin-kicker">Simulation Complete</span>
            <h1 className="fin-title">
              {tone === 'victory' ? 'DEFENSE HELD' : tone === 'defeat' ? 'DEFENSE BREACHED' : 'STANDOFF'}
            </h1>
            <span className="fin-game-id">
              Game {session.gameId} · {formatDateTime(session.endedAt ?? session.startedAt)}
            </span>
          </div>
          <div className="fin-grade-box">
            <span className="fin-grade" style={{ color: gradeColor }}>{grade}</span>
            <span className="fin-grade-label">Grade</span>
          </div>
        </section>

        {/* ── Verdict row ─────────────────────────────────────────────── */}
        <section className="fin-verdict-row">
          <div className={`fin-verdict-badge is-${tone}`}>
            <span className="fin-verdict-dot" />
            <span>{session.finalVerdict.replace(/_/g, ' ')}</span>
          </div>
          <Stat label="Winner"   value={session.winner} />
          <Stat label="Duration" value={formatDuration(session.durationSeconds)} />
          <Stat label="Safety"   value={String(session.safetyScore)} />
          <Stat label="Recovery" value={session.recoveryOccurred ? 'Yes' : 'No'} />
        </section>

        {/* ── Metrics grid ────────────────────────────────────────────── */}
        <section className="fin-metrics">
          <div className="fin-metric-card">
            <span>Total Attacks</span><strong>{total}</strong>
          </div>
          <div className="fin-metric-card ok">
            <span>Blocked</span><strong>{blocked}</strong>
          </div>
          <div className="fin-metric-card danger">
            <span>Breached</span><strong>{breached}</strong>
          </div>
          <div className="fin-metric-card" style={{ borderColor: `${gradeColor}40` }}>
            <span>Block Rate</span>
            <strong style={{ color: gradeColor }}>{blockRate}%</strong>
          </div>
          <div className="fin-metric-card">
            <span>Steps</span><strong>{session.currentStep}</strong>
          </div>
          <div className="fin-metric-card">
            <span>Prompt Health</span><strong>{session.promptHealth}%</strong>
          </div>
        </section>

        {/* ── Config summary ──────────────────────────────────────────── */}
        <section className="fin-config">
          <div className="fin-config-item"><span>Scenario</span><strong>{session.scenarioLabel}</strong></div>
          <div className="fin-config-item"><span>Difficulty</span><strong>{session.difficulty}</strong></div>
          <div className="fin-config-item"><span>Task Agent</span><strong>{session.taskAgentType}</strong></div>
          <div className="fin-config-item"><span>Red Team</span><strong>{session.redTeamType}</strong></div>
        </section>

        {/* ── Attack timeline ─────────────────────────────────────────── */}
        <section className="fin-timeline">
          <div className="fin-section-head">
            <span className="fin-section-dot red" />
            <span>ATTACK_TIMELINE</span>
          </div>
          <div className="fin-timeline-list">
            {session.redTeamActions.length === 0 && (
              <div className="fin-empty">No attacks recorded.</div>
            )}
            {session.redTeamActions.map((a, i) => {
              const cls = a.resolution === 'blocked'
                ? 'is-blocked'
                : (a.resolution === 'successful' || a.resolution === 'escalated')
                  ? 'is-breach'
                  : 'is-pending';
              return (
                <div key={`${a.actionNumber}-${a.timestamp}`} className={`fin-timeline-item ${cls}`}>
                  <span className="fin-tl-num">#{i + 1}</span>
                  <span className="fin-tl-name">{a.attackName}</span>
                  <span className="fin-tl-family">{a.attackFamily.replace(/_/g, ' ')}</span>
                  <span className="fin-tl-result">{a.resolution}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Event log ───────────────────────────────────────────────── */}
        <section className="fin-events">
          <div className="fin-section-head">
            <span className="fin-section-dot" />
            <span>EVENT_LOG</span>
          </div>
          <div className="fin-event-list">
            {session.eventsLog.map((e) => (
              <div key={e.id} className="fin-event-item">
                <span className="fin-ev-type">{e.type.replace(/_/g, ' ')}</span>
                <span className="fin-ev-msg">{e.message}</span>
              </div>
            ))}
            {session.eventsLog.length === 0 && <div className="fin-empty">No events recorded.</div>}
          </div>
        </section>

        {/* ── Feeds ───────────────────────────────────────────────────── */}
        <section className="fin-feeds">
          <article className="fin-feed-card">
            <DuelActivityFeed
              title="Task Agent Feed"
              subtitle="Post-match ledger."
              tone="task"
              items={taskFeed}
              emptyMessage="No steps recorded."
            />
          </article>
          <article className="fin-feed-card">
            <DuelActivityFeed
              title="Red-Team Feed"
              subtitle="Payloads revealed."
              tone="red"
              items={redFeed}
              emptyMessage="No actions recorded."
            />
          </article>
        </section>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <section className="fin-actions">
          <Link href="/" className="fin-btn primary">Start New Run →</Link>
          <Link href={`/history`} className="fin-btn">Open Archive</Link>
          <a href={`/api/sentinel/${gameId}/export?format=json`} className="fin-btn">Export JSON</a>
          <a href={`/api/sentinel/${gameId}/export?format=csv`}  className="fin-btn">Export CSV</a>
          <a href={`/api/sentinel/${gameId}/export?format=sharegpt`} className="fin-btn">Export ShareGPT</a>
        </section>

      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="fin-verdict-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
