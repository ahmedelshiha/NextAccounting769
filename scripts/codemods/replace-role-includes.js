#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Roles we'll consider as role-check arrays
const ROLE_TOKENS = ['ADMIN','SUPER_ADMIN','STAFF','CLIENT','TEAM_LEAD','TEAM_MEMBER','OWNER']

function containsRoleToken(arrayContent) {
  return ROLE_TOKENS.some(t => new RegExp("['\"]"+t+"['\"]").test(arrayContent))
}

function replaceInFile(file) {
  let s = fs.readFileSync(file, 'utf8')
  let original = s
  // regex to match array literal of uppercase quoted tokens followed by .includes(...)
  const re = /\[\s*(['"][A-Z0-9_']+(?:\s*,\s*['"][A-Z0-9_']+)*)\s*\]\.includes\(\s*([^\)]+)\s*\)/g
  s = s.replace(re, (m, arrContent, inner) => {
    try {
      if (!containsRoleToken(arrContent)) return m
      // normalize array content spacing
      const normalizedArr = arrContent.split(',').map(x=>x.trim()).join(', ')
      // ensure inner is simple expression; preserve as-is
      return `hasRole(${inner.trim()}, [${normalizedArr}])`
    } catch (e) {
      return m
    }
  })

  // Also handle patterns like !allowed.includes(ctx.role) or allowed.includes(ctx.role)
  const reVar = /([a-zA-Z0-9_]+)\.includes\(\s*([^\)]+)\s*\)/g
  s = s.replace(reVar, (m, varName, inner) => {
    // check if varName is an array literal declared earlier in file like const allowed = ['ADMIN','STAFF']
    const varRe = new RegExp('const\\s+'+varName+'\\s*=\\s*\\[([^\]]*)\\]', 'g')
    const match = varRe.exec(original)
    if (match && containsRoleToken(match[1])) {
      return `hasRole(${inner.trim()}, [${match[1].split(',').map(x=>x.trim()).join(', ')}])`
    }
    return m
  })

  if (s !== original) {
    fs.writeFileSync(file, s, 'utf8')
    console.log('Updated', file)
    return true
  }
  return false
}

// Find files to process
const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', { nodir: true })
let changed = 0
for (const f of files) {
  try {
    const updated = replaceInFile(f)
    if (updated) changed++
  } catch (e) {
    console.error('Error processing', f, e)
  }
}
console.log(`Done. Files changed: ${changed}`)
