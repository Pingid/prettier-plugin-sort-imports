const blockEnd = /from\s['"].{1,}['"]/
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

const flushBlocks = (blocks: string[][], _text: string, _options: Options) => {
  const next = Array.from({ length: blocks.length }, () => [] as string[])
  let relativeIndex = null as number | null
  // let hasRelative = blocks[blocks.length - 1]!.some((line) => relative.test(line))

  // Reverse order
  for (let i = 0; i < blocks.length; i++) {
    const index = blocks.length - i - 1
    const block = blocks[index]!
    const hasNonRelative = block.some((line) => !relative.test(line))

    for (let rawLine of block!) {
      let line = rawLine.trim()
      // if (options.importRemoveUnused) {
      //   const pruned = pruneImport(line, text)
      //   if (!pruned) continue
      //   line = pruned
      // }
      if (relative.test(line)) {
        if (relativeIndex === null) relativeIndex = index
        else if (hasNonRelative) {
          next[relativeIndex]!.push(line)
          continue
        }
      }
      next[index]!.push(line)
    }
  }

  return next
    .filter((arr) => arr.length)
    .map((arr) => arr.sort((a, b) => b.length - a.length).join('\n'))
    .join('\n\n')
    .trim()
}

// const pruneImport = (line: string, fileText: string): string | null => {
//   const re = /^import\s+(type\s+)?([\s\S]+?)\s+from\s+(['"].+['"])\s*;?$/s
//   const m = line.match(re)
//   if (!m) return line

//   const [, importType, spec, moduleSpec] = m
//   const count = (name: string) => (fileText.match(new RegExp(`\\b${name}\\b`, 'g')) || []).length

//   // Named imports
//   if (spec!.includes('{')) {
//     // pull out what's inside the braces
//     const inside = spec!.replace(/^[^{]*\{/, '').replace(/\}.*$/, '')
//     const items = inside
//       .split(',')
//       .map((s) => s.trim())
//       .filter(Boolean)

//     // normalize each—note if it was "type X" we drop the "type " for counting
//     const parsed = items.map((item) => {
//       const isTypeItem = item.startsWith('type ')
//       const name = isTypeItem ? item.replace(/^type\s+/, '') : item
//       return { name, isTypeItem }
//     })

//     // keep only those actually used elsewhere (i.e. >1 occurrence)
//     const keep = parsed.filter(({ name }) => count(name) > 1)
//     if (!keep.length) return null

//     // if the original was a `import type` or all kept were types, re-emit as type import
//     const typePrefix = importType || keep.every((it) => it.isTypeItem) ? 'type ' : ''

//     return `import ${typePrefix}{ ${keep.map((it) => it.name).join(', ')} } from ${moduleSpec}`
//   }

//   // default or namespace import
//   const local = spec!.replace(/^\*\s+as\s+/, '').trim()
//   return count(local) > 1 ? line : null
// }
