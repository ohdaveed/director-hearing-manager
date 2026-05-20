import { useMemo } from "react";

interface Action {
  text: string;
  party: string;
}

/**
 * Pure sorting hook: splits a predefined-action list into two groups —
 * selected items pinned to the top, unselected items below.
 *
 * @param predefinedActions - full ordered list for one party (Owner or Tenant)
 * @param selectedTexts     - Set of currently-selected action texts
 * @returns { selectedItems, unselectedItems, showDivider }
 */
export function useActionSorting(predefinedActions: Action[], selectedTexts: Set<string>) {
  return useMemo(() => {
    const selectedItems = predefinedActions
      .filter((a) => selectedTexts.has(a.text))
      .sort((a, b) => a.text.localeCompare(b.text));
    const unselectedItems = predefinedActions
      .filter((a) => !selectedTexts.has(a.text))
      .sort((a, b) => a.text.localeCompare(b.text));
    const showDivider = selectedItems.length > 0 && unselectedItems.length > 0;
    return { selectedItems, unselectedItems, showDivider };
  }, [predefinedActions, selectedTexts]);
}
