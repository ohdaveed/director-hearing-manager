const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../.agents/skills');
const destDir = path.resolve(__dirname, '../.claude/skills');

function syncSkills() {
  try {
    console.log(`Syncing skills from ${srcDir} to ${destDir}...`);

    if (!fs.existsSync(srcDir)) {
      console.log(`Source directory ${srcDir} does not exist. Creating it...`);
      fs.mkdirSync(srcDir, { recursive: true });
    }

    if (fs.existsSync(destDir)) {
      console.log(`Clearing destination directory ${destDir}...`);
      fs.rmSync(destDir, { recursive: true, force: true });
    }

    fs.cpSync(srcDir, destDir, { recursive: true });
    console.log('Successfully synced skills.');
  } catch (error) {
    console.error('Error syncing skills:', error);
    process.exit(1);
  }
}

syncSkills();