'use client';

import { useEffect, useRef } from 'react';
import type { SwarmTimelineEntry } from '@/lib/arena/attack-visualization';

type FishRuntime = {
  id: string;
  outcome: SwarmTimelineEntry['outcome'];
  color: string;
  accent: string;
  glow: string;
  trail: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  size: number;
  opacity: number;
  angle: number;
  phase: number;
  resolved: boolean;
  hitAt?: number;
  spawnAt: number;
};

type Ripple = {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  r: number;
  g: number;
  b: number;
};

type Particle = {
  x: number;
  y: number;
  radius: number;
  drift: number;
  speed: number;
  alpha: number;
};

const MAX_PARTICLES = 22;
const MAX_FISH = 18;

export function SwarmCanvas({
  events,
  promptHealth,
  paused,
}: {
  events: SwarmTimelineEntry[];
  promptHealth: number;
  paused: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fishRef = useRef<Map<string, FishRuntime>>(new Map());
  const ripplesRef = useRef<Ripple[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const seededRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) {
        return;
      }
      const rect = parent.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      if (particlesRef.current.length === 0) {
        particlesRef.current = Array.from({ length: MAX_PARTICLES }, () => ({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          radius: 1 + Math.random() * 2.4,
          drift: Math.random() * Math.PI * 2,
          speed: 0.2 + Math.random() * 0.35,
          alpha: 0.08 + Math.random() * 0.18,
        }));
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement as Element);

    let frame = 0;
    let animationFrame = 0;

    const render = () => {
      frame += 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      context.clearRect(0, 0, width, height);

      drawBackground(context, width, height, frame);
      drawParticles(context, width, height, frame);
      drawFish(context, width, height, frame, promptHealth, paused);
      drawRipples(context);

      animationFrame = window.requestAnimationFrame(render);
    };

    animationFrame = window.requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, [paused, promptHealth]);

  useEffect(() => {
    const recentEvents =
      !seededRef.current && events.length > 3 ? events.slice(-3) : events.slice(-MAX_FISH);
    if (!seededRef.current) {
      seededRef.current = true;
    }

    for (const event of recentEvents) {
      if (!fishRef.current.has(event.id)) {
        fishRef.current.set(event.id, createFish(event, canvasRef.current));
      } else {
        const current = fishRef.current.get(event.id);
        if (current) {
          current.outcome = event.outcome;
        }
      }
    }

    const ids = new Set(events.map((event) => event.id));
    for (const [id, fish] of fishRef.current) {
      if (!ids.has(id) && fish.resolved) {
        fishRef.current.delete(id);
      }
    }

    if (fishRef.current.size > MAX_FISH) {
      const oldest = [...fishRef.current.values()].sort((a, b) => a.spawnAt - b.spawnAt);
      for (const fish of oldest.slice(0, fishRef.current.size - MAX_FISH)) {
        fishRef.current.delete(fish.id);
      }
    }
  }, [events]);

  function drawBackground(context: CanvasRenderingContext2D, width: number, height: number, frame: number) {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(2, 16, 31, 0.18)');
    gradient.addColorStop(0.5, 'rgba(4, 31, 53, 0.08)');
    gradient.addColorStop(1, 'rgba(1, 8, 18, 0.3)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    context.lineWidth = 1;
    for (let i = 0; i < 6; i += 1) {
      const y = height * (0.14 + i * 0.15) + Math.sin(frame * 0.012 + i) * 8;
      context.beginPath();
      context.moveTo(0, y);
      context.bezierCurveTo(width * 0.3, y - 12, width * 0.7, y + 12, width, y - 6);
      context.stroke();
    }
  }

  function drawParticles(context: CanvasRenderingContext2D, width: number, height: number, frame: number) {
    for (const particle of particlesRef.current) {
      particle.x += Math.cos(particle.drift + frame * 0.006) * particle.speed;
      particle.y -= particle.speed * 0.45;

      if (particle.x < -20) {
        particle.x = width + 20;
      } else if (particle.x > width + 20) {
        particle.x = -20;
      }

      if (particle.y < -20) {
        particle.y = height + 20;
      }

      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(125, 232, 255, ${particle.alpha})`;
      context.fill();
    }
  }

  function drawFish(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    frame: number,
    promptHealthValue: number,
    pausedValue: boolean,
  ) {
    const centerX = width / 2;
    const centerY = height / 2;
    const shieldRadius = Math.min(width, height) * 0.18;

    for (const fish of fishRef.current.values()) {
      const dx = fish.tx - fish.x;
      const dy = fish.ty - fish.y;
      const distance = Math.hypot(dx, dy) || 1;
      const wobble = Math.sin(frame * 0.08 + fish.phase) * 0.7;

      if (!pausedValue) {
        fish.angle = Math.atan2(dy, dx);

        if (!fish.resolved) {
          fish.vx += (dx / distance) * 0.08;
          fish.vy += (dy / distance) * 0.08;
          fish.vx *= 0.94;
          fish.vy *= 0.94;
          fish.x += fish.vx + Math.cos(fish.angle + Math.PI / 2) * wobble;
          fish.y += fish.vy + Math.sin(fish.angle + Math.PI / 2) * wobble;
        }

        if (fish.outcome === 'blocked' && distance < shieldRadius) {
          fish.resolved = true;
          fish.hitAt ??= performance.now();
          fish.vx = -dx / distance * 3.2;
          fish.vy = -dy / distance * 3.2;
          fish.opacity -= 0.02;
          spawnRipple(fish.x, fish.y, fish.color);
        } else if ((fish.outcome === 'successful' || fish.outcome === 'escalated') && distance < shieldRadius * 0.82) {
          fish.resolved = true;
          fish.hitAt ??= performance.now();
          fish.opacity -= fish.outcome === 'successful' ? 0.028 : 0.02;
          spawnRipple(centerX, centerY, fish.color);
        } else if (fish.outcome === 'active' && distance < shieldRadius * 0.76) {
          const orbit = Math.atan2(fish.y - centerY, fish.x - centerX) + 0.04;
          fish.tx = centerX + Math.cos(orbit) * shieldRadius * 0.8;
          fish.ty = centerY + Math.sin(orbit) * shieldRadius * 0.65;
        }
      }

      if (fish.resolved) {
        fish.x += fish.vx;
        fish.y += fish.vy;
        fish.opacity -= pausedValue ? 0.01 : 0.018;
      }

      if (fish.opacity <= 0.02) {
        fishRef.current.delete(fish.id);
        continue;
      }

      drawSingleFish(context, fish);
    }

    const shieldAlpha = 0.08 + ((100 - promptHealthValue) / 100) * 0.22;
    context.beginPath();
    context.arc(centerX, centerY, shieldRadius, 0, Math.PI * 2);
    context.strokeStyle = `rgba(0, 229, 255, ${shieldAlpha})`;
    context.lineWidth = 2;
    context.shadowColor = 'rgba(0, 229, 255, 0.28)';
    context.shadowBlur = 18;
    context.stroke();
    context.shadowBlur = 0;
  }

  function drawRipples(context: CanvasRenderingContext2D) {
    ripplesRef.current = ripplesRef.current.filter((ripple) => ripple.opacity > 0.02);
    for (const ripple of ripplesRef.current) {
      ripple.radius += 1.8;
      ripple.opacity *= 0.94;
      context.beginPath();
      context.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      context.strokeStyle = `rgba(${ripple.r}, ${ripple.g}, ${ripple.b}, ${ripple.opacity})`;
      context.lineWidth = 2;
      context.stroke();
    }
  }

  function spawnRipple(x: number, y: number, color: string) {
    const rgba = hexToRgb(color);
    ripplesRef.current.push({
      x,
      y,
      radius: 10,
      opacity: 0.55,
      r: rgba.r,
      g: rgba.g,
      b: rgba.b,
    });
  }

  return <canvas ref={canvasRef} className="swarm-canvas" aria-hidden="true" />;
}

function createFish(event: SwarmTimelineEntry, canvas: HTMLCanvasElement | null): FishRuntime {
  const width = canvas?.clientWidth ?? 900;
  const height = canvas?.clientHeight ?? 620;
  const seed = event.attackNumber * 19;
  const side = seed % 4;
  const span = (seed * 37) % 1000 / 1000;

  let x = 0;
  let y = 0;

  if (side === 0) {
    x = -32;
    y = span * height;
  } else if (side === 1) {
    x = width + 32;
    y = span * height;
  } else if (side === 2) {
    x = span * width;
    y = -32;
  } else {
    x = span * width;
    y = height + 32;
  }

  return {
    id: event.id,
    outcome: event.outcome,
    color: event.color,
    accent: event.accent,
    glow: event.glow,
    trail: event.trail,
    x,
    y,
    vx: 0,
    vy: 0,
    tx: width * (0.35 + ((seed % 17) / 17) * 0.3),
    ty: height * (0.3 + ((seed % 11) / 11) * 0.4),
    size: 12 + (seed % 6),
    opacity: 0.94,
    angle: 0,
    phase: seed * 0.35,
    resolved: false,
    spawnAt: Date.now(),
  };
}

function drawSingleFish(context: CanvasRenderingContext2D, fish: FishRuntime) {
  context.save();
  context.translate(fish.x, fish.y);
  context.rotate(fish.angle);
  context.globalAlpha = fish.opacity;
  context.shadowColor = fish.glow;
  context.shadowBlur = 16;

  context.beginPath();
  context.moveTo(-fish.size * 1.1, 0);
  context.lineTo(-fish.size * 1.7, -fish.size * 0.45);
  context.lineTo(-fish.size * 1.7, fish.size * 0.45);
  context.closePath();
  context.fillStyle = fish.accent;
  context.fill();

  context.beginPath();
  context.ellipse(0, 0, fish.size, fish.size * 0.56, 0, 0, Math.PI * 2);
  const bodyGradient = context.createLinearGradient(-fish.size, 0, fish.size, 0);
  bodyGradient.addColorStop(0, fish.accent);
  bodyGradient.addColorStop(0.5, fish.color);
  bodyGradient.addColorStop(1, '#ffffff');
  context.fillStyle = bodyGradient;
  context.fill();

  context.beginPath();
  context.moveTo(-fish.size * 0.1, -fish.size * 0.5);
  context.lineTo(fish.size * 0.35, -fish.size * 0.94);
  context.lineTo(fish.size * 0.56, -fish.size * 0.28);
  context.closePath();
  context.fillStyle = fish.accent;
  context.fill();

  context.beginPath();
  context.arc(fish.size * 0.38, -fish.size * 0.08, fish.size * 0.11, 0, Math.PI * 2);
  context.fillStyle = '#01131f';
  context.fill();

  context.beginPath();
  context.arc(fish.size * 0.42, -fish.size * 0.12, fish.size * 0.04, 0, Math.PI * 2);
  context.fillStyle = '#ffffff';
  context.fill();

  context.shadowBlur = 0;
  context.restore();
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : normalized;

  const value = Number.parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}
