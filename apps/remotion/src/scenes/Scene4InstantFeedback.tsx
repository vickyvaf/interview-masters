import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface Props {
  includeAudio?: boolean;
}

export const Scene4InstantFeedback: React.FC<Props> = ({ includeAudio = true }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = width < height;

  // 1. Headline Entry
  const headlineOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(frame, [0, 15], [-20, 0], {
    extrapolateRight: "clamp",
  });

  // 2. Animated Score Counter (0% -> 98%)
  const rawScore = interpolate(frame, [15, 60], [0, 98], {
    extrapolateRight: "clamp",
  });
  const confidenceScore = Math.floor(rawScore);

  // Card entries
  const cardOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const cardScale = interpolate(frame, [10, 25], [0.95, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-black flex flex-col items-center justify-center overflow-hidden font-sans text-white select-none">
      {/* Voiceover Scene 4 */}
      <Audio src={staticFile("s4.mp3")} volume={1.0} />
      {/* Audio Backsound jika di-render standalone */}
      {includeAudio && <Audio src={staticFile("backsound.mp3")} volume={0.05} />}

      {/* Kinetic Headline */}
      <div
        className={`z-10 text-center ${isVertical ? "mb-6 px-4" : "mb-10"}`}
        style={{
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
        }}
      >
        <span className={`${isVertical ? "text-[42px]" : "text-[55px]"} font-black tracking-tight text-white block leading-tight`}>
          Instant Feedback. Master Every Response.
        </span>
        <span className={`${isVertical ? "text-[18px]" : "text-[22px]"} font-medium text-neutral-400 tracking-wide mt-1 block`}>
          Get Actionable Analytics & STAR Method Scoring After Every Session
        </span>
      </div>

      {/* Metrics Grid (2x2 Clean Minimalist Glass Cards) */}
      <div
        className={`z-10 ${isVertical ? "w-[940px] grid-cols-2 gap-4" : "w-[1100px] grid-cols-2 gap-6"} grid`}
        style={{
          opacity: cardOpacity,
          transform: `scale(${cardScale})`,
        }}
      >
        {/* CARD 1: Overall Confidence Score */}
        <div className="bg-neutral-900/60 border border-white/15 rounded-2xl p-7 backdrop-blur-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wide text-neutral-400">
              Overall Confidence Score
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-800 text-white border border-white/10">
              High Readiness
            </span>
          </div>

          <div className="my-6 flex items-baseline space-x-2">
            <span className="text-[85px] font-black tracking-tighter text-white font-mono leading-none">
              {confidenceScore}
            </span>
            <span className="text-[45px] font-extrabold text-neutral-300 font-mono">
              %
            </span>
          </div>

          {/* Progress Bar (Solid White) */}
          <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all"
              style={{ width: `${confidenceScore}%` }}
            />
          </div>
        </div>

        {/* CARD 2: STAR Method Structure */}
        <div className="bg-neutral-900/60 border border-white/15 rounded-2xl p-7 backdrop-blur-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wide text-neutral-400">
              STAR Method Analysis
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-800 text-white border border-white/10">
              Structure Matched ✓
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-4">
            {[
              { label: "Situation", status: "Detailed" },
              { label: "Task", status: "Clear Scope" },
              { label: "Action", status: "High Impact" },
              { label: "Result", status: "Quantified" },
            ].map((item, idx) => {
              const badgeDelay = 30 + idx * 8;
              const badgeOpacity = interpolate(
                frame,
                [badgeDelay, badgeDelay + 10],
                [0, 1],
                { extrapolateRight: "clamp" }
              );
              return (
                <div
                  key={idx}
                  className="bg-black/40 border border-white/10 p-3 rounded-xl flex items-center justify-between"
                  style={{ opacity: badgeOpacity }}
                >
                  <span className="text-sm font-bold text-neutral-200">
                    {item.label}
                  </span>
                  <span className="text-xs font-mono font-medium text-neutral-400">
                    ✓ {item.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CARD 3: Technical Depth & Relevance */}
        <div className="bg-neutral-900/60 border border-white/15 rounded-2xl p-7 backdrop-blur-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wide text-neutral-400">
              Technical Depth Alignment
            </span>
            <span className="text-xs font-semibold text-neutral-400 font-mono">
              Target: Senior Level
            </span>
          </div>

          <div className="my-4">
            <div className="text-3xl font-extrabold text-white mb-2">
              95% Relevance Score
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Covered concurrency, optimistic locking, and Redis cache invalidation strategies effectively.
            </p>
          </div>
        </div>

        {/* CARD 4: Speech Pacing & Articulation */}
        <div className="bg-neutral-900/60 border border-white/15 rounded-2xl p-7 backdrop-blur-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wide text-neutral-400">
              Speech Pacing & Articulation
            </span>
            <span className="text-xs font-semibold text-white font-mono">
              Optimal Pacing ⚡
            </span>
          </div>

          <div className="my-4 flex items-baseline justify-between">
            <div>
              <span className="text-4xl font-extrabold text-white font-mono">
                142
              </span>
              <span className="text-sm text-neutral-400 ml-2 font-mono">
                Words per Minute
              </span>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 border border-white/10">
              Confident & Calm
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
