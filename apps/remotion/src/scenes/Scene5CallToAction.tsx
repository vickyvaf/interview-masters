import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface Props {
  includeAudio?: boolean;
}

export const Scene5CallToAction: React.FC<Props> = ({ includeAudio = true }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = width < height;

  // Phase 1: Rapid Kinetic Words (Frames 0 - 65)
  let wordIndex = 0;
  if (frame >= 40) {
    wordIndex = 2;
  } else if (frame >= 20) {
    wordIndex = 1;
  }

  const wordList = ["Practice.", "Master.", "Get Hired."];
  const activeWord = wordList[wordIndex];

  const wordFrame = wordIndex === 2 ? frame - 40 : wordIndex === 1 ? frame - 20 : frame;
  const wordScale = interpolate(wordFrame, [0, 5], [0.94, 1], {
    extrapolateRight: "clamp",
  });
  const wordOpacity = interpolate(wordFrame, [0, 4], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Phase 2: Brand Outro & CTA (Frames 65 - 150)
  const isOutro = frame >= 65;
  const outroFrame = frame - 65;

  const outroOpacity = interpolate(outroFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const outroY = interpolate(outroFrame, [0, 15], [20, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-black flex flex-col items-center justify-center overflow-hidden font-sans text-white select-none">
      {/* Voiceover Scene 5 */}
      <Audio src={staticFile("s5.mp3")} volume={1.0} />
      {/* Audio Backsound jika di-render standalone */}
      {includeAudio && <Audio src={staticFile("backsound.mp3")} volume={0.05} />}

      {/* PHASE 1: Punchy Kinetic Words */}
      {!isOutro && (
        <div
          className="z-10 flex items-center justify-center px-4"
          style={{
            transform: `scale(${wordScale})`,
            opacity: wordOpacity,
          }}
        >
          <span className={`${isVertical ? "text-[85px]" : "text-[110px]"} font-black tracking-tighter text-white whitespace-nowrap`}>
            {activeWord}
          </span>
        </div>
      )}

      {/* PHASE 2: Brand Outro & Apple-Style CTA */}
      {isOutro && (
        <div
          className="z-10 flex flex-col items-center justify-center text-center px-8"
          style={{
            opacity: outroOpacity,
            transform: `translateY(${outroY}px)`,
          }}
        >
          {/* Logo PNG Image */}
          <Img
            src={staticFile("logo.png")}
            className={`${isVertical ? "h-24" : "h-20"} w-auto mb-4 object-contain`}
          />

          {/* Title */}
          <h1 className={`${isVertical ? "text-[48px]" : "text-[55px]"} font-black tracking-tight text-white mb-4`}>
            InterviewMasters
          </h1>

          {/* Subtitle Tagline */}
          <p className={`${isVertical ? "text-[22px]" : "text-[26px]"} font-medium text-neutral-300 max-w-[700px] mb-10 leading-relaxed`}>
            Turn Every Interview into Real Job Offers.
          </p>

          {/* Apple-Style Pill CTA Button */}
          <div className="px-10 py-4 rounded-full bg-white text-black font-extrabold text-xl tracking-tight shadow-2xl hover:bg-neutral-200 cursor-pointer transition-transform">
            Start Practice Free →
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
