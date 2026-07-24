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

export const Scene3LiveAIInterview: React.FC<Props> = ({ includeAudio = true }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const isVertical = width < height;

  // Interface entry transition
  const uiScale = interpolate(frame, [0, 20], [0.96, 1], {
    extrapolateRight: "clamp",
  });
  const uiOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // AI Speaking Orb Pulse (Ripples expanding outwards)
  const rippleScale1 = 1 + ((frame * 0.08) % 0.8);
  const rippleOpacity1 = 0.8 - ((frame * 0.08) % 0.8);

  const rippleScale2 = 1 + (((frame + 10) * 0.08) % 0.8);
  const rippleOpacity2 = 0.8 - (((frame + 10) * 0.08) % 0.8);

  // Subtitle Typewriter Text Effect (AI Dialogue - Technical Question)
  const subtitleText =
    "Sekarang jelaskan bagaimana kamu mengoptimasi query database yang lambat dan menangani caching di level Redis?";

  const typedLength = Math.floor(
    interpolate(frame, [15, 120], [0, subtitleText.length], {
      extrapolateRight: "clamp",
    })
  );
  const currentSubtitle = subtitleText.substring(0, typedLength);

  return (
    <AbsoluteFill className="bg-[#09090b] flex flex-col items-center justify-between p-8 font-sans text-white select-none">
      {/* Voiceover Scene 3 */}
      <Audio src={staticFile("s3.mp3")} volume={1.0} />
      {/* Audio Backsound jika di-render standalone */}
      {includeAudio && <Audio src={staticFile("backsound.mp3")} volume={0.05} />}

      {/* Top Header Bar */}
      <div
        className="w-full flex items-center justify-between z-10 mb-4 px-2"
        style={{ opacity: uiOpacity }}
      >
        <div className="flex items-center space-x-2 bg-neutral-900 border border-white/10 px-4 py-2 rounded-lg text-sm font-semibold text-neutral-300">
          <span>← Back</span>
        </div>

        <div className={`${isVertical ? "text-base" : "text-xl"} font-bold tracking-tight text-white`}>
          Simulasi Wawancara AI - <span className="text-blue-400">Software Engineer</span>
        </div>

        <div className="w-20" />
      </div>

      {/* Main Split-Screen Video Call Grid */}
      <div
        className={`w-full flex-1 grid ${isVertical ? "grid-cols-1 grid-rows-2 max-h-[1550px]" : "grid-cols-2 max-h-[880px]"} gap-6 z-10`}
        style={{
          opacity: uiOpacity,
          transform: `scale(${uiScale})`,
        }}
      >
        {/* LEFT PANEL: AI Interviewer Video Feed */}
        <div className="relative bg-[#121215] border border-white/10 rounded-2xl flex flex-col justify-between p-8 overflow-hidden shadow-2xl">
          {/* Top Right Status Badge */}
          <div className="flex justify-end">
            <div className="flex items-center space-x-2 bg-emerald-950/80 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI INTERVIEWER (CONNECTED)</span>
            </div>
          </div>

          {/* Center Glowing Blue Speaking Orb */}
          <div className="flex flex-col items-center justify-center my-auto">
            <div className="relative flex items-center justify-center w-36 h-36">
              {/* Expanding Ripple Ring 1 */}
              <div
                className="absolute inset-0 rounded-full bg-blue-500/40"
                style={{
                  transform: `scale(${rippleScale1})`,
                  opacity: rippleOpacity1,
                }}
              />
              {/* Expanding Ripple Ring 2 */}
              <div
                className="absolute inset-0 rounded-full bg-blue-400/30"
                style={{
                  transform: `scale(${rippleScale2})`,
                  opacity: rippleOpacity2,
                }}
              />
              {/* Core Glowing Orb */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 via-blue-400 to-cyan-300 shadow-[0_0_50px_rgba(59,130,246,0.8)] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/50 blur-sm" />
              </div>
            </div>

            <span className="text-sm font-semibold tracking-widest text-neutral-400 uppercase mt-6">
              Speaking...
            </span>
          </div>

          {/* Bottom Live AI Subtitle Box */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-5 backdrop-blur-md">
            <p className="text-base font-medium text-neutral-200 leading-relaxed font-sans">
              <span className="font-bold text-blue-400 mr-2">AI:</span>
              {currentSubtitle}
              {frame < 120 && (
                <span className="w-0.5 h-4 bg-blue-400 inline-block ml-1 animate-pulse" />
              )}
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: Candidate Live Webcam View */}
        <div className="relative bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between p-6">
          {/* Mock Candidate Camera Graphic / Video View */}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-800 via-neutral-900 to-black flex items-center justify-center">
            {/* Candidate Avatar Graphic */}
            <div className="flex flex-col items-center justify-center opacity-80">
              <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-neutral-700 to-neutral-500 border-2 border-white/20 flex items-center justify-center shadow-xl mb-4">
                <span className="text-5xl">👤</span>
              </div>
              <span className="text-lg font-bold text-neutral-300">CANDIDATE CAMERA FEED</span>
            </div>

            {/* Subtle Video Grain/Scanline Overlay */}
            <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/60 pointer-events-none" />
          </div>

          {/* Top Right Name Badge */}
          <div className="relative z-10 flex justify-end">
            <div className="flex items-center space-x-2 bg-emerald-950/80 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CANDIDATE (LIVE)</span>
            </div>
          </div>

          {/* Bottom Floating Call Control Buttons */}
          <div className="relative z-10 flex justify-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400/40 backdrop-blur-md flex items-center justify-center text-blue-300 text-lg shadow-lg">
              🔊
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400/40 backdrop-blur-md flex items-center justify-center text-blue-300 text-lg shadow-lg">
              📷
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
