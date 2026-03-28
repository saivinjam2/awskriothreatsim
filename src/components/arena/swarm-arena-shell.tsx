'use client';

import Link from 'next/link';
import { DuelActivityFeed } from '@/components/duel-activity-feed';
import { LiveViewportFrame } from '@/components/arena/live-viewport-frame';
import { SwarmLegend } from '@/components/arena/swarm-legend';
import { SwarmTopHud } from '@/components/arena/swarm-top-hud';
import { ThreatPanel } from '@/components/arena/threat-panel';
import type { ViewportAlertState, SwarmTimelineEntry } from '@/lib/arena/attack-visualization';
import type { SwarmArenaMetrics } from '@/lib/arena/threat-metrics';
import type { DuelFeedItem } from '@/lib/sentinel/duel-feed';
import type { RedTeamAction, SentinelSession, TaskAgentStep } from '@/lib/sentinel/types';
import type { CSSProperties } from 'react';

export function SwarmArenaShell({
  gameId,
  session,
  latestStep,
  latestRedAction,
  timeline,
  metrics,
  viewportAlert,
  taskFeedItems,
  redFeedItems,
  promptHealth,
  ghostHealth,
  healthBarStyle,
  isLow,
  isCritical,
  shaking,
  damagePulseKey,
}: {
  gameId: string;
  session: SentinelSession;
  latestStep: TaskAgentStep | null;
  latestRedAction: RedTeamAction | null;
  timeline: SwarmTimelineEntry[];
  metrics: SwarmArenaMetrics;
  viewportAlert: ViewportAlertState;
  taskFeedItems: DuelFeedItem[];
  redFeedItems: DuelFeedItem[];
  promptHealth: number;
  ghostHealth: number;
  healthBarStyle: CSSProperties;
  isLow: boolean;
  isCritical: boolean;
  shaking: boolean;
  damagePulseKey: number;
}) {
  return (
    <>
      <SwarmTopHud
        session={session}
        promptHealth={promptHealth}
        ghostHealth={ghostHealth}
        healthBarStyle={healthBarStyle}
        isLow={isLow}
        isCritical={isCritical}
        shaking={shaking}
        damagePulseKey={damagePulseKey}
        metrics={metrics}
      />

      <section className="swarm-core-grid fade-in">
        <SwarmLegend rows={metrics.rows} activeFamily={session.activeAttackFamily} />
        <LiveViewportFrame
          session={session}
          latestStep={latestStep}
          timeline={timeline}
          promptHealth={promptHealth}
          alert={viewportAlert}
        />
        <ThreatPanel rows={metrics.rows} totals={metrics.totals} />
      </section>

      <section className="swarm-lower-grid fade-in">
        <article className="card swarm-log-card">
          <div className="swarm-card-head">
            <div>
              <p className="swarm-panel-kicker">Task Telemetry</p>
              <h3 className="swarm-card-title">Task Agent Trace</h3>
            </div>
            <div className="swarm-mini-grid">
              <MetricPill label="Status" value={session.currentTaskAgentStatus} />
              <MetricPill label="Progress" value={`${latestStep?.taskProgress ?? 0}%`} />
              <MetricPill label="Risk" value={`${latestStep?.riskScore ?? 0}`} />
              <MetricPill label="Recovery" value={session.recoveryOccurred ? 'true' : 'false'} />
            </div>
          </div>

          <div className="swarm-inline-note">
            <span>Latest rationale</span>
            <strong>{latestStep?.rationaleSummary ?? 'Standing by for the first task-agent action.'}</strong>
          </div>

          <DuelActivityFeed
            title="Task Feed"
            subtitle="Open a row for selectors, rationale, progress, and prompt-health changes."
            tone="task"
            items={taskFeedItems}
            emptyMessage="No task-agent step recorded yet."
            layout="rail"
          />
        </article>

        <article className="card swarm-log-card">
          <div className="swarm-card-head">
            <div>
              <p className="swarm-panel-kicker">Attack Chronicle</p>
              <h3 className="swarm-card-title">Red-Team Trace</h3>
            </div>
            <div className="swarm-mini-grid">
              <MetricPill label="Family" value={session.activeAttackFamily?.replace(/_/g, ' ') ?? 'none'} />
              <MetricPill label="Latest" value={latestRedAction?.attackName ?? 'none'} />
              <MetricPill label="Result" value={latestRedAction?.resolution ?? 'idle'} />
              <MetricPill label="Payloads" value={session.endedAt ? 'unlocked' : 'post-run'} />
            </div>
          </div>

          <div className="swarm-inline-note">
            <span>Current pressure</span>
            <strong>{latestRedAction?.resolutionSummary ?? 'No hostile traffic has reached the viewport yet.'}</strong>
          </div>

          <DuelActivityFeed
            title="Red-Team Feed"
            subtitle={session.endedAt ? 'Payloads are now visible for replay and export.' : 'Live mode keeps payloads tucked until the match ends.'}
            tone="red"
            items={redFeedItems}
            emptyMessage="No red-team action recorded yet."
            layout="rail"
          />
        </article>

        <article className="card swarm-log-card">
          <div className="swarm-card-head">
            <div>
              <p className="swarm-panel-kicker">Structured Output</p>
              <h3 className="swarm-card-title">Events, Rationale, Exports</h3>
            </div>
            <div className="swarm-export-links">
              <a href={`/api/sentinel/${gameId}/export?format=json`} className="chip chip-accent">
                JSON
              </a>
              <a href={`/api/sentinel/${gameId}/export?format=csv`} className="chip chip-accent">
                CSV
              </a>
              <a href={`/api/sentinel/${gameId}/export?format=sharegpt`} className="chip chip-accent">
                ShareGPT
              </a>
              {session.endedAt ? (
                <Link href={`/finish/${gameId}`} className="chip chip-task">
                  Finisher
                </Link>
              ) : null}
            </div>
          </div>

          <div className="swarm-structured-grid">
            <div className="swarm-scroll-panel">
              <p className="swarm-scroll-label">Event Log</p>
              <ul className="swarm-chronicle-list">
                {session.eventsLog.map((event) => (
                  <li key={event.id}>
                    <span>{event.type.replace(/_/g, ' ')}</span>
                    <strong>{event.message}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="swarm-scroll-panel">
              <p className="swarm-scroll-label">Rationale Ledger</p>
              <ul className="swarm-chronicle-list">
                {session.taskAgentSteps.map((step) => (
                  <li key={`rationale-${step.stepNumber}`}>
                    <span>Step {step.stepNumber}</span>
                    <strong>{step.rationaleSummary}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="swarm-metric-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
