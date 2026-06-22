import { lightColors, darkColors } from '../tokens/colors';

interface ContrastPair {
  name: string;
  text: string;
  bg: string;
}

// WCAG relative luminance formula
function getLuminance(hex: string): number {
  if (hex.startsWith('#')) hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }

  const r8 = parseInt(hex.slice(0, 2), 16);
  const g8 = parseInt(hex.slice(2, 4), 16);
  const b8 = parseInt(hex.slice(4, 6), 16);

  const [r, g, b] = [r8, g8, b8].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (lightest + 0.05) / (darkest + 0.05);
}

function checkPairs(modeName: string, pairs: ContrastPair[]): void {
  console.log(`\nChecking ${modeName}...`);
  for (const pair of pairs) {
    const ratio = getContrastRatio(pair.text, pair.bg);

    if (ratio < 4.5) {
      console.error(
        `❌ ${pair.name}: ${ratio.toFixed(2)}:1 (FAIL) - text: ${pair.text}, bg: ${pair.bg}`,
      );
      hasError = true;
    } else {
      console.log(
        `✅ ${pair.name}: ${ratio.toFixed(2)}:1 (PASS) - text: ${pair.text}, bg: ${pair.bg}`,
      );
    }
  }
}

const semantics = ['success', 'warning', 'error', 'info'] as const;
const modes = [
  { name: 'Light Mode', tokens: lightColors },
  { name: 'Dark Mode', tokens: darkColors },
];

let hasError = false;

for (const mode of modes) {
  const semanticPairs: ContrastPair[] = semantics.map((semantic) => ({
    name: semantic,
    text: mode.tokens[semantic].text,
    bg: mode.tokens[semantic].bg,
  }));

  checkPairs(`${mode.name} semantic surfaces`, semanticPairs);
}

const darkSurfacePairs: ContrastPair[] = [
  {
    name: 'badge-neutral (primary-500 on neutral-100)',
    text: darkColors.primary[500],
    bg: darkColors.neutral[100],
  },
  {
    name: 'chip-selected (primary-500 on primary-100)',
    text: darkColors.primary[500],
    bg: darkColors.primary[100],
  },
  {
    name: 'segment-selected (primary-500 on neutral-200)',
    text: darkColors.primary[500],
    bg: darkColors.neutral[200],
  },
  {
    name: 'banner-info on elevation-2',
    text: darkColors.info.text,
    bg: darkColors.neutral[100],
  },
  {
    name: 'banner-success on elevation-2',
    text: darkColors.success.text,
    bg: darkColors.neutral[100],
  },
  {
    name: 'banner-warning on elevation-2',
    text: darkColors.warning.text,
    bg: darkColors.neutral[100],
  },
  {
    name: 'count-badge (primary-500 on neutral-200)',
    text: darkColors.primary[500],
    bg: darkColors.neutral[200],
  },
  {
    name: 'muted on elevation-2',
    text: darkColors.neutral[600],
    bg: darkColors.neutral[100],
  },
];

checkPairs('Dark Mode elevation surfaces', darkSurfacePairs);

if (hasError) {
  process.exit(1);
} else {
  console.log(
    '\n🎉 All semantic and elevation color pairs meet WCAG AA 4.5:1 contrast requirements!',
  );
}
