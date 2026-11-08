import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import subtitlesData from "../../subtitles.json";

interface SubtitleCue {
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
  text: string;
}

const cues: SubtitleCue[] = subtitlesData as SubtitleCue[];

// Highlight rules for key terms
const highlightRules: { regex: RegExp; color: string; bold?: boolean }[] = [
  { regex: /(5\.9 million tonnes|Jammu)/gi, color: "#38bdf8" }, // cyan
  { regex: /(catch|wasn't|cannot)/gi, color: "#f87171" }, // red
  { regex: /(583 parts per million|zero point zero five percent|0\.05%)/gi, color: "#facc15" }, // yellow
  { regex: /(step one|battery)/gi, color: "#e2e8f0" },
  { regex: /(crushed|concentrated|roasted at a thousand degrees|chemically leached|purified)/gi, color: "#fb923c" }, // orange
  { regex: /(battery-grade materials)/gi, color: "#4ade80" }, // emerald green
  { regex: /(twist)/gi, color: "#f87171" },
  { regex: /(China refines 65%|lithium)/gi, color: "#f87171" },
  { regex: /(Indonesia refines 40%|nickel)/gi, color: "#34d399" },
  { regex: /(real monopoly)/gi, color: "#f87171" },
  { regex: /(refineries)/gi, color: "#38bdf8" },
  { regex: /(2,814 crore|four future processing plants|30 percent capital subsidy)/gi, color: "#38bdf8" },
  { regex: /(potential)/gi, color: "#facc15" },
  { regex: /(power)/gi, color: "#22c55e", bold: true }, // electric green
];

function renderHighlightedText(text: string) {
  // Simple token matching
  const words = text.split(" ");
  return words.map((word, idx) => {
    let wordColor = "#ffffff";
    let isBold = false;

    for (const rule of highlightRules) {
      if (rule.regex.test(word) || rule.regex.test(text)) {
        // Test if this specific word matches rule
        const cleanWord = word.replace(/[^a-zA-Z0-9.%-]/g, "");
        if (rule.regex.test(cleanWord)) {
          wordColor = rule.color;
          if (rule.bold) isBold = true;
          break;
        }
      }
    }

    return (
      <span
        key={idx}
        style={{
          color: wordColor,
          fontWeight: isBold ? 900 : 800,
          display: "inline-block",
          margin: "0 6px",
          textShadow: wordColor !== "#ffffff" ? `0 0 20px ${wordColor}88` : "none",
        }}
      >
        {word}
      </span>
    );
  });
}

export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find active cue
  const activeCue = cues.find(
    (c) => frame >= c.startFrame && frame <= c.endFrame
  );

  if (!activeCue) return null;

  // Animation for cue entrance
  const cueAge = frame - activeCue.startFrame;
  const popSpring = spring({
    frame: cueAge,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.6 },
  });

  const scale = interpolate(popSpring, [0, 1], [0.92, 1.0]);
  const opacity = interpolate(cueAge, [0, 3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 230,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 940,
          padding: "18px 36px",
          borderRadius: 28,
          background: "rgba(10, 15, 29, 0.82)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "2px solid rgba(255, 255, 255, 0.16)",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.65), 0 0 24px rgba(56, 189, 248, 0.15)",
          textAlign: "center",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: 44,
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {renderHighlightedText(activeCue.text)}
      </div>
    </div>
  );
};
