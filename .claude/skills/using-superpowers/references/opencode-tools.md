# OpenCode Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references                 | OpenCode equivalent                            |
| -------------------------------- | ---------------------------------------------- |
| `Read` (file reading)            | `read`                                         |
| `Write` (file creation)          | `write`                                        |
| `Edit` (file editing)            | `edit`                                         |
| `Bash` (run commands)            | `bash`                                         |
| `Grep` (search file content)     | `grep`                                         |
| `Glob` (search files by name)    | `glob`                                         |
| `TodoWrite` (task tracking)      | `todowrite`                                    |
| `Skill` tool (invoke a skill)    | `skill`                                        |
| `WebSearch`                      | `websearch`                                    |
| `WebFetch`                       | `webfetch`                                     |
| `Task` tool (dispatch subagent)  | `subagent` (use `explore`, `scout`, or `plan`) |
| `EnterPlanMode` / `ExitPlanMode` | Use `subagent(agent_name="plan", ...)`         |

## Additional OpenCode tools

| Tool          | Purpose                                                    |
| ------------- | ---------------------------------------------------------- |
| `lsp`         | "Go to Definition," "Find References," etc. (Experimental) |
| `apply_patch` | Apply unified diffs/patches                                |

## Subagent support

OpenCode supports specialized subagents via the `subagent` tool:

| Agent Name | Purpose                                            |
| ---------- | -------------------------------------------------- |
| `explore`  | Deep codebase navigation and architectural mapping |
| `scout`    | Initial research and information gathering         |
| `plan`     | Analysis and design without making file changes    |

To dispatch a subagent, use `subagent(agent_name="...", prompt="...")`.
