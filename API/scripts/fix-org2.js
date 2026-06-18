const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  // replace exact matches that are throwing errors
  content = content.replace(/organizationId: user\.organizationId,/g, 'organizationId: user.organizationId!,');
  content = content.replace(/organizationId: user\.organizationId \}/g, 'organizationId: user.organizationId! }');
  fs.writeFileSync(filePath, content);
}

fixFile('src/modules/notifications/notifications.service.ts');

let spec = fs.readFileSync('src/modules/ocr/ocr.service.spec.ts', 'utf-8');
spec = spec.replace(/include: OCR_JOB_WITH_MATCHES_INCLUDE,/g, 'include: { cardImage: true },');
fs.writeFileSync('src/modules/ocr/ocr.service.spec.ts', spec);

