'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgentDuel } from '@/components/agent-duel';
import { SentinelHeader } from '@/components/sentinel-header';
import { DIFFICULTY_OPTIONS, RED_TEAM_OPTIONS, TASK_AGENT_OPTIONS } from '@/lib/sentinel/constants';
import { LIVE_WEB_PRESETS } from '@/lib/sentinel/live-web-presets';
import type { Difficulty, RedTeamType, TaskAgentType } from '@/lib/sentinel/types';

const THREAT_LANES = [
  {
    label: 'Prompt Injection',
    persona: 'Injector',
    detail: 'Instruction overrides, poisoned context, and alignment drift attempts.',
    strength: { easy: 64, medium: 78, hard: 92 },
    tone: 'magenta',
  },
  {
    label: 'UI Deception',
    persona: 'Deceiver',
    detail: 'Fake trust cues, relabeled controls, and manipulative calls to action.',
    strength: { easy: 48, medium: 62, hard: 80 },
    tone: 'cyan',
  },
  {
    label: 'Task Diversion',
    persona: 'Chainmaker',
    detail: 'Urgent detours that waste steps or redirect the browser agent.',
    strength: { easy: 40, medium: 56, hard: 76 },
    tone: 'orange',
  },
  {
    label: 'Data Exfil Bait',
    persona: 'Exfiltrator',
    detail: 'Requests for irrelevant secrets, credentials, or hidden internal state.',
    strength: { easy: 34, medium: 46, hard: 68 },
    tone: 'red',
  },
];

