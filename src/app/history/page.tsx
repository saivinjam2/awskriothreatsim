'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SentinelHeader } from '@/components/sentinel-header';
import { formatDateTime, formatDuration, formatPercent } from '@/lib/sentinel/format';
import { SCENARIOS } from '@/lib/sentinel/scenarios';
import type { AttackFamily, Difficulty, FinalVerdict, SentinelSession } from '@/lib/sentinel/types';

const VERDICT_OPTIONS: Array<{ value: '' | FinalVerdict; label: string }> = [
  { value: '',               label: 'All verdicts' },
  { value: 'SAFE_SUCCESS',  label: 'Safe — Task completed' },
  { value: 'SAFE_ABORT',    label: 'Safe — Agent aborted' },
  { value: 'UNSAFE_SUCCESS', label: 'Unsafe — Attack succeeded' },
  { value: 'UNSAFE_FAILURE', label: 'Unsafe — Both failed' },
];

const VERDICT_COLORS: Record<string, string> = {
  SAFE_SUCCESS:  '#4ade80',
  SAFE_ABORT:    '#22d3ee',
  UNSAFE_SUCCESS: '#f97316',
  UNSAFE_FAILURE: '#ef4444',
};

export default function HistoryPage() {
  const [sessions, setSessions]               = useState<SentinelSession[]>([]);
  const [scenarioFilter, setScenarioFilter]   = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [verdictFilter, setVerdictFilter]     = useState<'' | FinalVerdict>('');
  const [attackFamilyFilter, setAttackFamilyFilter] = useState<'' | AttackFamily>('');

  useEffect(() => {
    void fetch('/api/sentinel/sessions', { cache: 'no-store' })
      .then((r) => r.json())
      .then((p: { sessions: SentinelSession[] }) => setSessions(p.sessions))
      .catch(() => setSessions([]));
  }, []);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (scenarioFilter && s.scenarioId !== scenarioFilter) return false;
      if (difficultyFilter && s.difficulty !== difficultyFilter) return false;
      if (verdictFilter && s.finalVerdict !== verdictFilter) return false;
      if (attackFamilyFilter) {
        const families = new Set(s.redTeamActions.map((a) => a.attackFamily));
        if (!families.has(attackFamilyFilter)) return false;
      }
      return true;
    });
  }, [sessions, scenarioFilter, difficultyFilter, verdictFilter, attackFamilyFilter]);

  const chartData = useMemo(() => {
    const map = new Map<string, { safe: number; unsafe: number }>();
    for (const s of filtered) {
      const cur = map.get(s.scenarioLabel) ?? { safe: 0, unsafe: 0 };
      if (s.finalVerdict === 'SAFE_SUCCESS' || s.finalVerdict === 'SAFE_ABORT') cur.safe++;
      else cur.unsafe++;
      map.set(s.scenarioLabel, cur);
    }
    return Array.from(map.entries()).map(([scenario, c]) => ({ scenario, safe: c.safe, unsafe: c.unsafe }));
  }, [filtered]);

  const overview = useMemo(() => {
    const total = filtered.length;
    return {
      total,
      safeRate:     total ? filtered.filter((s) => s.finalVerdict === 'SAFE_SUCCESS').length / total : 0,
      attackRate:   total ? filtered.filter((s) => s.attackSucceeded).length / total : 0,
      recoveryRate: total ? filtered.filter((s) => s.recoveryOccurred).length / total : 0,
    };
  }, [filtered]);

  const selStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem', background: 'var(--bg2)',
    border: '1px solid var(--border2)', borderRadius: 8,
    color: 'var(--tx)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none',
    appearance: 'none', cursor: 'pointer',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 'min(1200px, calc(100% - 2rem))', margin: '0 auto', paddingBottom: '6rem' }}>
        <SentinelHeader />

        {/* Page header */}
        <div style={{ padding: '2rem 0 1.5rem' }} className="fade-in">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--tx)', letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
            Run Results
          </h1>
          <p style={{ fontSize: 14, color: 'var(--tx3)' }}>
            Filter, compare, and replay past simulation runs.
          </p>
        </div>

        {/* Filters */}
        <div style={{
          background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12,
          padding: '1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
        }} className="fade-in">
          <select value={scenarioFilter} onChange={(e) => setScenarioFilter(e.target.value)} style={selStyle}>
            <option value="">All scenarios</option>
            {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value as Difficulty | '')} style={selStyle}>
            <option value="">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select value={verdictFilter} onChange={(e) => setVerdictFilter(e.target.value as '' | FinalVerdict)} style={selStyle}>
            {VERDICT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={attackFamilyFilter} onChange={(e) => setAttackFamilyFilter(e.target.value as '' | AttackFamily)} style={selStyle}>
            <option value="">All attack types</option>
            <option value="prompt_injection">Prompt Injection</option>
            <option value="ui_deception">UI Deception</option>
            <option value="task_diversion">Task Diversion</option>
            <option value="data_exfil_bait">Data Exfil Bait</option>
          </select>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1rem' }} className="fade-in">
          <StatCard label="Total runs" value={String(overview.total)} color="var(--accent)" />
          <StatCard label="Safe completion" value={formatPercent(overview.safeRate)} color="var(--green)" />
          <StatCard label="Attack success" value={formatPercent(overview.attackRate)} color="var(--red)" />
          <StatCard label="Recovery rate" value={formatPercent(overview.recoveryRate)} color="var(--orange)" />
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div style={{
            background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12,
            padding: '1.25rem', marginBottom: '1rem',
          }} className="fade-in">
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>
              Safe vs Unsafe outcomes by scenario
            </p>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="scenario" stroke="var(--tx3)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--tx3)" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                    cursor={{ fill: 'var(--bg4)' }}
                  />
                  <Bar dataKey="safe"   name="Safe"   fill="#4ade80" radius={[4,4,0,0]} />
                  <Bar dataKey="unsafe" name="Unsafe" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{
          background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12,
          overflow: 'hidden',
        }} className="fade-in">
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>
              {filtered.length} run{filtered.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--tx3)', fontSize: 14 }}>
              No runs found.{' '}
              <Link href="/configure" style={{ color: 'var(--accent)', fontWeight: 600 }}>Start a test</Link>
              {' '}to see results here.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg2)' }}>
                    {['Time', 'Scenario', 'Task', 'Attack', 'Verdict', 'Duration'].map((h) => (
                      <th key={h} style={{
                        padding: '0.625rem 1rem', textAlign: 'left',
                        fontSize: 11, fontWeight: 600, color: 'var(--tx3)',
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                        borderBottom: '1px solid var(--border)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => {
                    const verdictColor = VERDICT_COLORS[s.finalVerdict ?? ''] ?? 'var(--tx3)';
                    return (
                      <tr key={s.gameId} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--tx3)', whiteSpace: 'nowrap' }}>
                          {formatDateTime(s.startedAt)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Link href={`/history/${s.gameId}`} style={{ color: 'var(--accent)', fontWeight: 500 }}>
                            {s.scenarioLabel}
                          </Link>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: 12, fontWeight: 600,
                            color: s.taskCompleted ? 'var(--green)' : 'var(--tx3)',
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.taskCompleted ? 'var(--green)' : 'var(--tx3)', display: 'inline-block' }} />
                            {s.taskCompleted ? 'Completed' : 'Incomplete'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            fontSize: 12, fontWeight: 600,
                            color: s.attackSucceeded ? 'var(--red)' : 'var(--green)',
                          }}>
                            {s.attackSucceeded ? 'Succeeded' : 'Blocked'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)',
                            padding: '2px 8px', borderRadius: 999,
                            background: `${verdictColor}18`, color: verdictColor,
                            border: `1px solid ${verdictColor}33`,
                          }}>
                            {s.finalVerdict}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--tx3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                          {formatDuration(s.durationSeconds)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '1.1rem 1.25rem',
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '1.75rem', fontWeight: 800, color, fontFamily: 'var(--mono)', lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}
