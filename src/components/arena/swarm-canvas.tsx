'use client';

import { useEffect, useRef } from 'react';
import type { SwarmTimelineEntry } from '@/lib/arena/attack-visualization';

/* ── Types ─────────────────────────────────────────────────────────────── */
type BugRuntime = {
  id: string;
  outcome: SwarmTimelineEntry['outcome'];
  color: string;
  accent: string;
  glow: string;
  trail: string;
  x: number; y: number;
  vx: number; vy: number;
  tx: number; ty: number;
  size: number;
  opacity: number;
  angle: number;
  phase: number;
  legPhase: number;
  resolved: boolean;
  hitAt?: number;
  spawnAt: number;
  trailPoints: { x: number; y: number }[];
};

type Ripple = {
  x: number; y: number;
  radius: number;
  opacity: number;
  r: number; g: number; b: number;
  lineWidth: number;
};

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  alpha: number; decay: number;
  r: number; g: number; b: number;
};

type Lightning = {
  segments: { x: number; y: number }[];
  opacity: number;
  r: number; g: number; b: number;
  width: number;
};

type ScreenFlash = { opacity: number; r: number; g: number; b: number };

type ShieldCrack = {
  angle: number; length: number; opacity: number;
  branches: { angle: number; length: number }[];
};

type Ambient = {
  x: number; y: number; radius: number;
  drift: number; speed: number; alpha: number;
};

const MAX_BUGS    = 18;
const MAX_AMBIENT = 24;

