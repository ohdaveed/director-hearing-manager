# Cline Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references                 | Cline equivalent                                        |
| -------------------------------- | ------------------------------------------------------- |
| `Read` (file reading)            | `read_files`                                            |
| `Write` (file creation)          | `write_to_file`                                         |
| `Edit` (file editing)            | `replace_in_file` (or `apply_diff`)                     |
| `Bash` (run commands)            | `execute_command`                                       |
| `Grep` (search file content)     | `search_files`                                          |
| `Glob` (search files by name)    | `list_files`                                            |
| `Skill` tool (invoke a skill)    | `use_mcp_tool` (if exposed via MCP)                     |
| `WebFetch`                       | `browser_action`                                        |
| `WebSearch`                      | `browser_action` (navigate to search engine)            |
| `Task` tool (dispatch subagent)  | `use_mcp_tool` (to call another agent)                  |
| `TodoWrite` (task tracking)      | No equivalent — use file edits to `TODO.md` or comments |
| `EnterPlanMode` / `ExitPlanMode` | No equivalent — stay in the main session                |

## Additional Cline tools

| Tool                         | Purpose                                                    |
| ---------------------------- | ---------------------------------------------------------- |
| `list_code_definition_names` | List high-level symbols (classes, functions)               |
| `ask_followup_question`      | Ask the user a question                                    |
| `attempt_completion`         | Signal task completion and provide summary                 |
| `browser_action`             | Interact with websites (navigate, click, type, screenshot) |

## Subagent support

Cline supports subagents via **Model Context Protocol (MCP)**. If an agent is available as an MCP tool, use `use_mcp_tool` to interact with it. Otherwise, coordinate tasks within the main session using `execute_command` for background processes.
