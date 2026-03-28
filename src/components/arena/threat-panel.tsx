'use client';

import type { ThreatMetricRow } from '@/lib/arena/threat-metrics';

export function ThreatPanel({
  rows,
  totals,
}: {
  rows: ThreatMetricRow[];
  totals: {
    active: number;
    blocked: number;
    successful: number;
    escalated: number;
    observed: number;
  };
}) {
  return (
    <aside className="card threat-panel-shell">
      <div className="swarm-panel-head">
        <p className="swarm-panel-kicker">Telemetry</p>
        <h3 className="swarm-panel-title">Real-Time Threats</h3>
        <p className="swarm-panel-copy">Live counters are derived from the current run, not decorative filler.</p>
      </div>

      <div className="threat-table">
        <div className="threat-table-head">
          <span />
          <span>Vector</span>
          <span>Active</span>
          <span>Blocked</span>
          <span>Hit</span>
          <span>Immunity</span>
        </div>

        {rows.map((row) => (
          <div key={row.family} className={`threat-table-row ${!row.enabled ? 'is-future' : ''}`}>
            <span className="threat-table-dot" style={{ background: row.color }} />
            <span className="threat-table-name">
              {row.label}
              <small>{row.persona}</small>
            </span>
            <span className="threat-table-value is-active">{row.active}</span>
            <span className="threat-table-value is-blocked">{row.blocked}</span>
            <span className="threat-table-value is-hit">{row.successful + row.escalated}</span>
            <span className="threat-table-immunity">
              <strong>{row.immunity}%</strong>
              <span className="threat-table-bar">
                <span className="threat-table-bar-fill" style={{ width: `${row.immunity}%`, background: row.color }} />
              </span>
            </span>
          </div>
        ))}

        <div className="threat-table-total">
          <span />
          <span>Total</span>
          <span>{totals.active}</span>
          <span>{totals.blocked}</span>
          <span>{totals.successful + totals.escalated}</span>
          <span>{totals.observed > 0 ? `${Math.round((totals.blocked / totals.observed) * 100)}%` : '0%'}</span>
        </div>
      </div>
    </aside>
  );
}
