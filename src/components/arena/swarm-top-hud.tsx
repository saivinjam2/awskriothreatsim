'use client';

import type { CSSProperties } from 'react';
import type { SwarmArenaMetrics } from '@/lib/arena/threat-metrics';
import type { SentinelSession } from '@/lib/sentinel/types';

export function SwarmTopHud({
  session,
  promptHealth,
  ghostHealth,
  healthBarStyle,
  isLow,
  isCritical,
  shaking,
  damagePulseKey,
  metrics,
}: {
  session: SentinelSession;
  promptHealth: number;
  ghostHealth: number;
  healthBarStyle: CSSProperties;
  isLow: boolean;
  isCritical: boolean;
  shaking: boolean;
  damagePulseKey: number;
  metrics: SwarmArenaMetrics;
}) {
  return (
    <section className="card swarm-top-hud">
      <div className="swarm-top-grid">
        <div className="swarm-top-title">
          <p className="swarm-panel-kicker">Cyber Ocean Arena</p>
          <h1>Swarm Defense Arena</h1>
          <p>
            Game {session.gameId} / {session.scenarioLabel} / {metrics.runStatus === 'complete' ? 'Run complete' : 'Live duel in progress'}
          </p>
        </div>

        <div className="swarm-health-card">
          <div className="swarm-health-head">
            <span>Prompt membrane</span>
            <strong className={`arena-health-value ${isLow ? 'is-low' : ''} ${isCritical ? 'is-critical' : ''}`}>
              {Math.round(promptHealth)}%
            </strong>
          </div>

          <div
            role="progressbar"
            aria-label="Task prompt health"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(promptHealth)}
            className={`arena-health-bar ${shaking ? 'is-hit' : ''} ${isLow ? 'is-low' : ''} ${isCritical ? 'is-critical' : ''}`}
            style={healthBarStyle}
          >
            {[25, 50, 75].map((mark) => (
              <span key={mark} className="arena-health-mark" style={{ left: `${mark}%` }} />
            ))}
            {ghostHealth > promptHealth ? <span className="arena-health-ghost" style={{ width: `${ghostHealth}%` }} /> : null}
            <span className="arena-health-fill" style={{ width: `${promptHealth}%` }} />
            {damagePulseKey > 0 ? <span key={damagePulseKey} className="arena-health-hit" /> : null}
            <span className="arena-health-frame" />
          </div>
        </div>

        <div className="swarm-hud-metrics">
          <HudMetric label="Run" value={metrics.runStatus === 'complete' ? session.finalVerdict : 'RUNNING'} tone="accent" />
          <HudMetric label="Step" value={`${metrics.stepCount}`} tone="neutral" />
          <HudMetric label="Blocked" value={`${metrics.blockedCount}`} tone="ok" />
          <HudMetric label="Impacts" value={`${metrics.breachLikeCount}`} tone="danger" />
          <HudMetric label="Active" value={`${metrics.activeThreats}`} tone="warning" />
          <HudMetric label="Safety" value={`${metrics.safetyScore}`} tone="neutral" />
        </div>
      </div>
    </section>
  );
}

function HudMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'ok' | 'danger' | 'warning' | 'accent';
}) {
  return (
    <div className={`swarm-hud-metric is-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