/* ── Component ──────────────────────────────────────────────────────────── */
export function SwarmCanvas({
  events,
  promptHealth,
  paused,
}: {
  events: SwarmTimelineEntry[];
  promptHealth: number;
  paused: boolean;
}) {
  const canvasRef     = useRef<HTMLCanvasElement | null>(null);
  const bugsRef       = useRef<Map<string, BugRuntime>>(new Map());
  const ripplesRef    = useRef<Ripple[]>([]);
  const particlesRef  = useRef<Particle[]>([]);
  const lightningsRef = useRef<Lightning[]>([]);
  const flashRef      = useRef<ScreenFlash | null>(null);
  const cracksRef     = useRef<ShieldCrack[]>([]);
  const ambientRef    = useRef<Ambient[]>([]);
  const seededRef     = useRef(false);
  const radarAngle    = useRef(0);

  /* ── Render loop ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect  = parent.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width  = Math.max(1, Math.floor(rect.width  * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      canvas.style.width  = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (ambientRef.current.length === 0) {
        ambientRef.current = Array.from({ length: MAX_AMBIENT }, () => ({
          x: Math.random() * rect.width,  y: Math.random() * rect.height,
          radius: 0.8 + Math.random() * 2, drift: Math.random() * Math.PI * 2,
          speed: 0.15 + Math.random() * 0.3, alpha: 0.05 + Math.random() * 0.14,
        }));
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement as Element);

    let frame = 0, raf = 0;

    const render = () => {
      frame++;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const shieldR    = Math.min(W, H) * 0.18;
      const healthFrac = Math.max(0, Math.min(1, promptHealth / 100));

      drawHexGrid(ctx, W, H, frame);
      drawAmbient(ctx, W, H, frame);
      drawRadar(ctx, cx, cy, shieldR, healthFrac);
      drawLightnings(ctx);
      drawParticles(ctx);
      drawBugs(ctx, W, H, cx, cy, shieldR, frame, healthFrac);
      drawRipples(ctx);
      drawShieldCracks(ctx, cx, cy, shieldR);
      drawShield(ctx, cx, cy, shieldR, healthFrac, frame);
      drawScreenFlash(ctx, W, H);

      radarAngle.current += 0.018;
      raf = window.requestAnimationFrame(render);
    };

    raf = window.requestAnimationFrame(render);
    return () => { observer.disconnect(); window.cancelAnimationFrame(raf); };
  }, [paused, promptHealth]);

  /* ── Sync events → bugs ───────────────────────────────────────────────── */
  useEffect(() => {
    const recent = !seededRef.current && events.length > 3
      ? events.slice(-3) : events.slice(-MAX_BUGS);
    if (!seededRef.current) seededRef.current = true;

    for (const ev of recent) {
      if (!bugsRef.current.has(ev.id)) {
        bugsRef.current.set(ev.id, createBug(ev, canvasRef.current));
      } else {
        bugsRef.current.get(ev.id)!.outcome = ev.outcome;
      }
    }

    const ids = new Set(events.map(e => e.id));
    for (const [id, b] of bugsRef.current) {
      if (!ids.has(id) && b.resolved) bugsRef.current.delete(id);
    }

    if (bugsRef.current.size > MAX_BUGS) {
      const oldest = [...bugsRef.current.values()].sort((a, b) => a.spawnAt - b.spawnAt);
      for (const b of oldest.slice(0, bugsRef.current.size - MAX_BUGS)) {
        bugsRef.current.delete(b.id);
      }
    }
  }, [events]);

  /* ── Draw helpers ─────────────────────────────────────────────────────── */

  function drawHexGrid(ctx: CanvasRenderingContext2D, W: number, H: number, frame: number) {
    const size = 32;
    const w = size * 2;
    const h = Math.sqrt(3) * size;
    const pulse = 0.025 + Math.sin(frame * 0.025) * 0.012;
    ctx.strokeStyle = `rgba(0, 200, 255, ${pulse})`;
    ctx.lineWidth = 0.5;
    for (let row = -1; row < H / h + 1; row++) {
      for (let col = -1; col < W / w + 1; col++) {
        const xOff = (row % 2 === 0) ? 0 : w * 0.75;
        drawHex(ctx, col * w * 1.5 + xOff, row * h, size * 0.88);
      }
    }
  }

  function drawHex(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      i === 0 ? ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a))
              : ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    ctx.closePath();
    ctx.stroke();
  }

  function drawAmbient(ctx: CanvasRenderingContext2D, W: number, H: number, frame: number) {
    for (const p of ambientRef.current) {
      p.x += Math.cos(p.drift + frame * 0.006) * p.speed;
      p.y -= p.speed * 0.4;
      if (p.x < -20) p.x = W + 20;
      else if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100,220,255,${p.alpha})`;
      ctx.fill();
    }
  }

  function drawRadar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, healthFrac: number) {
    const a     = radarAngle.current;
    const color = healthFrac > 0.5 ? '0,230,255' : healthFrac > 0.25 ? '255,165,0' : '255,50,50';

    [[r * 2.8, 0.06], [r * 1.9, 0.09]].forEach(([rad, alpha]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color},${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    const sweep = ctx.createLinearGradient(0, 0, r * 2.8, 0);
    sweep.addColorStop(0, `rgba(${color},0.3)`);
    sweep.addColorStop(1, `rgba(${color},0)`);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 2.8, -0.35, 0.35);
    ctx.closePath();
    ctx.fillStyle = sweep;
    ctx.fill();
    ctx.restore();
  }

  function drawBugs(
    ctx: CanvasRenderingContext2D,
    W: number, H: number, cx: number, cy: number, shieldR: number,
    frame: number, _healthFrac: number,
  ) {
    for (const bug of bugsRef.current.values()) {
      const dx   = bug.tx - bug.x;
      const dy   = bug.ty - bug.y;
      const dist = Math.hypot(dx, dy) || 1;
      const wobble = Math.sin(frame * 0.1 + bug.phase) * 0.8;

      if (!paused) {
        bug.angle    = Math.atan2(dy, dx);
        bug.legPhase = frame * 0.18 + bug.phase;

        if (!bug.resolved) {
          bug.vx += (dx / dist) * 0.09;
          bug.vy += (dy / dist) * 0.09;
          bug.vx *= 0.93;
          bug.vy *= 0.93;
          bug.x += bug.vx + Math.cos(bug.angle + Math.PI / 2) * wobble;
          bug.y += bug.vy + Math.sin(bug.angle + Math.PI / 2) * wobble;
          bug.trailPoints.push({ x: bug.x, y: bug.y });
          if (bug.trailPoints.length > 16) bug.trailPoints.shift();
        }

        if (bug.outcome === 'blocked' && dist < shieldR) {
          bug.resolved = true;
          bug.hitAt ??= performance.now();
          bug.vx = -(dx / dist) * 4;
          bug.vy = -(dy / dist) * 4;
          spawnRipple(bug.x, bug.y, bug.color, 3);
          spawnExplosion(bug.x, bug.y, bug.color, 20);
          spawnLightning(bug.x, bug.y, cx, cy, bug.color);
          triggerFlash(bug.color, 0.16);
        } else if ((bug.outcome === 'successful' || bug.outcome === 'escalated') && dist < shieldR * 0.82) {
          bug.resolved = true;
          bug.hitAt ??= performance.now();
          spawnRipple(cx, cy, bug.color, 5);
          spawnExplosion(cx, cy, bug.color, 36);
          spawnLightning(bug.x, bug.y, cx, cy, bug.color);
          addShieldCrack();
          triggerFlash(bug.color, bug.outcome === 'escalated' ? 0.42 : 0.3);
        } else if (bug.outcome === 'active' && dist < shieldR * 0.76) {
          const orbit = Math.atan2(bug.y - cy, bug.x - cx) + 0.04;
          bug.tx = cx + Math.cos(orbit) * shieldR * 0.8;
          bug.ty = cy + Math.sin(orbit) * shieldR * 0.65;
        }
      }

      if (bug.resolved) {
        bug.x += bug.vx;
        bug.y += bug.vy;
        bug.opacity -= paused ? 0.01 : 0.02;
      }

      if (bug.opacity <= 0.02) { bugsRef.current.delete(bug.id); continue; }

      // Draw glow trail
      for (let i = 1; i < bug.trailPoints.length; i++) {
        const t  = i / bug.trailPoints.length;
        const p1 = bug.trailPoints[i - 1];
        const p2 = bug.trailPoints[i];
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = bug.glow;
        ctx.globalAlpha = bug.opacity * t * 0.3;
        ctx.lineWidth   = bug.size * 0.3 * t;
        ctx.lineCap     = 'round';
        ctx.stroke();
        ctx.restore();
      }

      drawBug(ctx, bug);
    }
  }

  /* ── Draw a single bug (cyber-beetle) ──────────────────────────────── */
  function drawBug(ctx: CanvasRenderingContext2D, bug: BugRuntime) {
    ctx.save();
    ctx.translate(bug.x, bug.y);
    ctx.rotate(bug.angle + Math.PI / 2); // head points forward
    ctx.globalAlpha = bug.opacity;

    const s = bug.size;
    const lp = bug.legPhase;

    /* glow */
    ctx.shadowColor = bug.glow;
    ctx.shadowBlur  = 20;

    /* ── Legs (3 per side, animated) ── */
    ctx.strokeStyle = bug.accent;
    ctx.lineWidth   = s * 0.1;
    ctx.lineCap     = 'round';
    ctx.shadowBlur  = 6;

    const legConfigs = [
      { side: -1, offset: -s * 0.5, swing: Math.sin(lp)       * s * 0.6 },
      { side: -1, offset:  0,       swing: Math.sin(lp + 1.0)  * s * 0.6 },
      { side: -1, offset:  s * 0.5, swing: Math.sin(lp + 2.1)  * s * 0.6 },
      { side:  1, offset: -s * 0.5, swing: Math.sin(lp + Math.PI)       * s * 0.6 },
      { side:  1, offset:  0,       swing: Math.sin(lp + Math.PI + 1.0)  * s * 0.6 },
      { side:  1, offset:  s * 0.5, swing: Math.sin(lp + Math.PI + 2.1)  * s * 0.6 },
    ];

    for (const leg of legConfigs) {
      const startX = leg.side * s * 0.55;
      const startY = leg.offset;
      const endX   = leg.side * (s * 0.55 + s * 0.85 + leg.swing * leg.side);
      const endY   = leg.offset + s * 0.2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      // Elbow joint
      ctx.lineTo(leg.side * (s * 0.55 + s * 0.4), leg.offset - s * 0.1);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    /* ── Abdomen (back oval) ── */
    ctx.shadowBlur = 16;
    ctx.shadowColor = bug.glow;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.55, s * 0.55, s * 0.72, 0, 0, Math.PI * 2);
    const abdGrad = ctx.createRadialGradient(0, s * 0.4, 0, 0, s * 0.55, s * 0.72);
    abdGrad.addColorStop(0, bug.color);
    abdGrad.addColorStop(0.6, bug.accent);
    abdGrad.addColorStop(1, '#000');
    ctx.fillStyle = abdGrad;
    ctx.fill();

    /* Abdomen segments */
    ctx.strokeStyle = `rgba(0,0,0,0.4)`;
    ctx.lineWidth   = 0.8;
    ctx.shadowBlur  = 0;
    for (let seg = 1; seg <= 3; seg++) {
      const sy = s * 0.55 - s * 0.72 + (seg / 3.5) * s * 1.44;
      ctx.beginPath();
      ctx.ellipse(0, sy, s * 0.55 * Math.sin((seg / 4) * Math.PI), 1, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* ── Wing covers (elytra) ── */
    ctx.shadowColor = bug.glow;
    ctx.shadowBlur  = 14;

    // Left wing
    ctx.beginPath();
    ctx.ellipse(-s * 0.28, 0, s * 0.32, s * 0.62, -0.15, 0, Math.PI * 2);
    const lwGrad = ctx.createLinearGradient(-s * 0.6, -s * 0.6, s * 0.1, s * 0.3);
    lwGrad.addColorStop(0, '#ffffff33');
    lwGrad.addColorStop(0.3, bug.color);
    lwGrad.addColorStop(1, bug.accent);
    ctx.fillStyle = lwGrad;
    ctx.fill();

    // Right wing
    ctx.beginPath();
    ctx.ellipse(s * 0.28, 0, s * 0.32, s * 0.62, 0.15, 0, Math.PI * 2);
    const rwGrad = ctx.createLinearGradient(-s * 0.1, -s * 0.6, s * 0.6, s * 0.3);
    rwGrad.addColorStop(0, '#ffffff33');
    rwGrad.addColorStop(0.3, bug.color);
    rwGrad.addColorStop(1, bug.accent);
    ctx.fillStyle = rwGrad;
    ctx.fill();

    // Wing center line
    ctx.strokeStyle = `rgba(0,0,0,0.5)`;
    ctx.lineWidth = 0.7;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.6);
    ctx.lineTo(0, s * 0.55);
    ctx.stroke();

    /* ── Head ── */
    ctx.shadowColor = bug.glow;
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.72, s * 0.38, s * 0.32, 0, 0, Math.PI * 2);
    const headGrad = ctx.createRadialGradient(0, -s * 0.8, 0, 0, -s * 0.72, s * 0.38);
    headGrad.addColorStop(0, '#ffffff55');
    headGrad.addColorStop(0.5, bug.color);
    headGrad.addColorStop(1, bug.accent);
    ctx.fillStyle = headGrad;
    ctx.fill();

    /* Eyes (glowing) */
    ctx.shadowBlur  = 10;
    [[-s * 0.18, -s * 0.76], [s * 0.18, -s * 0.76]].forEach(([ex, ey]) => {
      ctx.beginPath();
      ctx.arc(ex, ey, s * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = '#ff4444';
      ctx.shadowColor = '#ff0000';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + s * 0.02, ey - s * 0.02, s * 0.035, 0, Math.PI * 2);
      ctx.fillStyle = '#ffaaaa';
      ctx.fill();
    });

    /* Antennae */
    ctx.shadowBlur  = 8;
    ctx.shadowColor = bug.glow;
    ctx.strokeStyle = bug.accent;
    ctx.lineWidth   = s * 0.08;
    ctx.lineCap     = 'round';

    const antSwing = Math.sin(lp * 0.5) * 0.3;
    [[-1, -0.15], [1, 0.15]].forEach(([side, base]) => {
      const ax1 = side * s * 0.18;
      const ay1 = -s * 1.0;
      const ax2 = side * s * 0.6 + Math.cos(antSwing + base) * s * 0.3 * side as number;
      const ay2 = -s * 1.55 + Math.sin(antSwing) * s * 0.2;
      ctx.beginPath();
      ctx.moveTo(ax1, -s * 0.95);
      ctx.quadraticCurveTo(ax1, ay1, ax2, ay2);
      ctx.stroke();
      // Tip dot
      ctx.beginPath();
      ctx.arc(ax2, ay2, s * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = bug.color;
      ctx.fill();
    });

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawRipples(ctx: CanvasRenderingContext2D) {
    ripplesRef.current = ripplesRef.current.filter(r => r.opacity > 0.01);
    for (const rip of ripplesRef.current) {
      rip.radius  += 2.8;
      rip.opacity *= 0.91;
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rip.r},${rip.g},${rip.b},${rip.opacity})`;
      ctx.lineWidth   = rip.lineWidth * rip.opacity;
      ctx.stroke();
    }
  }

  function drawParticles(ctx: CanvasRenderingContext2D) {
    particlesRef.current = particlesRef.current.filter(p => p.alpha > 0.01);
    for (const p of particlesRef.current) {
      p.x  += p.vx; p.y  += p.vy;
      p.vy += 0.04;
      p.vx *= 0.97; p.vy *= 0.97;
      p.alpha  -= p.decay;
      p.radius *= 0.98;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, p.radius), 0, Math.PI * 2);
      ctx.fillStyle   = `rgba(${p.r},${p.g},${p.b},${p.alpha})`;
      ctx.shadowColor = `rgba(${p.r},${p.g},${p.b},${p.alpha * 0.7})`;
      ctx.shadowBlur  = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function drawLightnings(ctx: CanvasRenderingContext2D) {
    lightningsRef.current = lightningsRef.current.filter(l => l.opacity > 0.01);
    for (const l of lightningsRef.current) {
      l.opacity *= 0.86;
      ctx.save();
      ctx.globalAlpha = l.opacity;
      ctx.strokeStyle = `rgba(${l.r},${l.g},${l.b},1)`;
      ctx.shadowColor = `rgba(${l.r},${l.g},${l.b},0.9)`;
      ctx.shadowBlur  = 14;
      ctx.lineWidth   = l.width;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.beginPath();
      ctx.moveTo(l.segments[0].x, l.segments[0].y);
      for (const s of l.segments.slice(1)) ctx.lineTo(s.x, s.y);
      ctx.stroke();
      // Inner white core
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth   = l.width * 0.3;
      ctx.shadowBlur  = 4;
      ctx.beginPath();
      ctx.moveTo(l.segments[0].x, l.segments[0].y);
      for (const s of l.segments.slice(1)) ctx.lineTo(s.x, s.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawShieldCracks(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    cracksRef.current = cracksRef.current.filter(c => c.opacity > 0.02);
    for (const crack of cracksRef.current) {
      crack.opacity *= 0.985;
      const sx = cx + Math.cos(crack.angle) * r;
      const sy = cy + Math.sin(crack.angle) * r;
      ctx.save();
      ctx.globalAlpha = crack.opacity;
      ctx.strokeStyle = `rgba(255,80,80,${crack.opacity})`;
      ctx.shadowColor = 'rgba(255,50,50,0.8)';
      ctx.shadowBlur  = 8;
      ctx.lineWidth   = 1.5;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(
        cx + Math.cos(crack.angle) * (r - crack.length),
        cy + Math.sin(crack.angle) * (r - crack.length),
      );
      ctx.stroke();
      for (const b of crack.branches) {
        const bx = sx + Math.cos(crack.angle) * crack.length * 0.4;
        const by = sy + Math.sin(crack.angle) * crack.length * 0.4;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(b.angle) * b.length, by + Math.sin(b.angle) * b.length);
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawShield(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, r: number,
    healthFrac: number, frame: number,
  ) {
    const pulse = Math.sin(frame * 0.05) * 0.5 + 0.5;
    const color = healthFrac > 0.5 ? '0,229,255' : healthFrac > 0.25 ? '255,165,0' : '255,50,50';

    for (let i = 3; i >= 1; i--) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + i * 6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${color},${(0.06 / i) * pulse})`;
      ctx.lineWidth = i * 1.2;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${color},${0.5 + pulse * 0.3})`;
    ctx.lineWidth   = 2.5;
    ctx.shadowColor = `rgba(${color},0.8)`;
    ctx.shadowBlur  = 20;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    if (healthFrac > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * healthFrac);
      ctx.strokeStyle = `rgba(${color},0.95)`;
      ctx.lineWidth   = 4;
      ctx.shadowColor = `rgba(${color},1)`;
      ctx.shadowBlur  = 12;
      ctx.stroke();
      ctx.shadowBlur  = 0;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 4 + pulse * 2, 0, Math.PI * 2);
    ctx.fillStyle   = `rgba(${color},${0.6 + pulse * 0.4})`;
    ctx.shadowColor = `rgba(${color},0.9)`;
    ctx.shadowBlur  = 16;
    ctx.fill();
    ctx.shadowBlur  = 0;
  }

  function drawScreenFlash(ctx: CanvasRenderingContext2D, W: number, H: number) {
    if (!flashRef.current || flashRef.current.opacity <= 0.005) { flashRef.current = null; return; }
    const f = flashRef.current;
    f.opacity *= 0.8;
    ctx.save();
    ctx.fillStyle = `rgba(${f.r},${f.g},${f.b},${f.opacity})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  /* ── Spawn helpers ──────────────────────────────────────────────────── */
  function spawnRipple(x: number, y: number, color: string, count = 1) {
    const rgb = hexToRgb(color);
    for (let i = 0; i < count; i++) {
      ripplesRef.current.push({ x, y, radius: 8 + i * 10, opacity: 0.7 - i * 0.1, r: rgb.r, g: rgb.g, b: rgb.b, lineWidth: 2.5 - i * 0.3 });
    }
  }

  function spawnExplosion(x: number, y: number, color: string, count: number) {
    const rgb = hexToRgb(color);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5.5;
      particlesRef.current.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, radius: 1.5 + Math.random() * 3.5, alpha: 0.9, decay: 0.016 + Math.random() * 0.018, r: rgb.r, g: rgb.g, b: rgb.b });
    }
  }

  function spawnLightning(x1: number, y1: number, x2: number, y2: number, color: string) {
    const rgb      = hexToRgb(color);
    const segments = [{ x: x1, y: y1 }];
    for (let i = 1; i < 9; i++) {
      const t = i / 9;
      segments.push({ x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 35, y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 35 });
    }
    segments.push({ x: x2, y: y2 });
    lightningsRef.current.push({ segments, opacity: 0.9, r: rgb.r, g: rgb.g, b: rgb.b, width: 2.5 });
  }

  function triggerFlash(color: string, intensity: number) {
    const rgb = hexToRgb(color);
    flashRef.current = { opacity: intensity, r: rgb.r, g: rgb.g, b: rgb.b };
  }

  function addShieldCrack() {
    const angle    = Math.random() * Math.PI * 2;
    const branches = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => ({
      angle: angle + (Math.random() - 0.5) * 1.2,
      length: 8 + Math.random() * 18,
    }));
    cracksRef.current.push({ angle, length: 20 + Math.random() * 20, opacity: 0.9, branches });
    if (cracksRef.current.length > 6) cracksRef.current.shift();
  }

  return <canvas ref={canvasRef} className="swarm-canvas" aria-hidden="true" />;
}

/* ── Factories ────────────────────────────────────────────────────────── */
function createBug(event: SwarmTimelineEntry, canvas: HTMLCanvasElement | null): BugRuntime {
  const W    = canvas?.clientWidth  ?? 900;
  const H    = canvas?.clientHeight ?? 620;
  const seed = event.attackNumber * 19;
  const side = seed % 4;
  const span = (seed * 37) % 1000 / 1000;
  let x = 0, y = 0;
  if (side === 0)      { x = -32;    y = span * H; }
  else if (side === 1) { x = W + 32; y = span * H; }
  else if (side === 2) { x = span * W; y = -32; }
  else                 { x = span * W; y = H + 32; }

  return {
    id: event.id, outcome: event.outcome,
    color: event.color, accent: event.accent, glow: event.glow, trail: event.trail,
    x, y, vx: 0, vy: 0,
    tx: W * (0.35 + (seed % 17) / 17 * 0.3),
    ty: H * (0.3  + (seed % 11) / 11 * 0.4),
    size: 12 + (seed % 6),
    opacity: 0.94, angle: 0, phase: seed * 0.35, legPhase: 0,
    resolved: false, spawnAt: Date.now(), trailPoints: [],
  };
}

function hexToRgb(hex: string) {
  const n    = hex.replace('#', '');
  const full = n.length === 3 ? n.split('').map(c => c + c).join('') : n;
  const v    = parseInt(full, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}
