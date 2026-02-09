import fs from 'fs'
import path from 'path'
import process from 'process'

const workflowPath = path.join(process.cwd(), 'Marketing-AI-Agent-Updated.json')
const workflowId = process.env.N8N_WORKFLOW_ID
const apiUrl = process.env.N8N_API_URL
const apiKey = process.env.N8N_API_KEY

if (!workflowId || !apiUrl || !apiKey) {
  console.error('Missing N8N_API_URL, N8N_API_KEY, or N8N_WORKFLOW_ID.')
  process.exit(1)
}

const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'))

// n8n API rejects extra fields from exported JSON (e.g., meta, pinData, versionId).
// Keep only the allowed top-level fields.
const payload = {
  name: workflow.name,
  nodes: workflow.nodes,
  connections: workflow.connections,
  settings: workflow.settings || {},
  tags: workflow.tags || [],
}

const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': apiKey,
  },
  body: JSON.stringify(payload),
})

if (!response.ok) {
  const message = await response.text()
  console.error(`Failed to update workflow: ${response.status} ${message}`)
  process.exit(1)
}

console.log('Workflow updated successfully.')
