'use client';

import { useEffect, useState } from 'react';

type BootPhase = 'show' | 'hide' | 'done';

export function BootSequence() {
  const [phase, setPhase] = useState<BootPhase>('show');

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase('hide'), 3_000);
    const doneTimer = setTimeout(() => setPhase('done'), 3_500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (phase === 'done') {
    return null;
  }

  return (
    <div className={`boot-screen ${phase === 'hide' ? 'hide' : ''}`} aria-hidden="true">
      <div className="boot-logo">
        KRIO<span> THREATSIM</span>
      </div>
      <div className="boot-wanted">SWARM DEFENSE INITIALIZING</div>
      <div className="boot-lines">
        <p className="boot-line">mounting playwright browser runtime.......... OK</p>
        <p className="boot-line">hydrating swarm telemetry lanes.............. OK</p>
        <p className="boot-line">arming live threat visualization............. OK</p>
        <p className="boot-line">ENTERING SWARM DEFENSE ARENA................. OK</p>
      </div>
    </div>
  );
}
