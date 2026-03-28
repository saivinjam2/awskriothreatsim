'use client';

import type { CSSProperties } from 'react';
import { formatAttackFamilyLabel } from '@/lib/arena/attack-family';
import type { ThreatMetricRow } from '@/lib/arena/threat-metrics';
import type { AttackFamily } from '@/lib/sentinel/types';

export function SwarmLegend({
  rows,
  activeFamily,
}: {
  rows: ThreatMetricRow[];
  activeFamily?: AttackFamily;
}) {
  return (
    <aside className="card swarm-legend-panel">
      <div className="swarm-panel-head">
        <p className="swarm-panel-kicker">Swarm Signatures</p>
        <h3 className="swarm-panel-title">Attack Lanes</h3>
        <p className="swarm-panel-copy">Real red-team events spawn color-coded fish with persona overlays and lane memory.</p>
      </div>

      <div className="swarm-legend-list">
        {rows.map((row) => (
          <article
            key={row.family}
            className={`swarm-legend-item ${activeFamily === row.family ? 'is-active' : ''} ${!row.enabled ? 'is-future' : ''}`}
            style={{ '--lane-color': row.color } as CSSProperties}
          >
            <div className="swarm-legend-sigil">
              <span className="swarm-legend-dot" />
              <span className="swarm-legend-wave" />
            </div>

            <div className="swarm-legend-copy">
              <div className="swarm-legend-row">
                <h4>{formatAttackFamilyLabel(row.family)}</h4>
                <span>{row.persona}</span>
              </div>
              <p>{row.enabled ? `${row.blocked} blocked, ${row.successful + row.escalated} impacts.` : 'Future-ready lane reserved for follow-on exploit chains.'}</p>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
