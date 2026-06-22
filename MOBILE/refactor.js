const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, 'app', '(tabs)', 'home.tsx');
let content = fs.readFileSync(homePath, 'utf8');

// 1. Replace RN Text import with our Text
content = content.replace(/import \{([\s\S]*?)Text,([\s\S]*?)\} from 'react-native';/, "import {$1$2} from 'react-native';\nimport { Text } from '@/components/Text';");
content = content.replace(/import \{([\s\S]*?)Text\s*\} from 'react-native';/, "import {$1} from 'react-native';\nimport { Text } from '@/components/Text';");

// 2. Map styles to variants
// We will simply inject variant="" to Text tags based on the style name they use if we can, 
// or just set a default variant and strip font properties from StyleSheet.
// Since it's hard to parse AST perfectly, let's just strip fontSize and fontWeight from the StyleSheet
// and let the components fallback to default 'body' or we can replace specific ones.

const replacements = [
  { className: 'greeting', variant: 'h2' },
  { className: 'orgName', variant: 'micro' },
  { className: 'statusText', variant: 'micro' },
  { className: 'syncPillText', variant: 'micro' },
  { className: 'sectionTitle', variant: 'bodyStrong' },
  { className: 'modeItemName', variant: 'bodyStrong' },
  { className: 'modeItemBadgeText', variant: 'micro' },
  { className: 'modeItemDesc', variant: 'caption' },
  { className: 'sectionBadge', variant: 'caption' },
  { className: 'modeText', variant: 'micro' },
  { className: 'liveDot', variant: 'micro' },
  { className: 'avatarInitials', variant: 'micro' },
  { className: 'sessionName', variant: 'bodyStrong' },
  { className: 'progressText', variant: 'caption' },
  { className: 'timeText', variant: 'micro' },
  { className: 'statLabel', variant: 'micro' },
  { className: 'statCount', variant: 'caption' },
  { className: 'resumeText', variant: 'caption' },
  { className: 'emptyText', variant: 'caption' },
  { className: 'browseBtnText', variant: 'caption' },
];

for (const { className, variant } of replacements) {
  const regex = new RegExp(`(<Text[^>]*style={\\[?styles\\.${className}[^\\]]*\\]?}[^>]*>)`, 'g');
  content = content.replace(regex, (match, p1) => {
    if (p1.includes('variant=')) return match;
    return p1.replace('<Text', `<Text variant="${variant}"`);
  });
}

// Any remaining Text tags might not have a variant, they default to 'body'. 

// 3. Strip fontSize and fontWeight from StyleSheet
content = content.replace(/fontSize:\s*\d+,?\s*/g, '');
content = content.replace(/fontWeight:\s*['"]\d+['"],?\s*/g, '');

fs.writeFileSync(homePath, content, 'utf8');
console.log('Refactored home.tsx');
