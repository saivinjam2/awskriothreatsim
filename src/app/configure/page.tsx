'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SentinelHeader } from '@/components/sentinel-header';
import { LIVE_WEB_PRESETS } from '@/lib/sentinel/live-web-presets';
import type { Difficulty, RedTeamType, TaskAgentType } from '@/lib/sentinel/types';

const STEPS = ['Target', 'Difficulty', 'Agents', 'Review'];

// Plain-English difficulty options
const DIFFICULTY_CARDS: Array<{
  value: Difficulty;
  label: string;
  badge: string;
  desc: string;
  attacks: string[];
  color: string;
}> = [
  {
    value: 'easy',
    label: 'Light pressure',
    badge: 'Easy',
    desc: 'Infrequent, predictable attacks. Good for a first test or to verify basic behavior.',
    attacks: ['Occasional prompt injection', 'Simple fake buttons', 'Low-pressure distractions'],
    color: '#4ade80',
  },
  {
    value: 'medium',
    label: 'Moderate pressure',
    badge: 'Medium',
    desc: 'Realistic attack cadence. Recommended for most tests.',
    attacks: ['Mixed attack types', 'Deceptive UI elements', 'Task diversion attempts'],
    color: '#f97316',
  },
  {
    value: 'hard',
    label: 'Full assault',
    badge: 'Hard',
    desc: 'Relentless, adaptive attacks. Only for agents that need serious stress-testing.',
    attacks: ['Rapid multi-vector attacks', 'Convincing fake interfaces', 'Data theft traps'],
    color: '#ef4444',
  },
];

// Plain-English agent options
const AGENT_PAIRS: Array<{
  taskValue: TaskAgentType;
  redValue: RedTeamType;
  label: string;
  desc: string;
  defender: string;
  attacker: string;
  recommended?: boolean;
}> = [
  {
    taskValue: 'llm-policy',
    redValue: 'llm-red-team',
    label: 'AI vs AI',
    desc: 'Both agents use a real language model. The most realistic and challenging pairing.',
    defender: 'LLM with risk awareness',
    attacker: 'LLM red-team',
    recommended: true,
  },
  {
    taskValue: 'risk-aware',
    redValue: 'rule-based-adaptive',
    label: 'Smart vs Adaptive',
    desc: 'The defender uses rule-based risk scoring; the attacker adapts based on what it sees.',
    defender: 'Risk-aware rules',
    attacker: 'Adaptive scripted',
  },
  {
    taskValue: 'safe-rule-based',
    redValue: 'static-scripted',
    label: 'Cautious vs Scripted',
    desc: 'Fully deterministic — great for reproducing exact scenarios or debugging.',
    defender: 'Safe rule-based',
    attacker: 'Static scripted',
  },
  {
    taskValue: 'naive',
    redValue: 'static-scripted',
    label: 'No defenses',
    desc: 'The agent has no protection. Use this to see what a completely unguarded AI does.',
    defender: 'Naive (no protection)',
    attacker: 'Static scripted',
  },
];

