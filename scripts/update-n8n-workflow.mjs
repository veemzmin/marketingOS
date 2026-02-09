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

const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/workflows/${workflowId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': apiKey,
  },
  body: JSON.stringify(workflow),
})

if (!response.ok) {
  const message = await response.text()
  console.error(`Failed to update workflow: ${response.status} ${message}`)
  process.exit(1)
}

console.log('Workflow updated successfully.')
