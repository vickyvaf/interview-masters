import "./index.css";
import { Composition } from "remotion";
import { Scene1RoleScroller } from "./scenes/Scene1RoleScroller";
import { Scene2HeroReveal } from "./scenes/Scene2HeroReveal";
import { Scene3LiveAIInterview } from "./scenes/Scene3LiveAIInterview";
import { Scene4InstantFeedback } from "./scenes/Scene4InstantFeedback";
import { Scene5CallToAction } from "./scenes/Scene5CallToAction";
import { MainPromoVideo } from "./MainPromoVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 16:9 Landscape Video Compositions */}
      <Composition
        id="MainPromoVideo"
        component={MainPromoVideo}
        durationInFrames={700}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="Scene1-RoleScroller"
        component={Scene1RoleScroller}
        durationInFrames={60}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="Scene2-HeroReveal"
        component={Scene2HeroReveal}
        durationInFrames={125}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="Scene3-LiveAIInterview"
        component={Scene3LiveAIInterview}
        durationInFrames={175}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="Scene4-InstantFeedback"
        component={Scene4InstantFeedback}
        durationInFrames={160}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="Scene5-CallToAction"
        component={Scene5CallToAction}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 9:16 Vertical Video Compositions (TikTok / Instagram Reels / YouTube Shorts) */}
      <Composition
        id="MainPromoVideo-Vertical"
        component={MainPromoVideo}
        durationInFrames={700}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="Scene1-RoleScroller-Vertical"
        component={Scene1RoleScroller}
        durationInFrames={60}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="Scene2-HeroReveal-Vertical"
        component={Scene2HeroReveal}
        durationInFrames={125}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="Scene3-LiveAIInterview-Vertical"
        component={Scene3LiveAIInterview}
        durationInFrames={175}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="Scene4-InstantFeedback-Vertical"
        component={Scene4InstantFeedback}
        durationInFrames={160}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="Scene5-CallToAction-Vertical"
        component={Scene5CallToAction}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
