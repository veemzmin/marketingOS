/* eslint-disable no-console */
const fs = require("fs")
const path = require("path")

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function copyFileIfExists(src, destDir) {
  if (!fs.existsSync(src)) {
    return false
  }
  ensureDir(destDir)
  const dest = path.join(destDir, path.basename(src))
  fs.copyFileSync(src, dest)
  return true
}

function copyEngines() {
  const repoRoot = process.cwd()
  const generatedDir = path.join(repoRoot, "generated", "prisma")
  const nextServerDir = path.join(repoRoot, ".next", "server")

  if (!fs.existsSync(generatedDir)) {
    console.warn("No generated Prisma directory found.")
    return
  }

  if (!fs.existsSync(nextServerDir)) {
    console.warn("No .next/server directory found. Did you run next build?")
    return
  }

  const entries = fs.readdirSync(generatedDir)
  const engineFiles = entries.filter(
    (name) => name.startsWith("query-engine-") || name.startsWith("libquery_engine-")
  )

  if (engineFiles.length === 0) {
    console.warn("No Prisma engine files found to copy.")
    return
  }

  let copied = 0
  for (const file of engineFiles) {
    const src = path.join(generatedDir, file)
    if (copyFileIfExists(src, nextServerDir)) {
      copied += 1
    }
  }

  const generatedTarget = path.join(nextServerDir, "generated", "prisma")
  ensureDir(generatedTarget)
  for (const file of engineFiles) {
    const src = path.join(generatedDir, file)
    if (copyFileIfExists(src, generatedTarget)) {
      copied += 1
    }
  }

  console.log(`Copied ${copied} Prisma engine file(s) into .next/server`)
}

copyEngines()
