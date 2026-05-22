const { execSync } = require("child_process");

function getSecret(name) {
  try {
    return execSync(`pass show director-hearing/${name}`, { encoding: "utf8" }).trim();
  } catch (e) {
    console.error(`Error: Could not find secret 'director-hearing/${name}' in pass.`);
    process.exit(1);
  }
}
module.exports = { getSecret };
