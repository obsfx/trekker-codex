# Trekker Codex Plugin

Codex plugin for [Trekker](https://github.com/obsfx/trekker), the AI-oriented issue tracker built for coding agents.

Repository: [github.com/obsfx/trekker-codex](https://github.com/obsfx/trekker-codex)

This port keeps the Trekker MCP server and the core task-tracking workflow, then adapts the Claude-specific layer into Codex-native pieces:

- 26 bundled Trekker MCP tools
- 10 Codex skills for search, planning, task flow, and issue tracking
- 1 `SessionStart` hook for context recovery

## What This Plugin Does

Once installed, Codex can use Trekker as persistent task memory instead of relying on chat context alone.

The plugin provides:

- task, epic, subtask, comment, dependency, search, ready, and system MCP tools
- search-first workflow skills for starting, finishing, and querying tracked work
- a session-start hook that surfaces in-progress or ready work when a project already has `.trekker`

## What Changed From The Claude Plugin

This is not a literal one-to-one copy of the Claude Code plugin.

Kept:

- the local Node MCP server
- Trekker workflow guidance
- search-first task tracking model
- session context recovery on startup

Intentionally not ported:

- Claude slash commands
- Claude task-agent command wrappers
- TodoWrite-specific sync behavior
- Claude-only task-blocking hooks and auto-complete stop hooks

Those parts were replaced with Codex skills and a lighter hook setup that fits Codex better.

## Prerequisites

- [Bun](https://bun.sh) installed
- `trekker` CLI installed globally
- Node.js 18 or newer
- Codex with local plugin support

Install Trekker globally with either:

```bash
bun install -g @obsfx/trekker
```

or:

```bash
npm install -g @obsfx/trekker
```

## Installation

The plugin is designed as a home-local Codex plugin:

- plugin path: `~/plugins/trekker-codex`
- marketplace file: `~/.agents/plugins/marketplace.json`

This repo also includes a repo-scoped marketplace at `.agents/plugins/marketplace.json` so Codex can discover `trekker-codex` directly when you open this repository. Because the plugin itself lives at the repo root, that marketplace entry points `source.path` at `./`.

No build step or package-manager install step is required for installation. The MCP server runs directly from `mcp-server/src/index.js` and uses only Node.js plus the `trekker` CLI.

### Option A: Install From GitHub

Clone the published repository into `~/plugins`:

```bash
mkdir -p ~/plugins
git clone git@github.com:obsfx/trekker-codex.git ~/plugins/trekker-codex
```

### Option B: Install From Your Current Local Checkout

If you want to test the plugin before or after publishing, symlink the current checkout:

```bash
mkdir -p ~/plugins
ln -sfn /absolute/path/to/trekker-codex ~/plugins/trekker-codex
```

For this workspace, that path is:

```bash
ln -sfn /Users/omercanbalandi/workspace/trekker-codex ~/plugins/trekker-codex
```

### Register The Plugin In Codex

Create `~/.agents/plugins/marketplace.json` if it does not exist yet:

```json
{
  "name": "local-plugins",
  "interface": {
    "displayName": "Local Plugins"
  },
  "plugins": [
    {
      "name": "trekker-codex",
      "source": {
        "source": "local",
        "path": "./plugins/trekker-codex"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Coding"
    }
  ]
}
```

If `~/.agents/plugins/marketplace.json` already exists, append or update this entry inside the `plugins` array:

```json
{
  "name": "trekker-codex",
  "source": {
    "source": "local",
    "path": "./plugins/trekker-codex"
  },
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  },
  "category": "Coding"
}
```

After that:

1. Restart Codex.
2. Open a project that already uses Trekker, or initialize Trekker in a test project with `trekker init`.
3. Verify that the `Trekker` plugin appears in Codex.

## Quick Verification

In a scratch project under `/tmp`:

```bash
mkdir -p /tmp/trekker-plugin-test
cd /tmp/trekker-plugin-test
trekker init
trekker task create -t "Verify Codex plugin installation" -d "Check that Codex can see and manage Trekker tasks" -p 1
```

Then ask Codex something like:

```text
Use Trekker to search current work, show me ready tasks, and summarize what is in progress.
```

Expected behavior:

- the session-start hook shows Trekker context when Codex opens the workspace
- Codex can use Trekker MCP tools
- Trekker workflow skills are available for search, planning, starting, and completing work

## Usage Notes

The plugin assumes Trekker is the persistent source of truth.

Recommended workflow:

1. Search before any task action.
2. Read task details, comments, history, and dependencies before changing state.
3. Mark a task `in_progress` before working on it.
4. Leave `Checkpoint:` comments when pausing.
5. Leave a `Summary:` comment before marking work `completed`.

If the current workspace does not have `.trekker`, ask before running `trekker init`.

## Skills Included

- `trekker`
- `planning`
- `task-sync`
- `issue-tracking`
- `search`
- `find-duplicates`
- `smart-query`
- `start-task`
- `complete-task`
- `task-agent`

## Project Structure

```text
trekker-codex/
├── .codex-plugin/
│   └── plugin.json
├── .mcp.json
├── hooks.json
├── assets/
│   └── trekker.svg
├── mcp-server/
│   ├── package.json
│   ├── src/
│   │   ├── index.js
│   │   ├── mcp-server.js
│   │   └── tools/
│   └── test/
│       └── server.test.js
├── scripts/
│   └── session-start.sh
└── skills/
    ├── complete-task/
    ├── find-duplicates/
    ├── issue-tracking/
    ├── planning/
    ├── search/
    ├── smart-query/
    ├── start-task/
    ├── task-agent/
    ├── task-sync/
    └── trekker/
```

## Updating The Plugin

If you installed through a symlink, pull the latest changes in the repo and restart Codex.

If you installed through a clone in `~/plugins/trekker-codex`, pull there and restart Codex.

If MCP tool definitions change in `mcp-server/src`, restart Codex after pulling the update. No rebuild or package-manager install step is required.
