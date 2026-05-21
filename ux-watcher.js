const chokidar = require('chokidar');
const { exec } = require('child_process');

const watcher = chokidar.watch('src/components/**/*.tsx', { persistent: true });

watcher.on('change', (path) => {
  console.log(`Change detected in ${path}. Auditing...`);
  exec(`node run-audit.js "${path}"`, (err, stdout) => {
    if (err) console.error(err);
    else console.log(stdout);
  });
});
