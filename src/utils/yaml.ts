// Lightweight YAML serialization/deserialization without external dependencies

// ─── JSON → YAML serializer ─────────────────────────────────────────────────

function needsQuoting(s: string): boolean {
  if (s === '') return true
  // YAML booleans / nulls / numbers that would be misinterpreted
  if (/^(true|false|yes|no|on|off|null|~)$/i.test(s)) return true
  // Starts with special chars
  if (/^[&*!|>{}[\],%#@`]/.test(s)) return true
  // Looks like a number / date
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s)) return true
  if (/^\d{4}[-/]/.test(s)) return true
  // Contains colon+space, hash, leading/trailing whitespace
  if (/[:#]/.test(s)) return true
  if (s !== s.trim()) return true
  return false
}

function escapeYamlString(s: string): string {
  if (!needsQuoting(s) && !s.includes('\n') && !s.includes('"') && !s.includes("'")) {
    return s
  }
  // Try single quotes first (cleaner for most strings)
  if (!s.includes("'")) {
    return `'${s}'`
  }
  // Fall back to double quotes
  const escaped = s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
  return `"${escaped}"`
}

function toYaml(value: any, indent: number, level: number): string {
  const pad = ' '.repeat(indent * level)

  if (value === null || value === undefined) {
    return 'null'
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'string') {
    if (value.includes('\n')) {
      // Use block scalar for multiline strings
      const lines = value.split('\n')
      return '|\n' + lines.map(l => pad + '  ' + l).join('\n')
    }
    return escapeYamlString(value)
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map(item => {
      const serialized = toYaml(item, indent, level + 1)
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        // Complex item: use block sequence with first key inline
        const lines = serialized.split('\n')
        return pad + '- ' + lines[0].trimStart() + (lines.length > 1 ? '\n' + lines.slice(1).join('\n') : '')
      }
      if (Array.isArray(item) && item.length > 0) {
        return pad + '- ' + serialized.split('\n').join('\n' + pad + '  ')
      }
      return pad + '- ' + serialized
    })
    return items.join('\n')
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 0) return '{}'
    const entries = keys.map(key => {
      const val = value[key]
      const escapedKey = escapeYamlString(key)
      if (typeof val === 'object' && val !== null) {
        const serialized = toYaml(val, indent, level + 1)
        if (Array.isArray(val) && val.length > 0) {
          return pad + escapedKey + ':\n' + serialized
        }
        if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length > 0) {
          return pad + escapedKey + ':\n' + serialized
        }
        return pad + escapedKey + ': ' + serialized
      }
      return pad + escapedKey + ': ' + toYaml(val, indent, level + 1)
    })
    return entries.join('\n')
  }
  return String(value)
}

// ─── YAML → JSON deserializer (simple recursive descent) ────────────────────

interface ParseCtx {
  lines: string[]
  pos: number
}

function getIndent(line: string): number {
  let i = 0
  while (i < line.length && line[i] === ' ') i++
  return i
}

function parseValue(ctx: ParseCtx, minIndent: number): any {
  while (ctx.pos < ctx.lines.length) {
    const raw = ctx.lines[ctx.pos]
    if (raw.trim() === '' || raw.trim().startsWith('#')) {
      ctx.pos++
      continue
    }
    const indent = getIndent(raw)
    if (indent < minIndent) return undefined
    const content = raw.slice(indent)

    // Check if it's a mapping (key: value or key:\n...)
    if (indent === minIndent) {
      // Try mapping entry
      const mapResult = tryParseMappingEntry(ctx, minIndent)
      if (mapResult !== undefined) return mapResult

      // Try sequence entry
      if (content.startsWith('- ')) {
        return parseSequence(ctx, minIndent)
      }
    }
    break
  }
  return undefined
}

function tryParseMappingEntry(ctx: ParseCtx, minIndent: number): Record<string, any> | undefined {
  const result: Record<string, any> = {}
  let first = true

  while (ctx.pos < ctx.lines.length) {
    const raw = ctx.lines[ctx.pos]
    if (raw.trim() === '' || raw.trim().startsWith('#')) {
      ctx.pos++
      continue
    }
    const indent = getIndent(raw)
    if (indent < minIndent) break
    if (indent > minIndent && !first) break
    if (indent > minIndent && first) break

    const content = raw.slice(indent)
    if (content.startsWith('- ')) break // It's a sequence, not mapping

    const colonMatch = content.match(/^([^:]+?):\s*(.*)/)
    if (!colonMatch) break

    let key = colonMatch[1].trim()
    key = unquoteYaml(key)
    const rest = colonMatch[2]
    ctx.pos++

    if (rest === '' || rest === undefined) {
      // Value is on next lines (nested object or array)
      const val = parseValue(ctx, indent + 2)
      if (val === undefined) {
        result[key] = null
      } else {
        result[key] = val
      }
    } else {
      result[key] = parseScalar(rest)
    }
    first = false
  }

  return first ? undefined : result
}

