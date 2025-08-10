import { Bench } from 'tinybench'
import fs from 'node:fs'
import path from 'node:path'

import { preprocess } from '../src/preprocess.ts'

const stmt = (n, rel) =>
  `import { ${Array.from({ length: n }, (_, i) => `a${i}`).join(', ')} } from '${rel ? './a' : 'a'}'`
const file = (n, gap = 0) =>
  Array.from({ length: n }, (_, i) => stmt((i % 12) + 1, i % 3 === 0)).join('\n' + '\n'.repeat(gap))

const cases = [
  { name: 'small', src: file(50) },
  { name: 'medium', src: file(200, 1) },
  { name: 'large', src: file(1000, 1) },
  { name: 'xl', src: file(10000, 1) },
]

const run = async () => {
  const b = new Bench({ time: 1000, warmupTime: 250 })
  for (const c of cases) b.add(c.name, () => preprocess(c.src, {}))
  await b.run()

  const res = Object.fromEntries(
    b.tasks.map((t) => [
      t.name,
      {
        thr: t.result?.throughput.mean,
        lat: t.result?.latency.mean,
        rme: t.result?.throughput.rme,
      },
    ]),
  )

  const basePath = path.resolve('bench', 'benchmarks.json')
  const upd = process.argv.includes('--update') || process.env.BENCH_UPDATE === '1'
  const tol = Number(process.env.BENCH_TOLERANCE ?? '0.05')

  if (upd || !fs.existsSync(basePath)) {
    fs.mkdirSync(path.dirname(basePath), { recursive: true })
    fs.writeFileSync(basePath, JSON.stringify({ createdAt: new Date().toISOString(), results: res }, null, 2))
    console.table(res)
    console.log(`Baseline saved to ${basePath}`)
    return
  }

  const base = JSON.parse(fs.readFileSync(basePath, 'utf8'))
  const cmp: Record<
    string,
    { thr: number | undefined; baseThr: number | undefined; change: number; regression: boolean }
  > = {}
  let fail = false
  for (const [k, v] of Object.entries(res)) {
    const bv: any = base.results[k as keyof typeof base.results]
    if (!bv) continue
    const curThr = (v as any).thr ?? (v as any).throughput?.mean ?? (v as any).hz
    const baseThr = bv.thr ?? bv.throughput?.mean ?? bv.hz
    const ratio = baseThr ? curThr / baseThr - 1 : 0
    cmp[k] = { thr: curThr, baseThr, change: ratio, regression: ratio < -tol }
    if (cmp[k].regression) fail = true
  }

  console.table(cmp)
  if (fail) {
    console.error(`Performance regression > ${tol * 100}% detected`)
    process.exit(1)
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
