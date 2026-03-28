import type { AttackFamily } from '@/lib/sentinel/types';

export type ArenaAttackFamily = AttackFamily | 'mcp_exploit' | 'multi_step_chain';

export interface AttackFamilyVisual {
  family: ArenaAttackFamily;
  label: string;
  shortLabel: string;
  persona: string;
  description: string;
  color: string;
  accent: string;
  glow: string;
  trail: string;
  enabled: boolean;
}

const ATTACK_FAMILY_VISUALS: Record<ArenaAttackFamily, AttackFamilyVisual> = {
  prompt_injection: {
    family: 'prompt_injection',
    label: 'Prompt Injection',
    shortLabel: 'Injection',
    persona: 'Injector',
    description: 'Instruction overrides, jailbreak phrasing, and poisoned context attempts.',
    color: '#ff2f92',
    accent: '#ff7cc0',
    glow: 'rgba(255, 47, 146, 0.34)',
    trail: 'rgba(255, 47, 146, 0.16)',
    enabled: true,
  },
  ui_deception: {
    family: 'ui_deception',
    label: 'UI Deception',
    shortLabel: 'Deception',
    persona: 'Deceiver',
    description: 'Fake CTAs, relabeled controls, and manipulative interface affordances.',
    color: '#1ce7ff',
    accent: '#ffe76c',
    glow: 'rgba(28, 231, 255, 0.34)',
    trail: 'rgba(28, 231, 255, 0.15)',
    enabled: true,
  },
  task_diversion: {
    family: 'task_diversion',
    label: 'Task Diversion',
    shortLabel: 'Diversion',
    persona: 'Chainmaker',
    description: 'Urgent detours that try to redirect the agent away from the objective.',
    color: '#ff9a1f',
    accent: '#ffd178',
    glow: 'rgba(255, 154, 31, 0.3)',
    trail: 'rgba(255, 154, 31, 0.15)',
    enabled: true,
  },
  data_exfil_bait: {
    family: 'data_exfil_bait',
    label: 'Data Exfil Bait',
    shortLabel: 'Exfil',
    persona: 'Exfiltrator',
    description: 'Secret requests, token lures, and bait that pressures unsafe disclosure.',
    color: '#ff4a5f',
    accent: '#ff98a4',
    glow: 'rgba(255, 74, 95, 0.3)',
    trail: 'rgba(255, 74, 95, 0.15)',
    enabled: true,
  },
  mcp_exploit: {
    family: 'mcp_exploit',
    label: 'MCP Exploit',
    shortLabel: 'MCP',
    persona: 'Schema Diver',
    description: 'Reserved lane for auth bypass, tool shadowing, and server-side exploit chains.',
    color: '#89ff5c',
    accent: '#d5ff7d',
    glow: 'rgba(137, 255, 92, 0.28)',
    trail: 'rgba(137, 255, 92, 0.12)',
    enabled: false,
  },
  multi_step_chain: {
    family: 'multi_step_chain',
    label: 'Multi-Step Chain',
    shortLabel: 'Chain',
    persona: 'Pivot Hunter',
    description: 'Reserved lane for staged recon, escalation, and multi-hop attack sequences.',
    color: '#7f8dff',
    accent: '#c7d0ff',
    glow: 'rgba(127, 141, 255, 0.28)',
    trail: 'rgba(127, 141, 255, 0.12)',
    enabled: false,
  },
};

export const ARENA_ATTACK_FAMILIES = Object.values(ATTACK_FAMILY_VISUALS);

export function getAttackFamilyVisual(family: ArenaAttackFamily | string): AttackFamilyVisual {
  return ATTACK_FAMILY_VISUALS[family as ArenaAttackFamily] ?? ATTACK_FAMILY_VISUALS.task_diversion;
}

export function formatAttackFamilyLabel(family: ArenaAttackFamily | string): string {
  return getAttackFamilyVisual(family).label;
}
