const blockEnd = /from\s['"].{1,}['"]$/
const relative = /from\s+['"]\.[\s\S]*?['"]/m

type Options = { importRemoveUnused?: boolean }

export const preprocess = (text: string, options: Options) => {
  let result = ''
  let statement = ''
  let statementOpen = false
  let block: string[] = []
  let blocks: string[][] = []

  for (const line of text.split('\n')) {
    if (block.length > 0 && line.trim().length === 0) {
      blocks.push(block)
      block = []
    }
    if (line.startsWith('import ')) {
      if (!blockEnd.test(line)) {
        statement = line
        statementOpen = true
      } else block.push(line)
    } else if (statementOpen && blockEnd.test(line)) {
      block.push(statement + line + '\n')
      statement = ''
      statementOpen = false
    } else if (statementOpen) statement += line + '\n'
    else {
      if (blocks.length > 0 && line.trim().length > 0) {
        result += flushBlocks(blocks, text, options) + '\n\n'
        blocks = []
      }
      result += line + '\n'
    }
  }

  if (block.length > 0) blocks.push(block)
  if (blocks.length > 0) result += flushBlocks(blocks, text, options)

  return result
}

const flushBlocks = (blocks: string[][], text: string, options: Options) => {
  const next = Array.from({ length: blocks.length }, () => [] as string[])
  let hasRelative = blocks[blocks.length - 1]!.some((line) => relative.test(line))

  for (let i = 0; i < blocks.length; i++) {
    for (let rawLine of blocks[i]!) {
      let line = rawLine.trim()
      if (options.importRemoveUnused) {
        const pruned = pruneImport(line, text)
        if (!pruned) continue
        line = pruned
      }
      if (relative.test(line)) {
        hasRelative = true
        next[blocks.length - 1]!.push(line)
      } else if (hasRelative && i > 0 && i === blocks.length - 1) next[i - 1]!.push(line)
      else next[i]!.push(line)
    }
  }

  return next
    .filter((arr) => arr.length)
    .map((arr) => arr.sort((a, b) => b.length - a.length).join('\n'))
    .join('\n\n')
    .trim()
}

const pruneImport = (line: string, fileText: string): string | null => {
  // allow . to match newlines with s flag
  const re =
    // import [type ]? <anything, including newlines> from '...';
    /^import\s+(type\s+)?([\s\S]+?)\s+from\s+(['"].+['"])\s*;?$/s
  const m = line.match(re)
  if (!m) return line

  const [, isType, spec, mod] = m
  const count = (name: string) => (fileText.match(new RegExp(`\\b${name}\\b`, 'g')) || []).length

  // named imports → peel out what's inside { … }
  if (spec!.includes('{')) {
    const items = spec!
      .replace(/^[^{]*\{/, '') // drop everything up to first {
      .replace(/\}.*$/, '') // drop everything after last }
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const keep = items.filter((item) => {
      const [orig, as] = item.split(/\s+as\s+/).map((s) => s.trim())
      return count(as || orig!) > 1
    })
    if (!keep.length) return null
    return `import ${isType || ''}{ ${keep.join(', ')} } from ${mod}`
  }

  // default or namespace import
  const local = spec!.replace(/^\*\s+as\s+/, '').trim()
  return count(local) > 1 ? line : null
}
