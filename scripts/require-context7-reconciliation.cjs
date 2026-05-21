"use strict";

const { addError } = require("markdownlint-rule-helpers");

module.exports = {
  names: ["require-context7-reconciliation"],
  description: "Task plans must include a Research phase for Context7 reconciliation",
  tags: ["context7", "planning"],
  function: function (params, onError) {
    const { name } = params;
    // Only apply to conductor/**/plan.md files
    // Note: markdownlint-cli2 passes the relative path from the root
    if (!name.includes("conductor/") || !name.endsWith("/plan.md")) {
      return;
    }

    const content = params.lines.join("\n");
    const hasReconcile = /Research\s*&\s*Reconcile/i.test(content);
    const hasContext7 = /Context7/i.test(content);

    if (!hasReconcile && !hasContext7) {
      addError(onError, 1, "Mandatory Context7 reconciliation phase is missing in plan. Expected 'Research & Reconcile' or 'Context7' keywords.");
    }
  }
};
