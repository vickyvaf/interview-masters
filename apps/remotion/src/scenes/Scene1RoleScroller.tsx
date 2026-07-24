import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const ROLES = [
  "Frontend Engineer",
  "DevOps Engineer",
  "Product Manager",
  "Software Engineer",
  "Data Scientist",
  "AI Engineer",
  "Cloud Architect",
  "Cybersecurity Specialist",
  "Web3 Engineer",
  "Data Engineer",
  "Machine Learning Engineer",
  "Solutions Architect",
  "Engineering Manager",
  "Product Designer",
  "Scrum Master",
  "Business Analyst",
  "Systems Engineer",
  "Site Reliability Engineer",
  "Growth Marketing Manager",
  "Tech Lead",
  "Any Role You Want.",
];

interface Props {
  includeAudio?: boolean;
}

export const Scene1RoleScroller: React.FC<Props> = ({ includeAudio = true }) => {
  const frame = useCurrentFrame();

  // Exact Jitter Timing Constants:
  // 500ms move (15 frames @ 30fps) + 250ms hold (7.5 frames @ 30fps) = 22.5 frames cycle
  const MOVE_FRAMES = 15;
  const HOLD_FRAMES = 7.5;
  const CYCLE_FRAMES = MOVE_FRAMES + HOLD_FRAMES; // 22.5 frames

  // Calculate current step index and progress within current step
  const currentStep = Math.floor(frame / CYCLE_FRAMES);
  const frameInCycle = frame % CYCLE_FRAMES;

  // Smooth easing during move phase (0 to 1), clamped during hold phase
  const moveProgress = interpolate(
    frameInCycle,
    [0, MOVE_FRAMES],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // Smooth cubic-bezier standard easing matching Jitter's "smooth:standard:v1"
  const easedProgress = Math.sin((moveProgress * Math.PI) / 2);

  // Total continuous step index starting from 0
  const stepIndex = currentStep + easedProgress;

  const { width, height } = useVideoConfig();
  const isVertical = width < height;

  const ITEM_HEIGHT = isVertical ? 160 : 140; // Vertical spacing between role text items
  const screenCenterY = height / 2;

  // Start directly at item 3 (index 2: "DevOps Engineer") at frame 0 (detik 0)
  const START_ITEM_INDEX = 2;
  const currentScrollY = (START_ITEM_INDEX + stepIndex) * ITEM_HEIGHT;

  return (
    <AbsoluteFill className="bg-black flex items-center justify-center overflow-hidden font-sans text-white select-none">
      {/* Voiceover Scene 1 */}
      <Audio src={staticFile("s1.mp3")} volume={1.0} />
      {/* Audio Backsound jika di-render standalone */}
      {includeAudio && <Audio src={staticFile("backsound.mp3")} volume={0.05} />}

      {/* Container with Jitter's Exact Container Rotation (-7.5 deg tilt) */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        style={{
          transform: "rotate(-7.5deg)",
          transformOrigin: "center center",
        }}
      >
        {ROLES.map((role, idx) => {
          // Calculate item's Y position relative to screen center
          const itemY = idx * ITEM_HEIGHT - currentScrollY + screenCenterY;
          const distFromCenter = itemY - screenCenterY;

          // Distance in number of items (0 = center, 1 = 1 step away, etc.)
          const absDistItems = Math.abs(distFromCenter / ITEM_HEIGHT);

          // Hide items far off screen
          if (absDistItems > 5.5) {
            return null;
          }

          // Exact Jitter Blur Radius Steps (from Jitter JSON):
          // Center item (0): 0px blur
          // 1 item away: 10px blur, 2 items away: 20px blur, etc.
          const blurRadius = absDistItems * 10;

          // Exact Jitter Opacity Steps:
          // Center item (<0.4 items away): 100% opacity (1.0)
          // Surrounding items: 50% opacity (0.5) down to 15% near edges
          const opacity = absDistItems < 0.4
            ? 1
            : interpolate(absDistItems, [0.4, 1.5, 4.5], [0.5, 0.4, 0.15], {
              extrapolateRight: "clamp",
            });

          const isSelected = absDistItems < 0.4;

          return (
            <div
              key={idx}
              className="absolute left-1/2 flex items-center text-[95px] font-black tracking-tight whitespace-nowrap"
              style={{
                top: `${itemY}px`,
                filter: `blur(${blurRadius}px)`,
                opacity: opacity,
                transform: "translate(-50%, -50%)",
                transformOrigin: "center center",
              }}
            >
              {/* Plain text without arrow icon */}
              <span className={isSelected ? "text-white" : "text-neutral-300"}>
                {role}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