export default function ConfigurePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1 — Target
  const [presetId, setPresetId] = useState<string>(LIVE_WEB_PRESETS[0]?.id ?? 'custom');
  const [targetUrl, setTargetUrl] = useState(LIVE_WEB_PRESETS[0]?.url ?? '');
  const [task, setTask] = useState(LIVE_WEB_PRESETS[0]?.task ?? '');
  const [urlError, setUrlError] = useState('');

  // Step 2 — Difficulty
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // Step 3 — Agents
  const [agentPairIdx, setAgentPairIdx] = useState(0);

  // Launch
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState('');

  useEffect(() => {
    const preset = LIVE_WEB_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setTargetUrl(preset.url);
    setTask(preset.task);
  }, [presetId]);

  function validateTarget() {
    if (!targetUrl.trim()) { setUrlError('Please enter a URL.'); return false; }
    if (!/^https?:\/\//i.test(targetUrl.trim())) { setUrlError('URL must start with http:// or https://'); return false; }
    if (!task.trim()) { setUrlError('Please describe what the agent should do.'); return false; }
    setUrlError('');
    return true;
  }

  function next() {
    if (step === 0 && !validateTarget()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() { setStep((s) => Math.max(s - 1, 0)); }

  async function launch() {
    setLaunching(true);
    setLaunchError('');
    const pair = AGENT_PAIRS[agentPairIdx]!;
    try {
      const res = await fetch('/api/sentinel/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scenarioId: 'live-web',
          difficulty,
          taskAgentType: pair.taskValue,
          redTeamType: pair.redValue,
          targetUrl: targetUrl.trim(),
          customTask: task.trim(),
        }),
      });
      if (!res.ok) {
        const p = await res.json().catch(() => ({ error: 'Failed' })) as { error?: string };
        throw new Error(p.error || 'Failed to start');
      }
      const p = await res.json() as { gameId: string };
      router.push(`/arena/${p.gameId}`);
    } catch (e) {
      setLaunchError((e as Error).message);
      setLaunching(false);
    }
  }

  const pair = AGENT_PAIRS[agentPairIdx]!;
  const diff = DIFFICULTY_CARDS.find((d) => d.value === difficulty)!;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 'min(760px, calc(100% - 2rem))', margin: '0 auto', paddingBottom: '6rem' }}>
        <SentinelHeader />

        {/* Back link */}
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--tx3)', margin: '1.5rem 0 2rem' }}>
          ← Back to home
        </Link>

        {/* Progress stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: i < STEPS.length - 1 ? 1 : undefined }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: i < step ? 'pointer' : 'default',
              }} onClick={() => i < step && setStep(i)}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: i === step ? 'var(--accent)' : i < step ? 'var(--green-dim)' : 'var(--bg4)',
                  border: `1px solid ${i === step ? 'var(--accent)' : i < step ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`,
                  color: i === step ? '#fff' : i < step ? 'var(--green)' : 'var(--tx3)',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: i === step ? 600 : 400, color: i <= step ? 'var(--tx)' : 'var(--tx3)', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: i < step ? 'var(--green)' : 'var(--border)', minWidth: 24, opacity: i < step ? 0.4 : 1 }} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 0: Target ── */}
        {step === 0 && (
          <div className="fade-in">
            <StepHeading
              title="Where should the agent go?"
              desc="Pick a website and describe what the AI should try to do there."
            />

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Choose a preset or enter your own</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.625rem', marginBottom: '1rem' }}>
                {LIVE_WEB_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPresetId(p.id)}
                    style={{
                      ...presetBtnStyle,
                      borderColor: presetId === p.id ? 'var(--accent)' : 'var(--border)',
                      background: presetId === p.id ? 'var(--accent-dim)' : 'var(--bg3)',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', display: 'block', marginBottom: 2 }}>{p.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--tx3)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.url}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setPresetId('custom'); setTargetUrl(''); setTask(''); }}
                  style={{
                    ...presetBtnStyle,
                    borderColor: presetId === 'custom' ? 'var(--accent)' : 'var(--border)',
                    background: presetId === 'custom' ? 'var(--accent-dim)' : 'var(--bg3)',
                    borderStyle: 'dashed',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', display: 'block', marginBottom: 2 }}>Custom URL</span>
                  <span style={{ fontSize: 11, color: 'var(--tx3)' }}>Enter your own</span>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle} htmlFor="target-url">Target website URL</label>
              <input
                id="target-url"
                type="url"
                value={targetUrl}
                onChange={(e) => { setPresetId('custom'); setTargetUrl(e.target.value); setUrlError(''); }}
                placeholder="https://example.com"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <label style={labelStyle} htmlFor="task">What should the agent do?</label>
              <p style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: '0.5rem' }}>
                Write this in plain English. Example: "Search for blue running shoes and add the cheapest one to the cart."
              </p>
              <textarea
                id="task"
                value={task}
                onChange={(e) => { setPresetId('custom'); setTask(e.target.value); setUrlError(''); }}
                rows={3}
                placeholder="Describe the task the agent should complete..."
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }}
              />
            </div>

            {urlError && <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: '1rem' }}>{urlError}</p>}
          </div>
        )}

        {/* ── Step 1: Difficulty ── */}
        {step === 1 && (
          <div className="fade-in">
            <StepHeading
              title="How hard should the attacker push?"
              desc="This controls how aggressive the AI attacker is. You can always run again with a different setting."
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {DIFFICULTY_CARDS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  style={{
                    ...diffCardStyle,
                    borderColor: difficulty === d.value ? d.color : 'var(--border)',
                    background: difficulty === d.value ? `${d.color}12` : 'var(--bg3)',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)' }}>{d.label}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                      background: `${d.color}22`, color: d.color, border: `1px solid ${d.color}44`,
                    }}>{d.badge}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: '0.75rem', lineHeight: 1.55 }}>{d.desc}</p>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {d.attacks.map((a) => (
                      <li key={a} style={{ fontSize: 12, color: 'var(--tx3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: d.color, flexShrink: 0, display: 'inline-block' }} />
                        {a}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Agents ── */}
        {step === 2 && (
          <div className="fade-in">
            <StepHeading
              title="How smart are the agents?"
              desc="Pick how the defender and attacker think. AI vs AI is the most realistic. Rule-based is faster and fully reproducible."
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {AGENT_PAIRS.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setAgentPairIdx(i)}
                  style={{
                    ...diffCardStyle,
                    borderColor: agentPairIdx === i ? 'var(--accent)' : 'var(--border)',
                    background: agentPairIdx === i ? 'var(--accent-dim)' : 'var(--bg3)',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)' }}>{p.label}</span>
                    {p.recommended && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                        background: 'var(--accent-dim)', color: 'var(--accent)',
                        border: '1px solid rgba(99,102,241,0.25)',
                      }}>Recommended</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--tx3)', marginBottom: '0.625rem', lineHeight: 1.55 }}>{p.desc}</p>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <AgentTag role="Defender" value={p.defender} color="var(--accent)" />
                    <AgentTag role="Attacker" value={p.attacker} color="var(--red)" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <div className="fade-in">
            <StepHeading
              title="Ready to launch"
              desc="Review your settings and start the simulation. You'll be taken to the live arena."
            />

            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 14,
              overflow: 'hidden', marginBottom: '1.5rem',
            }}>
              <ReviewRow label="Target website" value={formatHost(targetUrl)} />
              <ReviewRow label="Task" value={task} />
              <ReviewRow label="Attack intensity" value={`${diff.label} (${diff.badge})`} />
              <ReviewRow label="Agent pairing" value={pair.label} last />
            </div>

            {launchError && (
              <div style={{
                background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, padding: '0.875rem 1rem', marginBottom: '1rem',
                fontSize: 13, color: 'var(--red)',
              }}>
                {launchError}
              </div>
            )}

            <button
              type="button"
              onClick={launch}
              disabled={launching}
              style={{
                width: '100%', padding: '0.875rem', background: 'var(--accent)', color: '#fff',
                fontSize: 15, fontWeight: 700, border: 'none', borderRadius: 10, cursor: launching ? 'not-allowed' : 'pointer',
                opacity: launching ? 0.6 : 1, boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'var(--font)',
              }}
            >
              {launching ? (
                <>
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Launching simulation…
                </>
              ) : (
                'Launch Simulation →'
              )}
            </button>
          </div>
        )}

        {/* ── Nav Buttons ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '0.75rem' }}>
          {step > 0 ? (
            <button type="button" onClick={back} style={secondaryBtnStyle}>
              ← Back
            </button>
          ) : <div />}

          {step < STEPS.length - 1 && (
            <button type="button" onClick={next} style={primaryBtnStyle}>
              Continue →
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────── */

function StepHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--tx)', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
        {title}
      </h2>
      <p style={{ fontSize: 14, color: 'var(--tx3)', lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function AgentTag({ role, value, color }: { role: string; value: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 7, padding: '0.25rem 0.625rem',
    }}>
      <span style={{ fontSize: 10, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{role}</span>
      <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{value}</span>
    </div>
  );
}

function ReviewRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '0.875rem 1.25rem',
      borderBottom: last ? 'none' : '1px solid var(--border)',
      gap: '1rem',
    }}>
      <span style={{ fontSize: 13, color: 'var(--tx3)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function formatHost(url: string) {
  try { return new URL(url).host.replace(/^www\./i, ''); }
  catch { return url || 'Custom URL'; }
}

/* ── Shared styles ─────────────────────────────────────────────────── */
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--tx2)', marginBottom: '0.5rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.625rem 0.875rem',
  background: 'var(--bg2)', border: '1px solid var(--border2)',
  borderRadius: 8, color: 'var(--tx)', fontFamily: 'var(--font)', fontSize: 13.5,
  outline: 'none',
};

const presetBtnStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', border: '1px solid', borderRadius: 10,
  cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s',
};

const diffCardStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem', border: '2px solid', borderRadius: 12,
  cursor: 'pointer', background: 'var(--bg3)', transition: 'border-color 0.15s, background 0.15s',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '0.65rem 1.75rem', background: 'var(--accent)', color: '#fff',
  fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 999, cursor: 'pointer',
  fontFamily: 'var(--font)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '0.65rem 1.5rem', background: 'transparent',
  border: '1px solid var(--border2)', color: 'var(--tx2)',
  fontSize: 14, fontWeight: 500, borderRadius: 999, cursor: 'pointer',
  fontFamily: 'var(--font)',
};
