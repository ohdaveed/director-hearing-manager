"use strict";

module.exports = {
  customRules: [
    "./scripts/require-context7-reconciliation.cjs"
  ],
  config: {
    "default": true,
    "require-context7-reconciliation": true,
    // Disable some common noisy rules if necessary, but keep it strict for now
    "MD013": false, // Line length
    "MD033": false  // Inline HTML
  },
  globs: [
    "conductor/**/plan.md"
  ]
};