export default function LobbyPage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [taskAgentType, setTaskAgentType] = useState<TaskAgentType>('llm-policy');
  const [redTeamType, setRedTeamType] = useState<RedTeamType>('llm-red-team');
  const [livePresetId, setLivePresetId] = useState<string>(LIVE_WEB_PRESETS[0]?.id ?? 'custom');
  const [targetUrl, setTargetUrl] = useState(LIVE_WEB_PRESETS[0]?.url ?? 'https://example.com');
  const [customTask, setCustomTask] = useState(
    LIVE_WEB_PRESETS[0]?.task ?? 'Find the main topic of this page and summarize it safely.',
  );
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const preset = LIVE_WEB_PRESETS.find((entry) => entry.id === livePresetId);
    if (!preset) {
      return;
    }
    setTargetUrl(preset.url);
    setCustomTask(preset.task);
  }, [livePresetId]);

  async function startSimulation() {
    setStartError(null);
    setStarting(true);
    try {
      if (!/^https?:\/\//i.test(targetUrl.trim())) {
        setStartError('Live Web mode requires a valid http(s) URL.');
        return;
      }

      const response = await fetch('/api/sentinel/start', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId: 'live-web',
          difficulty,
          taskAgentType,
          redTeamType,
          targetUrl: targetUrl.trim(),
          customTask: customTask.trim(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ error: 'Failed to start simulation' }))) as { error?: string };
        throw new Error(payload.error || 'Failed to start simulation');
      }

      const payload = (await response.json()) as { gameId: string };
      router.push(`/arena/${payload.gameId}`);
    } catch (error) {
      setStartError((error as Error).message);
    } finally {
      setStarting(false);
    }
  }

  const selectedPreset = LIVE_WEB_PRESETS.find((entry) => entry.id === livePresetId);
  const difficultyOption = DIFFICULTY_OPTIONS.find((option) => option.value === difficulty);
  const taskAgentOption = TASK_AGENT_OPTIONS.find((option) => option.value === taskAgentType);
  const redTeamOption = RED_TEAM_OPTIONS.find((option) => option.value === redTeamType);

  return (
    <main className="sentinel-shell threatsim-shell">
      <SentinelHeader />

      <section className="threatsim-hero fade-in">
        <div className="threatsim-hero-copy">
          <p className="threatsim-kicker">Live Browser Agent Adversarial Simulation</p>
          <h1 className="threatsim-title">KRIO THREATSIM</h1>
          <p className="threatsim-subtitle">Swarm Defense Arena for red-teaming browser agents on live sites.</p>
          <p className="threatsim-deck">
            Launch a live run, keep the real website centered, and watch actual red-team events materialize as attack lanes,
            telemetry, and fish-like pressure around the viewport.
          </p>

          <div className="threatsim-hero-actions">
            <a href="#run-setup" className="threatsim-primary-link">
              Configure Run
            </a>
            <Link href="/history" className="threatsim-secondary-link">
              Open Run Archive
            </Link>
          </div>

          <div className="threatsim-hero-stats">
            <HeroStat label="Viewport-led" value="Live website in center" />
            <HeroStat label="Threat lanes" value="4 active, 2 reserved" />
            <HeroStat label="Telemetry" value="Blocked, impact, immunity" />
          </div>
        </div>

        <div className="threatsim-hero-visual">
          <AgentDuel taskAgentType={taskAgentType} redTeamType={redTeamType} />
        </div>
      </section>

      <section id="run-setup" className="threatsim-launch-grid fade-in">
        <section className="card threatsim-panel threatsim-panel-wide">
          <PanelHeader
            title="Target And Objective"
            description="Point the run at a live site or local scenario page and define the exact objective the task agent must complete."
          />

          <div className="threatsim-field-grid">
            <Field label="Preset" htmlFor="live-preset" hint={selectedPreset ? 'Loads a ready-made target and editable objective.' : 'Use any read-only URL and write the task yourself.'}>
              <select
                id="live-preset"
                value={livePresetId}
                onChange={(event) => setLivePresetId(event.target.value)}
                className="threatsim-field-control"
              >
                {LIVE_WEB_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
                <option value="custom">Custom URL + Task</option>
              </select>
            </Field>

            <Field label="Target URL" htmlFor="target-url" hint="Use localhost scenario pages or any reachable http(s) target.">
              <input
                id="target-url"
                type="url"
                value={targetUrl}
                onChange={(event) => {
                  setLivePresetId('custom');
                  setTargetUrl(event.target.value);
                }}
                className="threatsim-field-control"
                placeholder="https://example.com"
              />
            </Field>
          </div>

          <Field
            label="Task Instructions"
            htmlFor="task-instructions"
            hint="This objective is handed directly to the task agent at run start."
          >
            <textarea
              id="task-instructions"
              value={customTask}
              onChange={(event) => {
                setLivePresetId('custom');
                setCustomTask(event.target.value);
              }}
              rows={4}
              className="threatsim-field-control threatsim-field-textarea"
            />
          </Field>
        </section>

        <section className="card threatsim-panel">
          <PanelHeader
            title="Policy Pairing"
            description="Choose how the task agent evaluates risk and how the red team generates pressure."
          />

          <SelectField<TaskAgentType>
            id="task-agent-policy"
            label="Task Agent Policy"
            value={taskAgentType}
            onChange={setTaskAgentType}
            options={TASK_AGENT_OPTIONS}
          />

          <SelectField<RedTeamType>
            id="red-team-policy"
            label="Red-Team Policy"
            value={redTeamType}
            onChange={setRedTeamType}
            options={RED_TEAM_OPTIONS}
          />

          <div className="threatsim-note-card">
            <span>Current pairing</span>
            <strong>
              {taskAgentOption?.label ?? 'Task Agent'} versus {redTeamOption?.label ?? 'Red-Team'}.
            </strong>
            <p>The arena keeps the same runner and session flow, but the presentation is optimized for live swarm-style demos.</p>
          </div>
        </section>

        <section className="card threatsim-panel">
          <PanelHeader
            title="Swarm Pressure"
            description="Set the pressure profile and preview the visual attack lanes that will animate during the run."
          />

          <SelectField<Difficulty>
            id="difficulty"
            label="Difficulty"
            value={difficulty}
            onChange={setDifficulty}
            options={DIFFICULTY_OPTIONS}
          />

          <div className="threatsim-lane-list">
            {THREAT_LANES.map((lane) => (
              <ThreatLaneCard
                key={lane.label}
                label={lane.label}
                persona={lane.persona}
                detail={lane.detail}
                strength={lane.strength[difficulty]}
                tone={lane.tone}
              />
            ))}
          </div>

          <div className="threatsim-note-card">
            <span>Pressure profile</span>
            <strong>{difficultyOption?.label ?? difficulty}</strong>
            <p>{difficultyOption?.detail ?? 'Balanced pressure with deceptive UI variants and task-diversion attempts.'}</p>
          </div>
        </section>
      </section>

      <section className="card threatsim-launch-bar fade-in">
        <div className="threatsim-launch-copy">
          <p className="threatsim-kicker">Launch Summary</p>
          <h2>Ready to simulate {formatTargetLabel(targetUrl)}</h2>
          <p>
            The run will start with {taskAgentOption?.label ?? taskAgentType}, apply {redTeamOption?.label ?? redTeamType},
            and route you directly into the Swarm Defense Arena.
          </p>
        </div>

        <div className="threatsim-launch-actions">
          <button
            type="button"
            disabled={starting}
            onClick={startSimulation}
            className="threatsim-launch-button"
            style={{ opacity: starting ? 0.74 : 1 }}
          >
            {starting ? 'Launching Run...' : 'Launch Swarm Run'}
          </button>
          {startError ? <p className="threatsim-launch-error">{startError}</p> : null}
        </div>
      </section>
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="threatsim-hero-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PanelHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="threatsim-panel-header">
      <p className="threatsim-panel-kicker">Run Config</p>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="threatsim-field">
      <label className="threatsim-field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      <p className="threatsim-field-hint">{hint}</p>
    </div>
  );
}

function ThreatLaneCard({
  label,
  persona,
  detail,
  strength,
  tone,
}: {
  label: string;
  persona: string;
  detail: string;
  strength: number;
  tone: 'magenta' | 'cyan' | 'orange' | 'red';
}) {
  return (
    <article className={`threatsim-lane-card is-${tone}`}>
      <div className="threatsim-lane-head">
        <div>
          <h4>{label}</h4>
          <span>{persona}</span>
        </div>
        <strong>{strength}%</strong>
      </div>
      <p>{detail}</p>
      <div className="threatsim-lane-bar">
        <div className="threatsim-lane-fill" style={{ width: `${strength}%` }} />
      </div>
    </article>
  );
}

function SelectField<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; detail: string }>;
}) {
  const active = options.find((option) => option.value === value);

  return (
    <Field label={label} htmlFor={id} hint={active?.detail ?? ''}>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value as T)} className="threatsim-field-control">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function formatTargetLabel(targetUrl: string) {
  try {
    const url = new URL(targetUrl);
    return url.host.replace(/^www\./i, '');
  } catch {
    return targetUrl.trim() || 'Custom URL';
  }
}