function parseSequence(ctx: ParseCtx, minIndent: number): any[] {
  const result: any[] = []

  while (ctx.pos < ctx.lines.length) {
    const raw = ctx.lines[ctx.pos]
    if (raw.trim() === '' || raw.trim().startsWith('#')) {
      ctx.pos++
      continue
    }
    const indent = getIndent(raw)
    if (indent < minIndent) break

    const content = raw.slice(indent)
    if (!content.startsWith('- ')) break

    const afterDash = content.slice(2)
    if (afterDash === '') {
      ctx.pos++
      const val = parseValue(ctx, indent + 2)
      result.push(val === undefined ? null : val)
    } else if (afterDash.includes(': ')) {
      // Inline mapping start: - key: value
      // Put the line back with adjusted indent to parse as mapping
      ctx.lines[ctx.pos] = ' '.repeat(indent + 2) + afterDash
      const val = parseValue(ctx, indent + 2)
      result.push(val === undefined ? null : val)
    } else {
      ctx.pos++
      result.push(parseScalar(afterDash))
    }
  }

  return result
}

function parseScalar(s: string): any {
  s = s.trim()
  if (s === 'null' || s === '~' || s === '') return null
  if (s === 'true') return true
  if (s === 'false') return false
  if (/^-?\d+$/.test(s)) return parseInt(s, 10)
  if (/^-?\d*\.\d+([eE][-+]?\d+)?$/.test(s)) return parseFloat(s)
  if (s.startsWith('[') && s.endsWith(']')) {
    // Inline array
    try { return JSON.parse(s) } catch { return s }
  }
  if (s.startsWith('{') && s.endsWith('}')) {
    try { return JSON.parse(s) } catch { return s }
  }
  return unquoteYaml(s)
}

function unquoteYaml(s: string): string {
  s = s.trim()
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    const inner = s.slice(1, -1)
    if (s[0] === '"') {
      return inner
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
    }
    return inner
  }
  return s
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function jsonToYaml(json: string, indent = 2): string {
  const obj = JSON.parse(json)
  const result = toYaml(obj, indent, 0)
  return result + (result.endsWith('\n') ? '' : '\n')
}

export function yamlToJson(yaml: string, pretty = true): string {
  const lines = yaml.split('\n')
  const ctx: ParseCtx = { lines, pos: 0 }
  const result = parseValue(ctx, 0)
  // Skip trailing blank lines
  while (ctx.pos < ctx.lines.length) {
    const t = ctx.lines[ctx.pos].trim()
    if (t === '' || t.startsWith('#')) {
      ctx.pos++
      continue
    }
    break
  }
  if (result === undefined) {
    throw new Error('Unable to parse YAML: no valid content found')
  }
  return JSON.stringify(result, null, pretty ? 2 : 0)
}

// ─── Simple auto-detection ──────────────────────────────────────────────────

export function detectFormat(input: string): 'json' | 'yaml' | 'unknown' {
  const trimmed = input.trim()
  if (trimmed === '') return 'unknown'
  // JSON starts with { or [
  if (trimmed[0] === '{' || trimmed[0] === '[') {
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch {
      // Might still be malformed JSON or YAML
    }
  }
  // YAML indicators
  if (trimmed.includes(': ') || trimmed.startsWith('- ') || trimmed.includes(':\n')) {
    return 'yaml'
  }
  return 'unknown'
}

// ─── Examples ────────────────────────────────────────────────────────────────

export const jsonExample = `{
  "name": "X-Utils",
  "version": "1.0.0",
  "description": "Free online developer tools",
  "features": [
    "JSON Formatter",
    "Base64 Encode/Decode",
    "Hash Generator",
    "Color Converter"
  ],
  "config": {
    "theme": "dark",
    "language": "zh-CN",
    "autoSave": true,
    "maxFileSize": 10485760
  },
  "author": {
    "name": "Developer",
    "email": "dev@example.com"
  },
  "tags": ["tools", "developer", "free", "online"]
}`

export const yamlExample = `name: X-Utils
version: 1.0.0
description: Free online developer tools
features:
  - JSON Formatter
  - Base64 Encode/Decode
  - Hash Generator
  - Color Converter
config:
  theme: dark
  language: zh-CN
  autoSave: true
  maxFileSize: 10485760
author:
  name: Developer
  email: dev@example.com
tags:
  - tools
  - developer
  - free
  - online`
