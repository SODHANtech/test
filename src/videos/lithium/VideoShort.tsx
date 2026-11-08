import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Subtitles } from "./Subtitles";

export const TOTAL_FRAMES = 1706;

interface ShotConfig {
  id: number;
  image: string;
  start: number;
  duration: number;
  scaleFrom: number;
  scaleTo: number;
  xFrom: number;
  xTo: number;
  yFrom: number;
  yTo: number;
  fadeInFrames?: number;
}

const SHOTS: ShotConfig[] = [
  // Shot 1: Jammu Discovery (0 - 113)
  {
    id: 1,
    image: "visuals/shot1.jpg",
    start: 0,
    duration: 113,
    scaleFrom: 1.0,
    scaleTo: 1.06,
    xFrom: 0,
    xTo: 0,
    yFrom: 0,
    yTo: -15,
  },
  // Shot 2: The Catch (113 - 256) - Hard cut with flash
  {
    id: 2,
    image: "visuals/shot2.jpg",
    start: 113,
    duration: 143,
    scaleFrom: 1.03,
    scaleTo: 1.11,
    xFrom: 0,
    xTo: 0,
    yFrom: 0,
    yTo: -10,
  },
  // Shot 3: 583 PPM Reality (256 - 551)
  {
    id: 3,
    image: "visuals/shot3.jpg",
    start: 256,
    duration: 295,
    scaleFrom: 1.0,
    scaleTo: 1.09,
    xFrom: 0,
    xTo: 0,
    yFrom: 15,
    yTo: -20,
    fadeInFrames: 6,
  },
  // Shot 4: Mining Reality - Dump truck (551 - 630)
  {
    id: 4,
    image: "visuals/shot4.jpg",
    start: 551,
    duration: 79,
    scaleFrom: 1.08,
    scaleTo: 1.08,
    xFrom: 25,
    xTo: -25,
    yFrom: 0,
    yTo: 0,
  },
  // Shot 5: Rotary Kiln 1000°C Roast (630 - 798)
  {
    id: 5,
    image: "visuals/shot5.jpg",
    start: 630,
    duration: 168,
    scaleFrom: 1.0,
    scaleTo: 1.09,
    xFrom: 0,
    xTo: 0,
    yFrom: 15,
    yTo: -15,
    fadeInFrames: 6,
  },
  // Shot 6: Hydrometallurgy Purity >99.5% (798 - 984)
  {
    id: 6,
    image: "visuals/shot6.jpg",
    start: 798,
    duration: 186,
    scaleFrom: 1.01,
    scaleTo: 1.08,
    xFrom: 0,
    xTo: 0,
    yFrom: 10,
    yTo: -15,
    fadeInFrames: 6,
  },
  // Shot 7: Geopolitical Dual-Hub Monopoly (984 - 1320)
  {
    id: 7,
    image: "visuals/shot7.jpg",
    start: 984,
    duration: 336,
    scaleFrom: 1.06,
    scaleTo: 1.06,
    xFrom: 0,
    xTo: 0,
    yFrom: -35,
    yTo: 30,
    fadeInFrames: 6,
  },
  // Shot 8: India's ₹2,814 Cr Processing Scheme (1320 - 1545)
  {
    id: 8,
    image: "visuals/shot8.jpg",
    start: 1320,
    duration: 225,
    scaleFrom: 1.08,
    scaleTo: 1.01,
    xFrom: 0,
    xTo: 0,
    yFrom: -15,
    yTo: 12,
    fadeInFrames: 6,
  },
  // Shot 9: Processing is Power Punchline (1545 - 1706)
  {
    id: 9,
    image: "visuals/shot9.jpg",
    start: 1545,
    duration: 161,
    scaleFrom: 1.08,
    scaleTo: 1.0,
    xFrom: 0,
    xTo: 0,
    yFrom: 10,
    yTo: -5,
    fadeInFrames: 6,
  },
];

const ShotRenderer: React.FC<{ shot: ShotConfig }> = ({ shot }) => {
  const frame = useCurrentFrame();

  const scale = interpolate(
    frame,
    [0, shot.duration],
    [shot.scaleFrom, shot.scaleTo],
    { extrapolateRight: "clamp" }
  );

  const x = interpolate(
    frame,
    [0, shot.duration],
    [shot.xFrom, shot.xTo],
    { extrapolateRight: "clamp" }
  );

  const y = interpolate(
    frame,
    [0, shot.duration],
    [shot.yFrom, shot.yTo],
    { extrapolateRight: "clamp" }
  );

  const opacity = shot.fadeInFrames
    ? interpolate(frame, [0, shot.fadeInFrames], [0, 1], {
        extrapolateRight: "clamp",
      })
    : 1;

  // Extra atmospheric FX for Shot 5 (heat glow pulse)
  const heatPulse =
    shot.id === 5
      ? interpolate(Math.sin(frame * 0.15), [-1, 1], [0.03, 0.12])
      : 0;

  return (
    <AbsoluteFill style={{ opacity, overflow: "hidden", backgroundColor: "#0b0f19" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translate(${x}px, ${y}px)`,
          transformOrigin: "center center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          src={staticFile(shot.image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Heat shimmer / fire glow for shot 5 */}
      {shot.id === 5 && (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 60% 65%, rgba(249, 115, 22, 0.45) 0%, rgba(239, 68, 68, 0.18) 45%, transparent 75%)",
            opacity: heatPulse,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Tech cyan glow for shot 8 & 9 */}
      {(shot.id === 8 || shot.id === 9) && (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(circle at 50% 85%, rgba(56, 189, 248, 0.12) 0%, transparent 60%)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export const VideoShort: React.FC = () => {
  const frame = useCurrentFrame();

  // 4-frame comic impact white flash for Shot 2 ("But there was a catch!")
  const flashOpacity =
    frame >= 113 && frame <= 117
      ? interpolate(frame, [113, 114, 115, 117], [0.85, 0.6, 0.25, 0], {
          extrapolateRight: "clamp",
        })
      : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Master Audio Track with Voice + Foley SFX + Doc Pulse */}
      <Audio src={staticFile("master_audio_with_sfx.mp3")} />

      {/* Shot Sequences */}
      {SHOTS.map((shot) => (
        <Sequence
          key={shot.id}
          from={shot.start}
          durationInFrames={shot.duration}
        >
          <ShotRenderer shot={shot} />
        </Sequence>
      ))}

      {/* Comic Impact Flash for Shot 2 */}
      {flashOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#ffffff",
            opacity: flashOpacity,
            mixBlendMode: "screen",
            pointerEvents: "none",
            zIndex: 40,
          }}
        />
      )}

      {/* Subtle Cinematic Vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 58%, rgba(5, 8, 16, 0.55) 100%)",
          pointerEvents: "none",
          zIndex: 45,
        }}
      />

      {/* Subtitles Overlay */}
      <Subtitles />
    </AbsoluteFill>
  );
};
