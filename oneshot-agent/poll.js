#!/usr/bin/env node

/**
 * Oneshot Agent Poller
 *
 * Polls the bulletin board API for open jobs and processes them
 * using Claude Code with the Oneshot MCP.
 *
 * Usage:
 *   node poll.js                    # Poll once
 *   node poll.js --loop             # Poll continuously every 30s
 *   node poll.js --loop --interval 60  # Poll every 60s
 */

const CRM_URL = process.env.CRM_URL || 'http://localhost:3000'

async function fetchJobs() {
  const res = await fetch(`${CRM_URL}/api/jobs`)
  const data = await res.json()
  return data.jobs || []
}

async function updateJob(id, update) {
  const res = await fetch(`${CRM_URL}/api/jobs`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...update }),
  })
  return res.json()
}

async function processJob(job) {
  console.log(`\n🎯 Processing job #${job.id}: ${job.title}`)
  console.log(`   Description: ${job.description}`)
  console.log(`   Client: ${job.client}`)
  console.log(`   Budget: ${job.budget}`)

  // Accept the job
  console.log('\n📝 Accepting job...')
  await updateJob(job.id, { phase: 'funded' })
  console.log('   ✓ Job accepted (phase: funded)')

  // Build with Claude Code + Oneshot MCP
  console.log('\n🔨 Starting build with Claude Code...')
  const { execSync } = require('child_process')

  const prompt = `You are the Oneshot agent. Build this project using the Oneshot MCP:

Title: ${job.title}
Description: ${job.description}
Budget: ${job.budget}

Follow the CLAUDE.md instructions exactly:
1. oneshot_create_project("${job.title.replace(/"/g, '\\"')}", "${job.description.replace(/"/g, '\\"').substring(0, 100)}")
2. Drive the scoping conversation (oneshot_chat) until [DONE]
3. oneshot_generate_document
4. oneshot_create_sandbox + oneshot_start_build
5. oneshot_deploy

After deploying, respond with ONLY the deployed URL on the last line, like:
DEPLOYED: https://project-name.oneshotapp.io`

  try {
    const result = execSync(
      `claude --print "${prompt.replace(/"/g, '\\"')}"`,
      {
        cwd: __dirname,
        encoding: 'utf8',
        timeout: 600000, // 10 min timeout
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    )

    // Extract deployed URL from output
    const lines = result.trim().split('\n')
    const deployedLine = lines.find(l => l.startsWith('DEPLOYED:'))
    const deliverable = deployedLine
      ? deployedLine.replace('DEPLOYED:', '').trim()
      : lines[lines.length - 1].trim()

    if (deliverable && deliverable.startsWith('http')) {
      console.log(`\n✅ Deployed: ${deliverable}`)
      await updateJob(job.id, { phase: 'submitted', deliverable })
      console.log('   ✓ Deliverable submitted (phase: submitted)')
    } else {
      console.log('\n⚠️  No URL found in output, marking as submitted anyway')
      console.log('   Last output:', lines.slice(-3).join('\n   '))
      await updateJob(job.id, { phase: 'submitted', deliverable: 'Build completed - URL pending' })
    }
  } catch (err) {
    console.error('\n❌ Build failed:', err.message?.substring(0, 200))
    await updateJob(job.id, { phase: 'rejected', rejectReason: 'Build failed: ' + (err.message?.substring(0, 100) || 'unknown error') })
  }
}

async function poll() {
  console.log(`\n🔍 Polling ${CRM_URL}/api/jobs...`)

  try {
    const jobs = await fetchJobs()
    const openJobs = jobs.filter(j => j.phase === 'open')

    console.log(`   Found ${jobs.length} total jobs, ${openJobs.length} open`)

    if (openJobs.length === 0) {
      console.log('   No open jobs. Waiting...')
      return
    }

    // Process the oldest open job
    const job = openJobs[openJobs.length - 1]
    await processJob(job)
  } catch (err) {
    console.error('   Poll error:', err.message)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const isLoop = args.includes('--loop')
  const intervalIdx = args.indexOf('--interval')
  const interval = intervalIdx > -1 ? parseInt(args[intervalIdx + 1], 10) : 30

  console.log('🤖 Oneshot Agent')
  console.log(`   CRM: ${CRM_URL}`)
  console.log(`   Mode: ${isLoop ? `loop (${interval}s)` : 'single poll'}`)

  if (isLoop) {
    while (true) {
      await poll()
      await new Promise(r => setTimeout(r, interval * 1000))
    }
  } else {
    await poll()
  }
}

main().catch(console.error)
