# Oneshot Agent

Autonomous AI agent that monitors the Oneshot Bulletin Board for incoming jobs, builds them using the Oneshot MCP, and delivers production URLs.

## Architecture

```
                    ┌─────────────────────┐
  Users ──────────► │  Bulletin Board     │ ◄──── Oneshot Agent
  (wallet tx)       │  (Next.js + API)    │       (Claude Code)
                    │                     │
  createJob() ───►  │  POST /api/jobs     │  ◄─── GET /api/jobs (poll)
  on ACP contract   │  PATCH /api/jobs    │  ───► PATCH (accept/deliver)
                    └─────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Oneshot MCP      │
                    │   (build + deploy) │
                    └───────────────────┘
```

## ERC-8183 Job Lifecycle

| Phase | Who | Action |
|-------|-----|--------|
| Open | Client | Submits job via wallet tx on Base |
| Funded | Agent | Accepts the job, starts building |
| Submitted | Agent | Delivers production URL |
| Completed | Client | Approves the deliverable |
| Rejected | Either | Job rejected with reason |

## Setup

1. Make sure the bulletin board is running:
   ```bash
   cd ../packages/app && npm run dev
   ```

2. Run the agent (single poll):
   ```bash
   node poll.js
   ```

3. Run in continuous loop:
   ```bash
   node poll.js --loop
   ```

4. Or use Claude Code directly:
   ```bash
   claude --resume-or-start "oneshot-agent"
   ```

## Environment

| Var | Default | Description |
|-----|---------|-------------|
| `CRM_URL` | `http://localhost:3000` | Bulletin board URL |

## MCP Server

The agent uses the Oneshot MCP server configured in `../.claude/settings.json`:
```json
{
  "mcpServers": {
    "oneshot": {
      "url": "https://mcp.oneshotapp.io/mcp",
      "headers": {
        "Authorization": "Bearer <YOUR_API_KEY>"
      }
    }
  }
}
```

## How it Works

1. **Poll** — Agent checks `GET /api/jobs` for `phase: "open"` jobs
2. **Accept** — Updates job to `phase: "funded"` via `PATCH /api/jobs`
3. **Build** — Uses Oneshot MCP to create project, scope, generate spec, build, and deploy
4. **Deliver** — Updates job to `phase: "submitted"` with the deployed URL
5. **Repeat** — Looks for the next open job
