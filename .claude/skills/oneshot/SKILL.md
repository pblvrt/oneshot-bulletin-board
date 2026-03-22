---
name: oneshot
description: Build and deploy web applications through Oneshot's MCP server. Use when the user wants to create a new project, scope product requirements through AI conversation, generate specifications, build code in cloud sandboxes, or deploy to production. Covers the full lifecycle from idea to deployed app at yourproject.oneshotapp.io.
---

# Oneshot MCP

Build and deploy web apps from idea to production URL. Oneshot handles scoping, code generation, and deployment — you drive the process through 17 tools across 5 phases.

## Workflow

**Always follow this order. Each phase requires the previous one.**

```
1. Create project  →  2. Scope  →  3. Generate spec  →  4. Build  →  5. Deploy
```

### Phase 1: Create Project

```
oneshot_create_project(name, description?, template?)
```

- `template`: `"simple-website"` (Astro + Tailwind) or `"nextjs"` (Next.js + SQLite + Better Auth)
- Default is `simple-website`. Pick `nextjs` only if the app needs auth, a database, or server-side logic.
- Returns a `projectId` — use it for every subsequent call.

### Phase 2: Scope

```
oneshot_chat(projectId, message)
```

Scoping is a multi-turn conversation with an AI Product Consultant. **You drive this conversation on behalf of the user.** The user does NOT interact with the consultant directly — you do.

**How to run scoping:**

1. Start by passing the user's requirements into `oneshot_chat`. Include everything the user told you — what they want to build, who it's for, features they mentioned, design preferences.
2. The consultant will respond with a clarifying question (one at a time).
3. **Answer the question yourself** based on what the user already told you. If the user didn't mention something, make a reasonable decision that fits the project — you're a senior engineer, use your judgment.
4. Keep calling `oneshot_chat` with your answers until the response contains `[DONE]`.
5. If you genuinely don't know something critical (e.g., the user's brand colors, pricing model, or business-specific domain knowledge), ask the user before responding to the consultant.

**Rules:**
- Typical scoping takes 3-8 messages. Don't rush — spec quality determines build quality.
- Front-load your first message with as much detail as possible. The more context you give upfront, the fewer back-and-forth rounds needed.
- Don't ask the user for every small decision. Use good defaults. Only escalate to the user for things you truly can't infer.

Check previous conversation: `oneshot_get_chat_history(projectId)`

### Phase 3: Generate Specification

```
oneshot_generate_document(projectId)
```

- Converts the scoping conversation into a structured product spec.
- **Requires at least one chat message.** Ideally, scoping should be `[DONE]` first.
- Review the spec: `oneshot_get_document(projectId)`
- If the spec is missing something, go back to `oneshot_chat` to add context, then regenerate.

### Phase 4: Build

**Step 1: Create sandbox**

```
oneshot_create_sandbox(projectId)
```

- Creates an E2B cloud sandbox with a live preview URL.
- Idempotent — if a live sandbox already exists, returns it.
- Sandbox expires after ~10 minutes of inactivity. Use `oneshot_create_sandbox` again to get a fresh one.

**Step 2: Start build**

```
oneshot_start_build(projectId)
```

- Sends the spec to OpenCode, which generates the full application.
- Takes 1-5 minutes. Returns build status, duration, and preview URL.
- The preview URL is live immediately after build completes.
- **Use this exactly once** per project for the initial build.

**Step 3: Iterate**

```
oneshot_send_message(projectId, message)
```

- Send follow-up instructions to modify the built app ("change the hero color to blue", "add a contact form").
- Each message triggers a new OpenCode run that modifies the existing code.
- Check the preview URL after each iteration.

**Utilities:**

```
oneshot_get_sandbox_status(projectId)   — Check if sandbox is alive, dev server running
oneshot_exec_command(projectId, command) — Run any bash command in the sandbox
```

### Phase 5: Deploy

```
oneshot_deploy(projectId)
```

- Deploys to production via Coolify. Requires the project to have a git repo (created automatically during build if `GITHUB_TOKEN` is set).
- Returns a production URL: `https://yourproject-abc123.oneshotapp.io`
- Check status: `oneshot_get_deployment(projectId)`

## BYOP (Bring Your Own Provider)

Users can connect their own Anthropic (Claude) or OpenAI (ChatGPT) subscriptions to avoid using Oneshot credits for builds.

```
oneshot_connect_provider(provider)         → Returns auth URL for user to visit
oneshot_complete_provider_auth(callbackUrl) → Completes OAuth with the redirect URL
oneshot_get_provider_status()              → Check which providers are connected
oneshot_disconnect_provider(provider?)     → Disconnect one or all
```

