import type { RedTeamType, TaskAgentType } from '@/lib/sentinel/types';

export function AgentDuel({
  taskAgentType,
  redTeamType,
}: {
  taskAgentType: TaskAgentType;
  redTeamType: RedTeamType;
}) {
  return (
    <section className="threatsim-scene fade-in">
      <div className="threatsim-scene-grid" />
      <div className="threatsim-scene-orb" />
      <div className="threatsim-scene-particles">
        {Array.from({ length: 16 }).map((_, index) => (
          <span key={index} className={`threatsim-particle p-${index % 4}`} />
        ))}
      </div>

      <div className="threatsim-agent-card is-task">
        <p>Task Agent</p>
        <strong>{taskAgentType}</strong>
        <span>Objective retention</span>
      </div>

      <div className="threatsim-agent-card is-red">
        <p>Red Team</p>
        <strong>{redTeamType}</strong>
        <span>Adaptive adversary</span>
      </div>

      <div className="threatsim-viewport-node">
        <div className="threatsim-viewport-head">
          <span />
          <span />
          <span />
          <p>Live website viewport</p>
        </div>
        <div className="threatsim-viewport-body">
          <div className="threatsim-viewport-screen">
            <div className="threatsim-screen-line short" />
            <div className="threatsim-screen-line" />
            <div className="threatsim-screen-blocks">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="threatsim-shield-ring ring-1" />
          <div className="threatsim-shield-ring ring-2" />
        </div>
      </div>

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
