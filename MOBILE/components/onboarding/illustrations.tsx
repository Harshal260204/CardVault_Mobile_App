import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

interface IllustrationProps {
  color: string;
  accent: string;
}

export function ScanIllustration({ color, accent }: IllustrationProps) {
  return (
    <Svg width={220} height={180} viewBox="0 0 220 180" fill="none">
      <Rect x={36} y={40} width={148} height={92} rx={12} stroke={color} strokeWidth={2.5} />
      <Line x1={52} y1={68} x2={168} y2={68} stroke={accent} strokeWidth={2} />
      <Line x1={52} y1={88} x2={132} y2={88} stroke={color} strokeWidth={2} opacity={0.55} />
      <Line x1={52} y1={108} x2={148} y2={108} stroke={color} strokeWidth={2} opacity={0.55} />
      <Path
        d="M110 24 L126 40 L110 56 L94 40 Z"
        stroke={accent}
        strokeWidth={2.5}
        fill="none"
      />
      <Line x1={110} y1={56} x2={110} y2={40} stroke={accent} strokeWidth={2} />
    </Svg>
  );
}

export function EnrichIllustration({ color, accent }: IllustrationProps) {
  return (
    <Svg width={220} height={180} viewBox="0 0 220 180" fill="none">
      <Circle cx={72} cy={88} r={28} stroke={color} strokeWidth={2.5} />
      <Path
        d="M72 116 C72 116 48 124 48 144 L96 144 C96 124 72 116 72 116 Z"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
      />
      <Rect x={118} y={52} width={64} height={40} rx={8} stroke={accent} strokeWidth={2.5} />
      <Line x1={130} y1={68} x2={170} y2={68} stroke={accent} strokeWidth={2} />
      <Line x1={130} y1={80} x2={158} y2={80} stroke={accent} strokeWidth={2} opacity={0.6} />
      <Line x1={100} y1={88} x2={118} y2={72} stroke={color} strokeWidth={2} />
      <Circle cx={156} cy={118} r={10} stroke={color} strokeWidth={2} />
      <Line x1={146} y1={118} x2={118} y2={96} stroke={color} strokeWidth={2} opacity={0.55} />
    </Svg>
  );
}

export function SyncIllustration({ color, accent }: IllustrationProps) {
  return (
    <Svg width={220} height={180} viewBox="0 0 220 180" fill="none">
      <Path
        d="M62 92 C62 68 82 52 110 52 C132 52 150 64 156 82"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
      />
      <Path
        d="M158 88 C158 112 138 128 110 128 C88 128 70 116 64 98"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
      />
      <Path d="M148 74 L156 82 L148 90" stroke={accent} strokeWidth={2.5} fill="none" />
      <Path d="M72 106 L64 98 L72 90" stroke={accent} strokeWidth={2.5} fill="none" />
      <Rect x={92} y={78} width={36} height={24} rx={6} stroke={accent} strokeWidth={2.5} />
      <Line x1={98} y1={90} x2={122} y2={90} stroke={accent} strokeWidth={2} />
    </Svg>
  );
}
