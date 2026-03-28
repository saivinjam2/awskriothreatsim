'use client';

import Image from 'next/image';
import { SwarmCanvas } from '@/components/arena/swarm-canvas';
import type { ViewportAlertState, SwarmTimelineEntry } from '@/lib/arena/attack-visualization';
import type { SentinelSession, TaskAgentStep } from '@/lib/sentinel/types';

export function LiveViewportFrame({
  session,
  latestStep,
  timeline,
  promptHealth,
  alert,
}: {
  session: SentinelSession;
  latestStep: TaskAgentStep | null;
  timeline: SwarmTimelineEntry[];
  promptHealth: number;
  alert: ViewportAlertState;
}) {
  const targetLabel = session.targetUrl ?? session.scenarioPath;

  return (
    <article className="card swarm-stage-card">
      <div className="swarm-stage-head">
        <div>
          <p className="swarm-panel-kicker">Live Viewport</p>
          <h2 className="swarm-stage-title">Swarm Defense Arena</h2>
          <p className="swarm-stage-copy">The real browser screenshot stays centered while live attack entities pressure the page.</p>
        </div>

        <div className="swarm-stage-pillset">
          <span className="chip chip-task">Prompt Health {Math.round(promptHealth)}%</span>
          <span className={`swarm-alert-pill is-${alert.tone}`}>{alert.label}</span>
        </div>
      </div>

      <div className="swarm-browser-chrome">
        <span className="swarm-browser-dot" />
        <span className="swarm-browser-dot" />
        <span className="swarm-browser-dot" />
        <div className="swarm-browser-target">{targetLabel}</div>
      </div>

      <div className="swarm-stage-frame">
        <div className={`swarm-stage-impact is-${alert.tone}`} />
        <div className="swarm-stage-scanline" />
        {session.latestScreenshotUrl ? (
          <Image
            key={session.latestScreenshotUrl}
            src={session.latestScreenshotUrl}
            alt="Latest live browser screenshot"
            width={1360}
            height={900}
            unoptimized
            className="swarm-stage-image"
          />
        ) : (
          <div className="swarm-stage-placeholder">Waiting for the first viewport capture...</div>
        )}

        <SwarmCanvas events={timeline} promptHealth={promptHealth} paused={Boolean(session.endedAt)} />

        <div className="swarm-stage-overlay">
          <div className={`swarm-stage-alert is-${alert.tone}`}>
            <p>{alert.label}</p>
            <span>{alert.detail}</span>
          </div>

          <div className="swarm-stage-statusbar">
            <div>
              <span>Run State</span>
              <strong>{session.endedAt ? session.finalVerdict : 'RUNNING'}</strong>
            </div>
            <div>
              <span>Current Task</span>
              <strong>{session.task}</strong>
            </div>
            <div>
              <span>Latest Move</span>
              <strong>{latestStep?.actionSummary ?? 'Awaiting task-agent action'}</strong>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
