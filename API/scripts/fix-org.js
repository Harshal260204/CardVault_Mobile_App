const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  // replace exact matches that are throwing errors
  content = content.replace(/organizationId: user\.organizationId,/g, 'organizationId: user.organizationId!,');
  content = content.replace(/organizationId: user\.organizationId \}/g, 'organizationId: user.organizationId! }');
  content = content.replace(/user\.organizationId,\n            user\.id/g, 'user.organizationId!,\n            user.id');
  fs.writeFileSync(filePath, content);
}

fixFile('src/modules/ocr/ocr.service.ts');
fixFile('src/modules/sessions/sessions.service.ts');
