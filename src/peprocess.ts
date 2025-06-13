const blockEnd = /from\s['"].{1,}['"]$/
const relative = /from\s+['"]\.[\s\S]*?['"]/m

export const preprocess = (text: string) => {
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
        result += flushBlocks(blocks) + '\n\n'
        blocks = []
      }
      result += line + '\n'
    }
  }

  return result
}

const flushBlocks = (blocks: string[][]) => {
  const next: string[][] = Array.from({ length: blocks.length }).map(() => [])

  for (let i = 0; i < blocks.length; i++) {
    for (let j = 0; j < blocks[i]!.length; j++) {
      if (relative.test(blocks[i]![j]!)) {
        next[blocks.length - 1]!.push(blocks[i]![j]!)
      } else {
        next[i]!.push(blocks[i]![j]!)
      }
    }
  }

  return next
    .filter((x) => x.length > 0)
    .map((x) =>
      x
        .map((x) => x.trim())
        .sort((a, b) => b.length - a.length)
        .join('\n'),
    )
    .join('\n\n')
    .trim()
}
