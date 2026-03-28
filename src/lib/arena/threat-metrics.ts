import { ARENA_ATTACK_FAMILIES } from '@/lib/arena/attack-family';
import type { SwarmTimelineEntry } from '@/lib/arena/attack-visualization';
import type { SentinelSession } from '@/lib/sentinel/types';

export interface ThreatMetricRow {
  family: SwarmTimelineEntry['attackFamily'];
  label: string;
  persona: string;
  color: string;
  active: number;
  blocked: number;
  successful: number;
  escalated: number;
  immunity: number;
  total: number;
  enabled: boolean;
}

export interface SwarmArenaMetrics {
  rows: ThreatMetricRow[];
  totals: {
    active: number;
    blocked: number;
    successful: number;
    escalated: number;
    observed: number;
  };
  stepCount: number;
  runStatus: 'running' | 'complete';
  blockedCount: number;
  breachLikeCount: number;
  activeThreats: number;
  promptHealthScore: number;
  safetyScore: number;
}

export function buildThreatMetrics(session: SentinelSession, timeline: SwarmTimelineEntry[]): SwarmArenaMetrics {
  const rows = ARENA_ATTACK_FAMILIES.map((family) => {
    const familyEntries = timeline.filter((entry) => entry.attackFamily === family.family);
    const active = familyEntries.filter((entry) => entry.outcome === 'active').length;
    const blocked = familyEntries.filter((entry) => entry.outcome === 'blocked').length;
    const successful = familyEntries.filter((entry) => entry.outcome === 'successful').length;
    const escalated = familyEntries.filter((entry) => entry.outcome === 'escalated').length;
    const total = familyEntries.length;
    const immunity = total > 0 ? Math.round((blocked / total) * 100) : 0;

    return {
      family: family.family,
      label: family.shortLabel,
      persona: family.persona,
      color: family.color,
      active,
      blocked,
      successful,
      escalated,
      immunity,
      total,
      enabled: family.enabled,
    };
  });

  const totals = rows.reduce(
    (accumulator, row) => {
      accumulator.active += row.active;
      accumulator.blocked += row.blocked;
      accumulator.successful += row.successful;
      accumulator.escalated += row.escalated;
      accumulator.observed += row.total;
      return accumulator;
    },
    {
      active: 0,
      blocked: 0,
      successful: 0,
      escalated: 0,
      observed: 0,
    },
  );

  return {
    rows,
    totals,
    stepCount: session.currentStep,
    runStatus: session.endedAt ? 'complete' : 'running',
    blockedCount: totals.blocked,
    breachLikeCount: totals.successful + totals.escalated,
    activeThreats: totals.active,
    promptHealthScore: Math.max(0, Math.min(100, session.promptHealth)),
    safetyScore: session.safetyScore,
  };
}
