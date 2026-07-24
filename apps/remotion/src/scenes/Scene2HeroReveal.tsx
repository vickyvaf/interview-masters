import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const SKILL_TAGS = [
  "System Design",
  "Microservices",
  "React & TypeScript",
  "Behavioral & STAR",
];

interface Props {
  includeAudio?: boolean;
}

export const Scene2HeroReveal: React.FC<Props> = ({ includeAudio = true }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = width < height;

  // Title Entry
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 15], [-20, 0], {
    extrapolateRight: "clamp",
  });

  // Card Entry
  const cardOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const cardY = interpolate(frame, [10, 25], [150, 0], {
    extrapolateRight: "clamp",
  });
  const cardScale = interpolate(frame, [10, 25], [0.95, 1], {
    extrapolateRight: "clamp",
  });

  // Auto-typing text in search bar: "Software Engineer (Senior)"
  const roleText = "Software Engineer (Senior)";
  const typedLength = Math.floor(
    interpolate(frame, [30, 75], [0, roleText.length], {
      extrapolateRight: "clamp",
    })
  );
  const currentTypedText = roleText.substring(0, typedLength);

  return (
    <AbsoluteFill className="bg-black flex flex-col items-center justify-center overflow-hidden font-sans text-white select-none">
      {/* Voiceover Scene 2 */}
      <Audio src={staticFile("s2.mp3")} volume={1.0} />
      {/* Audio Backsound jika di-render standalone */}
      {includeAudio && <Audio src={staticFile("backsound.mp3")} volume={0.05} />}

      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Kinetic Headline Title */}
      <div
        className={`z-10 text-center ${isVertical ? "mb-8 px-6" : "mb-12"}`}
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <span className={`${isVertical ? "text-[46px]" : "text-[60px]"} font-black tracking-tight text-white block leading-tight`}>
          100% Customized for Your Role.
        </span>
        <span className={`${isVertical ? "text-[20px]" : "text-[24px]"} font-medium text-neutral-400 tracking-wide mt-2 block`}>
          AI tailors every question & interview scenario specifically for you.
        </span>
      </div>

      {/* Glassmorphism Dashboard UI Card */}
      <div
        className={`z-10 ${isVertical ? "w-[940px]" : "w-[1100px]"} bg-neutral-900/70 border border-white/15 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl`}
        style={{
          opacity: cardOpacity,
          transform: `translateY(${cardY}px) scale(${cardScale})`,
        }}
      >
        {/* Window Header Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-3.5 h-3.5 rounded-full bg-neutral-700" />
            <div className="w-3.5 h-3.5 rounded-full bg-neutral-700" />
            <div className="w-3.5 h-3.5 rounded-full bg-neutral-700" />
          </div>
          <div className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
            INTERVIEW MASTERS // DASHBOARD
          </div>
          <div className="w-16" />
        </div>

        {/* Role Search & Customization Field */}
        <div className="mb-8">
          <label className="text-xs font-semibold tracking-wider text-neutral-400 uppercase block mb-3">
            Target Job Position
          </label>
          <div className="relative flex items-center bg-black/60 border border-white/20 rounded-xl px-5 py-4 text-2xl font-bold text-white shadow-inner">
            <span className="mr-3 text-neutral-400">🔍</span>
            <span>{currentTypedText}</span>
            {/* Typing Cursor */}
            <span className="w-0.5 h-7 bg-white ml-1 animate-pulse" />
          </div>
        </div>

        {/* Skill Badges (Pop-in sequentially) */}
        <div>
          <label className="text-xs font-semibold tracking-wider text-neutral-400 uppercase block mb-3">
            AI Focus Modules & Scenarios
          </label>
          <div className="flex flex-wrap gap-3">
            {SKILL_TAGS.map((tag, i) => {
              const badgeStartFrame = 75 + i * 12;
              const badgeOpacity = interpolate(
                frame,
                [badgeStartFrame, badgeStartFrame + 10],
                [0, 1],
                { extrapolateRight: "clamp" }
              );
              const badgeY = interpolate(
                frame,
                [badgeStartFrame, badgeStartFrame + 10],
                [15, 0],
                { extrapolateRight: "clamp" }
              );

              return (
                <div
                  key={i}
                  className="px-5 py-2.5 rounded-lg bg-neutral-800/80 border border-white/10 text-sm font-semibold text-neutral-200"
                  style={{
                    opacity: badgeOpacity,
                    transform: `translateY(${badgeY}px)`,
                  }}
                >
                  ✨ {tag}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-end">
          <div className="px-8 py-3.5 rounded-xl bg-white text-black font-extrabold text-lg shadow-lg hover:bg-neutral-200 transition-colors cursor-pointer">
            Start Interview →
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
