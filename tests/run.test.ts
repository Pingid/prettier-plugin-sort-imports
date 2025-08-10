import assert from 'node:assert'
import { test } from 'node:test'
import path from 'node:path'
import fs from 'node:fs'

import { preprocess } from '../src/preprocess.ts'

const tests = fs
  .readdirSync(path.join(import.meta.dirname))
  .filter((file) => fs.statSync(path.join(import.meta.dirname, file)).isDirectory())

for (const testName of tests) {
  const testPath = path.join(import.meta.dirname, testName)
  const testFile = fs.readFileSync(path.join(testPath, 'test.ts'), 'utf8')
  const testResult = fs.readFileSync(path.join(testPath, 'expect.ts'), 'utf8')

  test(testName, () => {
    const result = preprocess(testFile, {
      shiftRelativeImports: testName.includes('relative-'),
    })
    if (result !== testResult) {
      console.log(result)
    }
    assert.strictEqual(result, testResult)
  })
}
