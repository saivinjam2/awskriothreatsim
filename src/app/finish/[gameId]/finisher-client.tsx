'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DuelActivityFeed } from '@/components/duel-activity-feed';
import { SentinelHeader } from '@/components/sentinel-header';
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
      <div className="threatsim-shell">
        <SentinelHeader />
        <main className="fin-main">
          <div className="card fin-error-card">
            <p className="fin-error-msg">{error}</p>
            <Link href="/" className="fin-btn-primary">Start New Run</Link>
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="threatsim-shell">
        <SentinelHeader />
        <main className="fin-main">
          <div className="card fin-loading-card">Loading results...</div>
        </main>
      </div>
    );
  }

  const blocked   = session.redTeamActions.filter(a => a.resolution === 'blocked').length;
  const breached  = session.redTeamActions.filter(a => a.resolution === 'successful' || a.resolution === 'escalated').length;
  const total     = session.redTeamActions.length;
  const blockRate = total > 0 ? Math.round((blocked / total) * 100) : 0;

  const grade = tone === 'victory'
    ? (blockRate > 85 ? 'S' : blockRate > 70 ? 'A' : 'B')
    : (blockRate > 50 ? 'C' : 'D');

  const gradeColor =
    grade === 'S' || grade === 'A' ? 'var(--green)'
    : grade === 'B' || grade === 'C' ? 'var(--yellow)'
    : 'var(--red)';

  const toneColor =
    tone === 'victory' ? 'var(--green)'
    : tone === 'defeat' ? 'var(--red)'
    : 'var(--yellow)';

  const toneBg =
    tone === 'victory' ? 'var(--green-dim)'
    : tone === 'defeat' ? 'var(--red-dim)'
    : 'var(--yellow-dim)';

  return (
    <div className="threatsim-shell">
      <SentinelHeader />

      <main className="fin-main">

        {/* ── Banner ─────────────────────────────────────────────────── */}
        <section className="fin-banner">
          <div className="fin-banner-left">
            <span className="fin-kicker">Simulation Complete</span>
            <h1 className="fin-title">
              {tone === 'victory' ? 'Defense Held' : tone === 'defeat' ? 'Defense Breached' : 'Standoff'}
            </h1>
            <p className="fin-subtitle">
              Game {session.gameId} · {formatDateTime(session.endedAt ?? session.startedAt)}
            </p>
          </div>

          <div className="fin-grade-box" style={{ color: gradeColor }}>
            <span className="fin-grade">{grade}</span>
            <span className="fin-grade-label">Grade</span>
          </div>
        </section>

        {/* ── Verdict + stats row ─────────────────────────────────────── */}
        <div className="fin-verdict-row">
          <span
            className="fin-verdict-badge"
            style={{ color: toneColor, background: toneBg, borderColor: toneColor }}
          >
            <span className="fin-verdict-dot" style={{ background: toneColor }} />
            {session.finalVerdict.replace(/_/g, ' ')}
          </span>

          <StatPill label="Winner"   value={session.winner} />
          <StatPill label="Duration" value={formatDuration(session.durationSeconds)} />
          <StatPill label="Safety"   value={String(session.safetyScore)} />
          <StatPill label="Recovery" value={session.recoveryOccurred ? 'Yes' : 'No'} />
        </div>

        {/* ── Metrics grid ────────────────────────────────────────────── */}
        <div className="fin-metrics">
          <MetricCard label="Total Attacks" value={String(total)} />
          <MetricCard label="Blocked"        value={String(blocked)}   accent="var(--green)" />
          <MetricCard label="Breached"       value={String(breached)}  accent="var(--red)" />
          <MetricCard label="Block Rate"     value={`${blockRate}%`}   accent={gradeColor} />
          <MetricCard label="Steps"          value={String(session.currentStep)} />
          <MetricCard label="Prompt Health"  value={`${session.promptHealth}%`} />
        </div>

        {/* ── Config summary ──────────────────────────────────────────── */}
        <div className="card fin-config-card">
          <ConfigItem label="Scenario"   value={session.scenarioLabel} />
          <ConfigItem label="Difficulty" value={session.difficulty} />
          <ConfigItem label="Task Agent" value={session.taskAgentType} />
          <ConfigItem label="Red Team"   value={session.redTeamType} />
        </div>

        {/* ── Attack timeline ─────────────────────────────────────────── */}
        <div className="card fin-section-card">
          <div className="fin-section-head">
            <span className="fin-section-dot" style={{ background: 'var(--red)' }} />
            <span>Attack Timeline</span>
            <span className="fin-section-count">{total} events</span>
          </div>
          <div className="fin-timeline-list">
            {session.redTeamActions.length === 0 && (
              <p className="fin-empty">No attacks recorded.</p>
            )}
            {session.redTeamActions.map((a, i) => {
              const isBlocked  = a.resolution === 'blocked';
              const isBreach   = a.resolution === 'successful' || a.resolution === 'escalated';
              const rowColor   = isBlocked ? 'var(--green)' : isBreach ? 'var(--red)' : 'var(--yellow)';
              return (
                <div key={`${a.actionNumber}-${a.timestamp}`} className="fin-timeline-row" style={{ borderLeftColor: rowColor }}>
                  <span className="fin-tl-num">#{i + 1}</span>
                  <div className="fin-tl-body">
                    <span className="fin-tl-name">{a.attackName}</span>
                    <span className="fin-tl-family">{a.attackFamily.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="fin-tl-result" style={{ color: rowColor }}>
                    {a.resolution}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Event log ───────────────────────────────────────────────── */}
        <div className="card fin-section-card">
          <div className="fin-section-head">
            <span className="fin-section-dot" style={{ background: 'var(--accent)' }} />
            <span>Event Log</span>
            <span className="fin-section-count">{session.eventsLog.length} events</span>
          </div>
          <div className="fin-event-list">
            {session.eventsLog.length === 0 && <p className="fin-empty">No events recorded.</p>}
            {session.eventsLog.map((e) => (
              <div key={e.id} className="fin-event-row">
                <span className="fin-ev-type">{e.type.replace(/_/g, ' ')}</span>
                <span className="fin-ev-msg">{e.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feeds ───────────────────────────────────────────────────── */}
        <div className="fin-feeds">
          <div className="card fin-feed-card">
            <DuelActivityFeed
              title="Task Agent Feed"
              subtitle="Post-match ledger."
              tone="task"
              items={taskFeed}
              emptyMessage="No steps recorded."
            />
          </div>
          <div className="card fin-feed-card">
            <DuelActivityFeed
              title="Red-Team Feed"
              subtitle="Payloads revealed."
              tone="red"
              items={redFeed}
              emptyMessage="No actions recorded."
            />
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div className="fin-actions">
          <Link href="/configure"   className="fin-btn-primary">New Run →</Link>
          <Link href="/history"     className="fin-btn-secondary">Archive</Link>
          <a href={`/api/sentinel/${gameId}/export?format=json`}     className="fin-btn-secondary">JSON</a>
          <a href={`/api/sentinel/${gameId}/export?format=csv`}      className="fin-btn-secondary">CSV</a>
          <a href={`/api/sentinel/${gameId}/export?format=sharegpt`} className="fin-btn-secondary">ShareGPT</a>
        </div>

      </main>
    </div>
  );
}

/* ── Small helper components ──────────────────────────────────────────── */
function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="fin-stat-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card fin-metric-card">
      <span className="fin-metric-label">{label}</span>
      <strong className="fin-metric-value" style={accent ? { color: accent } : undefined}>
        {value}
      </strong>
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="fin-config-item">
      <span>{label}</span>
      <strong>{value || 'n/a'}</strong>
    </div>
  );
}
