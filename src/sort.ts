const importStart = /^\s*(?:import\s|export\s+(?:type\s+)?(?:\{|\*))/
// handles bare imports and tolerates a trailing line comment on the same line
const importEnd = /(?:from\s+['"][^'"]+['"]|import\s+['"][^'"]+['"])\s*;?\s*(?:\/\/.*)?$/

type Options = {
  shiftRelativeImports?: boolean
}

export const sort = (text: string, options: Options) => {
  const lines = text.split('\n')
  const out: string[] = []

  const groups: string[][] = []
  let curGroup: string[] | null = null
  let openStmt: string[] | null = null

  const endOpenStmtIntoGroup = () => {
    if (!openStmt) return
    const full = openStmt.join('\n').trimEnd()
    ;(curGroup ??= []).push(full)
    openStmt = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!

    if (openStmt) {
      openStmt.push(line)
      if (importEnd.test(line)) endOpenStmtIntoGroup()
      continue
    }

    if (importStart.test(line)) {
      curGroup ??= []
      if (importEnd.test(line)) curGroup.push(line.trimEnd())
      else openStmt = [line]

      // only consume a single blank that separates two import groups
      const next = lines[i + 1]
      const next2 = lines[i + 2]
      if (next !== undefined && next.trim() === '' && next2 !== undefined && importStart.test(next2)) {
        groups.push(curGroup)
        curGroup = null
        i += 1
      }
      continue
    }

    // non-import line
    const prev = lines[i - 1]
    const hadBlankBetweenImportsAndCode = !!prev && prev.trim() === ''

    endOpenStmtIntoGroup()
    if (curGroup) {
      groups.push(curGroup)
      curGroup = null
    }
    if (groups.length) {
      emitImportGroups(groups, out, options)
      if (hadBlankBetweenImportsAndCode) out.push('')
    }

    out.push(line)
  }

  endOpenStmtIntoGroup()
  if (curGroup) groups.push(curGroup)
  if (groups.length) emitImportGroups(groups, out, options)

  let result = out.join('\n')
  result = result.replace(/\n+$/g, '\n')
  if (!result.endsWith('\n')) result += '\n'
  return result
}

const isRelativeImport = (stmt: string) => {
  const m = stmt.match(/from\s+['"]([^'"]+)['"]/)
  return !!(m && m[1] && m[1].startsWith('.'))
}

// side-effect imports (`import 'foo'`) carry semantics tied to source order, so we pin them
// to the top of their group rather than reordering by length.
const isSideEffectImport = (stmt: string) => /^\s*import\s+['"]/.test(stmt)

// emit a single group: pinned side-effects first (source order), the rest length-sorted desc.
const emitGroup = (stmts: string[]): string => {
  const pinned: string[] = []
  const rest: string[] = []
  for (const s of stmts) (isSideEffectImport(s) ? pinned : rest).push(s)
  if (rest.length > 1) rest.sort((a, b) => b.length - a.length)
  return pinned.concat(rest).join('\n')
}

const emitImportGroups = (groups: string[][], out: string[], options?: Options) => {
  if (!groups.length) return

  let ordered = groups

  if (options?.shiftRelativeImports) {
    const absGroups: string[][] = []
    const relSections: string[][] = []
    let relCollector: string[] | null = null

    for (const g of groups) {
      if (!g.length) continue
      const pinned: string[] = []
      const abs: string[] = []
      const rel: string[] = []
      for (const s of g) {
        if (isSideEffectImport(s)) pinned.push(s)
        else if (isRelativeImport(s)) rel.push(s)
        else abs.push(s)
      }

      // side-effects pin to their original group rather than shifting with relatives
      if (pinned.length || abs.length) absGroups.push(pinned.concat(abs))

      if (rel.length) {
        if (pinned.length || abs.length) {
          if (!relCollector) relCollector = []
          relCollector.push(...rel)
        } else {
          if (relCollector?.length) {
            relSections.push(relCollector.concat(rel))
            relCollector = null
          } else {
            relSections.push(rel)
          }
        }
      }
    }
    if (relCollector?.length) relSections.push(relCollector)
    ordered = absGroups.concat(relSections)
  }

  const chunks: string[] = []
  for (const g of ordered) chunks.push(emitGroup(g))
  out.push(chunks.join('\n\n'))
  groups.length = 0
}
