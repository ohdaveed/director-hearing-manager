```markdown
# director-hearing-manager Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill covers the development patterns and conventions used in the `director-hearing-manager` TypeScript codebase. It documents file naming, import/export styles, commit patterns, and testing approaches to ensure consistency and maintainability. While no specific workflows were detected, this guide provides foundational practices for contributing effectively.

## Coding Conventions

### File Naming
- Use **PascalCase** for file names.
  - Example: `HearingManager.ts`, `UserService.ts`

### Import Style
- Use **alias imports** for modules.
  - Example:
    ```typescript
    import * as Utils from './Utils';
    import { Hearing } from './models/Hearing';
    ```

### Export Style
- Mixed export styles are used (both default and named exports).
  - Example:
    ```typescript
    // Named export
    export function scheduleHearing() { ... }

    // Default export
    export default class HearingManager { ... }
    ```

### Commit Patterns
- Commit messages are **freeform** with no strict prefixes.
- Average commit message length is about 34 characters.
  - Example: `Add initial hearing scheduling logic`

## Workflows

_No explicit workflows detected in the repository._

## Testing Patterns

- **Test Framework:** Unknown (not detected)
- **Test File Pattern:** Files named with `*.test.*`
  - Example: `HearingManager.test.ts`
- Tests are colocated with source files or in a parallel structure.
- To run tests, use your preferred TypeScript test runner (e.g., Jest, Mocha).

  Example test file:
  ```typescript
  import { scheduleHearing } from './HearingManager';

  describe('scheduleHearing', () => {
    it('should create a new hearing', () => {
      // test implementation
    });
  });
  ```

## Commands
| Command | Purpose |
|---------|---------|
| /test   | Run all tests in files matching `*.test.*` |
| /lint   | Lint the codebase according to TypeScript standards |
| /build  | Compile the TypeScript source files |
```