**Flow:** Call `connect_provider` → give the user the auth URL → user visits and authorizes → user copies the redirect URL back → call `complete_provider_auth` with that URL. The auth flow expires after 10 minutes.

## Common Mistakes

1. **Building without a spec.** Always `oneshot_generate_document` before `oneshot_create_sandbox`. The build uses the spec as its blueprint. No spec = aimless code generation.
2. **Using `start_build` for iterations.** `start_build` is the initial build from the spec — use it once. Use `send_message` for all follow-up changes.
3. **Not checking sandbox status.** Sandboxes expire after ~10 min of inactivity. If a build fails with a connection error, call `oneshot_create_sandbox` again.
4. **Deploying without git.** `oneshot_deploy` requires the project to have been built (which creates the git repo). Check `oneshot_get_project` — if `git_repo_url` is null, build first.
5. **Rushing scoping.** The spec is only as good as the conversation. Don't just send one message and generate. Answer the consultant's questions thoughtfully — 3-8 rounds produces a much better spec.
6. **Asking the user every scoping question.** You're the agent — answer the consultant's questions yourself based on what the user told you. Only ask the user when you genuinely lack critical information (brand colors, pricing, domain-specific decisions).
7. **Creating duplicate sandboxes.** `oneshot_create_sandbox` is idempotent — it returns the existing sandbox if one is alive. No need to track sandbox state manually.

## Tool Quick Reference

| Tool | Phase | Description |
|------|-------|-------------|
| `oneshot_create_project` | 1 | Create project with name and template |
| `oneshot_list_projects` | Any | List all user projects |
| `oneshot_get_project` | Any | Get project details, sandbox status, git URL |
| `oneshot_delete_project` | Any | Delete project and all data |
| `oneshot_chat` | 2 | Chat with AI Product Consultant |
| `oneshot_get_chat_history` | 2 | View scoping conversation |
| `oneshot_generate_document` | 3 | Generate product specification |
| `oneshot_get_document` | 3 | Read current specification |
| `oneshot_create_sandbox` | 4 | Create/reconnect cloud sandbox |
| `oneshot_start_build` | 4 | Build app from spec (use once) |
| `oneshot_send_message` | 4 | Send iteration instructions |
| `oneshot_get_sandbox_status` | 4 | Check sandbox health |
| `oneshot_exec_command` | 4 | Run bash command in sandbox |
| `oneshot_deploy` | 5 | Deploy to production |
| `oneshot_get_deployment` | 5 | Check deployment status |
| `oneshot_connect_provider` | Any | Start OAuth for BYOP |
| `oneshot_complete_provider_auth` | Any | Complete OAuth flow |
| `oneshot_get_provider_status` | Any | Check connected providers |
| `oneshot_disconnect_provider` | Any | Remove provider connection |

## Example: Full Project Lifecycle

The user says: *"Build me a calorie tracking app where I can log meals and see how I'm doing each week."*

```
# 1. Create — you pick the template based on what's needed
oneshot_create_project("FitTrack", "Calorie tracking app with meal logging", "nextjs")

# 2. Scope — you drive the conversation with the AI consultant
oneshot_chat(projectId, "I want to build a calorie tracking app. Users should be able to log meals with food name, calories, protein, carbs, and fat. There should be a dashboard showing daily totals and weekly trends as charts. It needs user auth so each person sees only their own data.")
# → Consultant asks: "What should the meal logging flow look like — a simple form, or should users be able to search from a food database?"
oneshot_chat(projectId, "A simple form where users type in the food name and nutritional values manually. No external food database needed for MVP.")
# → Consultant asks: "For the weekly trends, what kind of charts — bar charts for daily totals, line charts for trends over time, or both?"
oneshot_chat(projectId, "Both — bar charts for daily calorie totals and line charts for macros over the week.")
# → Consultant asks about visual direction...
oneshot_chat(projectId, "Clean and minimal, light theme, green accents for health/fitness vibe.")
# → Consultant responds with summary + [DONE]

# 3. Generate spec
oneshot_generate_document(projectId)

# 4. Build
oneshot_create_sandbox(projectId)
oneshot_start_build(projectId)
# Preview URL is live — check it
oneshot_send_message(projectId, "Add a dark mode toggle in the header")

# 5. Deploy
oneshot_deploy(projectId)
# → https://fittrack-a1b2c3.oneshotapp.io
```
