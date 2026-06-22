const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        replaceInDir(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('@/hooks/useThemeColors') || content.includes('@/stores/theme-store')) {
        content = content.replace(/@\/hooks\/useThemeColors/g, '@/theme/useThemeColors');
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'app'));
replaceInDir(path.join(__dirname, 'components'));
replaceInDir(path.join(__dirname, 'lib'));
replaceInDir(path.join(__dirname, 'stores'));
console.log('Imports updated.');
