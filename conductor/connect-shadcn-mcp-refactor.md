# Implementation Plan: Connect shadcn MCP and Refactor UI Components

## Objective

Configure the `shadcn` MCP server to enable automated component discovery and management, then perform a systematic refactoring of the `src/components` directory to replace raw `div` elements with standard `shadcn/ui` components, improving accessibility, design consistency, and maintainability.

## Key Files & Context

- `components.json`: Current shadcn project configuration.
- `src/components/ui/`: Existing shadcn UI components.
- `src/components/`: Target files for refactoring (e.g., `ComplaintDetailView.tsx`, `InspectionDetailPanel.tsx`, etc.).

## Implementation Steps

### Phase 1: Connect & Configure shadcn MCP

1. Verify the `shadcn` MCP server installation and accessibility via the Gemini CLI toolset.
2. Ensure the MCP is correctly registered in `.gemini/settings.json` (or equivalent configuration).
3. Confirm connectivity by running a test command (e.g., `npx shadcn@latest info`).

### Phase 2: Audit and Strategy

1. Perform a file-by-file audit of `src/components/` to identify high-density `div` usage patterns that could be replaced by:
   - `Card` components for sectioning.
   - `FieldGroup`/`Field` for form layouts.
   - `Separator` instead of `<hr>` or border `div`s.
   - `Badge` instead of custom styled `span`/`div`.
2. Prioritize components based on complexity and frequency of use.

### Phase 3: Systematic Refactoring

1. **Prepare**: For each component, identify the target `div` sections.
2. **Execute**:
   - Replace raw layout `div`s with `shadcn` primitives.
   - Ensure `className` usage follows [styling.md](./rules/styling.md).
   - Verify accessibility (e.g., ensuring `Dialog` components have titles).
3. **Verify**: Run `npm run build` or the project-specific test suite to ensure no visual regressions occur.

### Phase 4: Final Review

1. Conduct a visual check of refactored components to ensure styles remain cohesive.
2. Verify that `components.json` accurately reflects the project state.

## Verification & Testing

- **Visual Regression Testing**: Check affected components in the development browser (e.g., `localhost:5173`).
- **Build Integrity**: Ensure the build process completes without errors.
- **Accessibility Audit**: Check that replaced components (especially overlays and form elements) maintain or improve accessibility.
