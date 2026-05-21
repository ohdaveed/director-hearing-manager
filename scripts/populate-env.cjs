const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const templatePath = path.join(projectRoot, '.env.pass.template');
const outputPath = path.join(projectRoot, '.env');

if (!fs.existsSync(templatePath)) {
  console.error('Missing .env.pass.template.');
  console.error('Create it from .env.pass.template.example and replace each pass:// URI with your Proton Pass references.');
  process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf8');
if (template.includes('SHARE_ID') || template.includes('ITEM_ID')) {
  console.error('.env.pass.template still contains placeholder Proton Pass references.');
  console.error('Replace placeholders with real references such as {{ pass://SHARE_ID/ITEM_ID/FIELD }}.');
  process.exit(1);
}

try {
  execFileSync(
    'pass-cli',
    ['inject', '--force', '--file-mode', '0600', '--in-file', templatePath, '--out-file', outputPath],
    { cwd: projectRoot, stdio: 'inherit' },
  );
  console.log('Successfully populated .env from Proton Pass CLI.');
} catch (error) {
  console.error('Failed to populate .env with pass-cli inject.');
  console.error('Run `pass-cli test` to verify your session, then check .env.pass.template references.');
  process.exit(error.status || 1);
}
