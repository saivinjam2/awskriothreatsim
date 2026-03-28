import type { RedTeamType, TaskAgentType } from '@/lib/sentinel/types';

export function AgentDuel({
  taskAgentType: _taskAgentType,
  redTeamType: _redTeamType,
}: {
  taskAgentType: TaskAgentType;
  redTeamType: RedTeamType;
}) {
  return (
    <section className="threatsim-scene fade-in">
      {/* Grid lines background */}
      <div className="threatsim-scene-grid" />

      {/* Ambient center glow */}
      <div className="threatsim-scene-orb" />

      {/* Floating accent dots */}
      <div className="threatsim-scene-particles">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`threatsim-particle p-${i}`} />
        ))}
      </div>

      {/* Rotating orbit rings */}
      <div className="threatsim-shield-ring ring-1" />
      <div className="threatsim-shield-ring ring-2" />

      {/* Defender avatar */}
      <div className="threatsim-agent-card is-task">
        <span>🤖</span>
        <strong>Defender</strong>
      </div>

      {/* Browser viewport mockup */}
      <div className="threatsim-viewport-node">
        <div className="threatsim-viewport-head">
          <span />
          <span />
          <span />
          <p>live-viewport</p>
        </div>
        <div className="threatsim-viewport-body">
          <div className="threatsim-screen-line" />
          <div className="threatsim-screen-line" />
          <div className="threatsim-screen-line short" />
          <div className="threatsim-screen-blocks">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      {/* Attacker avatar */}
      <div className="threatsim-agent-card is-red">
        <span>🎭</span>
        <strong>Attacker</strong>
      </div>

      {/* Threat fish swarm */}
      <div className="threatsim-fish-school">
        <span className="threatsim-fish fish-magenta" />
        <span className="threatsim-fish fish-cyan" />
        <span className="threatsim-fish fish-orange" />
        <span className="threatsim-fish fish-red" />
        <span className="threatsim-fish fish-yellow" />
      </div>
    </section>
  );
}
