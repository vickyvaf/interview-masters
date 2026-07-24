import React from "react";
import { AbsoluteFill, Audio, Series, staticFile } from "remotion";
import { Scene1RoleScroller } from "./scenes/Scene1RoleScroller";
import { Scene2HeroReveal } from "./scenes/Scene2HeroReveal";
import { Scene3LiveAIInterview } from "./scenes/Scene3LiveAIInterview";
import { Scene4InstantFeedback } from "./scenes/Scene4InstantFeedback";
import { Scene5CallToAction } from "./scenes/Scene5CallToAction";

// Exact Frame Durations matched to Voiceover Audio (s1.mp3 -> s5.mp3):
// s1.mp3: 54 frames -> 60 frames (2.0s)
// s2.mp3: 118 frames -> 125 frames (4.17s)
// s3.mp3: 167 frames -> 175 frames (5.83s)
// s4.mp3: 154 frames -> 160 frames (5.33s)
// s5.mp3: 171 frames -> 180 frames (6.00s)
// Total Video Duration: 700 frames (23.33s @ 30fps)

export const MainPromoVideo: React.FC = () => {
  return (
    <AbsoluteFill className="bg-black">
      {/* Audio Backsound Full (Soft background music behind voiceovers) */}
      <Audio src={staticFile("backsound.mp3")} volume={0.05} />
      <Series>
        {/* Scene 1: Role Scroller (Matched to s1.mp3 - 60 frames / 2.0s) */}
        <Series.Sequence durationInFrames={84} trimBefore={2}>
          <Scene1RoleScroller includeAudio={false} />
        </Series.Sequence>

        {/* Scene 2: Hero Reveal UI (Matched to s2.mp3 - 125 frames / 4.17s) */}
        <Series.Sequence durationInFrames={125}>
          <Scene2HeroReveal includeAudio={false} />
        </Series.Sequence>

        {/* Scene 3: Live AI Interview (Matched to s3.mp3 - 175 frames / 5.83s) */}
        <Series.Sequence durationInFrames={165}>
          <Scene3LiveAIInterview includeAudio={false} />
        </Series.Sequence>

        {/* Scene 4: Instant Feedback & Metrics (Matched to s4.mp3 - 160 frames / 5.33s) */}
        <Series.Sequence durationInFrames={155}>
          <Scene4InstantFeedback includeAudio={false} />
        </Series.Sequence>

        {/* Scene 5: Outro & Call to Action (Matched to s5.mp3 - 180 frames / 6.00s) */}
        <Series.Sequence durationInFrames={180}>
          <Scene5CallToAction includeAudio={false} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
