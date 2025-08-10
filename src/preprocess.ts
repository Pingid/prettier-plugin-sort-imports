const importStart = /^\s*import\s/
const importEnd = /from\s+['"][^'"]+['"]\s*;?\s*$/

type Options = {
  importRemoveUnused?: boolean
  /**
   * If true, relative imports will be shifted to a second group bellow absolute import groups.
   * @default false
   */
  shiftRelativeImports?: boolean
}

const emitGroups = (groups: string[][], out: string[]) => {
  if (!groups.length) return
  const body = groups
    .map((g) =>
      g
        .slice()
        .sort((a, b) => b.length - a.length)
        .join('\n'),
    )
    .join('\n\n')
  out.push(body)
  groups.length = 0
}

export const preprocess = (text: string, _options: Options) => {
  const lines = text.split('\n')
  const out: string[] = []

  const groups: string[][] = []
  let curGroup: string[] | null = null
  let openStmt: string[] | null = null

  const endOpenStmtIntoGroup = () => {
    if (openStmt) {
      const full = openStmt.join('\n').trimEnd()
      if (!curGroup) curGroup = []
      curGroup.push(full)
      openStmt = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!

    if (openStmt) {
      openStmt.push(line)
      if (importEnd.test(line)) endOpenStmtIntoGroup()
      continue
    }

    if (importStart.test(line)) {
      if (!curGroup) curGroup = []
      if (importEnd.test(line)) curGroup.push(line.trimEnd())
      else openStmt = [line]

      // Only consume a following blank if it separates two import groups.
      const next = lines[i + 1]
      const next2 = lines[i + 2]
      const nextIsBlank = next !== undefined && next.trim() === ''
      const afterBlankIsImport = next2 !== undefined && importStart.test(next2)
      if (nextIsBlank && afterBlankIsImport) {
        groups.push(curGroup)
        curGroup = null
        i += 1 // consume exactly one blank between groups
      }
      continue
    }

    // Non-import line
    const prev = lines[i - 1]
    const hadBlankBetweenImportsAndCode = !!prev && prev.trim() === ''

    endOpenStmtIntoGroup()
    if (curGroup) {
      groups.push(curGroup)
      curGroup = null
    }
    if (groups.length) {
      emitGroups(groups, out)
      if (hadBlankBetweenImportsAndCode) out.push('') // mirror original single blank
    }

    out.push(line)
  }

  endOpenStmtIntoGroup()
  if (curGroup) groups.push(curGroup)
  if (groups.length) emitGroups(groups, out)

  let result = out.join('\n')
  result = result.replace(/\n+$/g, '\n')
  if (!result.endsWith('\n')) result += '\n'
  return result
}
