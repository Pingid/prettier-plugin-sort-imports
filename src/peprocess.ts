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

  for (let i = 0; i < blocks.length; i++) {
    for (let rawLine of blocks[i]!) {
      let line = rawLine.trim()
      if (options.importRemoveUnused) {
        const pruned = pruneImport(line, text)
        if (!pruned) continue
        line = pruned
      }
      if (relative.test(line)) next[blocks.length - 1]!.push(line)
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
  const re = /^import\s+(type\s+)?(.+?)\s+from\s+(['"].+['"])\s*;?$/
  const m = line.match(re)
  if (!m) return line

  const [, isType, spec, mod] = m
  const count = (name: string) => (fileText.match(new RegExp(`\\b${name}\\b`, 'g')) || []).length

  // only-named or default+named
  if (spec!.includes('{')) {
    const items = spec!
      .replace(/^[^{]*{|}.*$/g, '')
      .split(',')
      .map((s) => s.trim())
    const keep = items.filter((item) => {
      const [orig, as] = item.split(/\s+as\s+/).map((s) => s.trim())
      return count(as || orig!) > 1
    })
    if (!keep.length) return null
    return `import ${isType || ''}{ ${keep.join(', ')} } from ${mod}`
  }

  // default-only or namespace
  const local = spec!.replace(/^\*\s+as\s+/, '').trim()
  return count(local) > 1 ? line : null
}
