'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { SwarmArenaShell } from '@/components/arena/swarm-arena-shell';
import { SentinelHeader } from '@/components/sentinel-header';
import { buildViewportAlertState, buildSwarmTimeline } from '@/lib/arena/attack-visualization';
import { buildThreatMetrics } from '@/lib/arena/threat-metrics';
import { buildRedTeamFeedItems, buildTaskAgentFeedItems } from '@/lib/sentinel/duel-feed';
import type { SentinelSession } from '@/lib/sentinel/types';

export function ArenaClient({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<SentinelSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const didRouteToFinish = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const response = await fetch(`/api/sentinel/${gameId}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load session');
        }

        const payload = (await response.json()) as { session: SentinelSession };
        if (cancelled) {
          return;
        }

        setSession(payload.session);
        setError(null);

        if (!payload.session.endedAt) {
          timer = setTimeout(poll, 1_000);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError((fetchError as Error).message);
          timer = setTimeout(poll, 1_500);
        }
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [gameId]);

  useEffect(() => {
    document.body.classList.add('swarm-mode');
    return () => {
      document.body.classList.remove('swarm-mode');
    };
  }, []);

  const latestStep = useMemo(() => {
    if (!session || session.taskAgentSteps.length === 0) {
      return null;
    }
    return session.taskAgentSteps[session.taskAgentSteps.length - 1];
  }, [session]);

  const latestRedAction = useMemo(() => {
    if (!session || session.redTeamActions.length === 0) {
      return null;
    }
    return session.redTeamActions[session.redTeamActions.length - 1];
  }, [session]);

  const promptHealth = useMemo(() => {
    if (!session || typeof session.promptHealth !== 'number') {
      return 100;
    }
    return Math.max(0, Math.min(100, session.promptHealth));
  }, [session]);

  const { ghostHealth, healthPalette, isLow, isCritical, shaking, damagePulseKey } = usePromptHealthBar(promptHealth);
  const healthBarStyle = {
    '--health-fill-start': healthPalette.fillStart,
    '--health-fill-mid': healthPalette.fillMid,
    '--health-fill-end': healthPalette.fillEnd,
    '--health-glow': healthPalette.glow,
    '--health-trail-start': healthPalette.trailStart,
    '--health-trail-end': healthPalette.trailEnd,
    '--health-trail-glow': healthPalette.trailGlow,
    '--health-pulse': healthPalette.pulse,
    '--health-pulse-soft': healthPalette.pulseSoft,
  } as CSSProperties;

  const timeline = useMemo(() => (session ? buildSwarmTimeline(session) : []), [session]);
  const metrics = useMemo(
    () =>
      session
        ? buildThreatMetrics(session, timeline)
        : null,
    [session, timeline],
  );
  const viewportAlert = useMemo(
    () => (session ? buildViewportAlertState(session, timeline) : null),
    [session, timeline],
  );
  const taskFeedItems = useMemo(() => buildTaskAgentFeedItems(session?.taskAgentSteps ?? []), [session?.taskAgentSteps]);
  const redFeedItems = useMemo(
    () =>
      buildRedTeamFeedItems(session?.redTeamActions ?? [], {
        revealPayloads: Boolean(session?.endedAt),
      }),
    [session?.endedAt, session?.redTeamActions],
  );

  useEffect(() => {
    if (!session?.endedAt || didRouteToFinish.current) {
      return;
    }

    didRouteToFinish.current = true;
    const timer = setTimeout(() => {
      router.push(`/finish/${gameId}`);
    }, 1_100);

    return () => {
      clearTimeout(timer);
    };
  }, [gameId, router, session?.endedAt]);

  if (error) {
    return (
      <main className="sentinel-shell swarm-arena-shell">
        <SentinelHeader />
        <section className="card p-6">
          <p className="text-sm text-[var(--red)]">{error}</p>
          <Link href="/" className="mt-3 inline-block text-sm text-[var(--accent)]">
            Return to lobby
          </Link>
        </section>
      </main>
    );
  }

  if (!session || !metrics || !viewportAlert) {
    return (
      <main className="sentinel-shell swarm-arena-shell">
        <SentinelHeader />
        <section className="card p-6 text-sm text-[var(--text-muted)]">Loading swarm arena...</section>
      </main>
    );
  }

  return (
    <main className="sentinel-shell swarm-arena-shell">
      <SentinelHeader />
      <SwarmArenaShell
        gameId={gameId}
        session={session}
        latestStep={latestStep}
        latestRedAction={latestRedAction}
        timeline={timeline}
        metrics={metrics}
        viewportAlert={viewportAlert}
        taskFeedItems={taskFeedItems}
        redFeedItems={redFeedItems}
        promptHealth={promptHealth}
        ghostHealth={ghostHealth}
        healthBarStyle={healthBarStyle}
        isLow={isLow}
        isCritical={isCritical}
        shaking={shaking}
        damagePulseKey={damagePulseKey}
      />
    </main>
  );
}

type PromptHealthPalette = {
  fillStart: string;
  fillMid: string;
  fillEnd: string;
  glow: string;
  trailStart: string;
  trailEnd: string;
  trailGlow: string;
  pulse: string;
  pulseSoft: string;
};

function usePromptHealthBar(health: number) {
  const [ghostHealth, setGhostHealth] = useState(health);
  const [shaking, setShaking] = useState(false);
  const [damagePulseKey, setDamagePulseKey] = useState(0);
  const previous = useRef(health);
  const ghostTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (ghostTimer.current) {
      clearTimeout(ghostTimer.current);
      ghostTimer.current = null;
    }

    if (health >= previous.current) {
      previous.current = health;
      const syncFrame = requestAnimationFrame(() => {
        if (!cancelled) {
          setGhostHealth(health);
        }
      });

      return () => {
        cancelled = true;
        cancelAnimationFrame(syncFrame);
      };
    }

    previous.current = health;
    const shakeFrame = requestAnimationFrame(() => {
      if (!cancelled) {
        setDamagePulseKey((value) => value + 1);
        setShaking(true);
      }
    });
    const shakeTimer = setTimeout(() => {
      if (!cancelled) {
        setShaking(false);
      }
    }, 240);
    ghostTimer.current = setTimeout(() => {
      if (!cancelled) {
        setGhostHealth(health);
      }
      ghostTimer.current = null;
    }, 180);

    return () => {
      cancelled = true;
      cancelAnimationFrame(shakeFrame);
      clearTimeout(shakeTimer);
      if (ghostTimer.current) {
        clearTimeout(ghostTimer.current);
        ghostTimer.current = null;
      }
    };
  }, [health]);

  const healthPalette = getPromptHealthPalette(health);
  const isLow = health <= 40;
  const isCritical = health <= 25;

  return { ghostHealth, healthPalette, isLow, isCritical, shaking, damagePulseKey };
}

function getPromptHealthPalette(health: number): PromptHealthPalette {
  if (health >= 100) {
    return {
      fillStart: '#baff9a',
      fillMid: '#72ff7f',
      fillEnd: '#20d95a',
      glow: 'rgba(114, 255, 127, 0.34)',
      trailStart: 'rgba(154, 255, 164, 0.32)',
      trailEnd: 'rgba(114, 255, 127, 0.68)',
      trailGlow: 'rgba(114, 255, 127, 0.22)',
      pulse: 'rgba(191, 255, 154, 0.72)',
      pulseSoft: 'rgba(236, 255, 227, 0.34)',
    };
  }

  if (health > 60) {
    return {
      fillStart: '#9dff81',
      fillMid: '#58f06d',
      fillEnd: '#1cb851',
      glow: 'rgba(88, 240, 109, 0.32)',
      trailStart: 'rgba(140, 255, 154, 0.34)',
      trailEnd: 'rgba(88, 240, 109, 0.68)',
      trailGlow: 'rgba(88, 240, 109, 0.22)',
      pulse: 'rgba(178, 255, 161, 0.7)',
      pulseSoft: 'rgba(233, 255, 228, 0.32)',
    };
  }

  if (health > 30) {
    return {
      fillStart: '#fff8a8',
      fillMid: '#ffe600',
      fillEnd: '#ffb300',
      glow: 'rgba(255, 230, 0, 0.32)',
      trailStart: 'rgba(255, 241, 107, 0.34)',
      trailEnd: 'rgba(255, 230, 0, 0.7)',
      trailGlow: 'rgba(255, 230, 0, 0.22)',
      pulse: 'rgba(255, 243, 140, 0.74)',
      pulseSoft: 'rgba(255, 250, 214, 0.34)',
    };
  }

  return {
    fillStart: '#ff8ba7',
    fillMid: '#ff3366',
    fillEnd: '#c2003f',
    glow: 'rgba(255, 51, 102, 0.36)',
    trailStart: 'rgba(255, 142, 170, 0.36)',
    trailEnd: 'rgba(255, 51, 102, 0.74)',
    trailGlow: 'rgba(255, 51, 102, 0.26)',
    pulse: 'rgba(255, 158, 185, 0.78)',
    pulseSoft: 'rgba(255, 224, 233, 0.36)',
  };
}
