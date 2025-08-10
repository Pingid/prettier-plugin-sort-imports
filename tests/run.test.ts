import fs from 'node:fs'
import path from 'node:path'

import { preprocess } from '../src/preprocess.js'

import { expect, test } from 'vitest'

const tests = fs
  .readdirSync(path.join(__dirname))
  .filter((file) => fs.statSync(path.join(__dirname, file)).isDirectory())

for (const testName of tests) {
  const testPath = path.join(__dirname, testName)
  const testFile = fs.readFileSync(path.join(testPath, 'test.ts'), 'utf8')
  const testResult = fs.readFileSync(path.join(testPath, 'expect.ts'), 'utf8')

  test(testName, () => {
    const result = preprocess(testFile, {
      shiftRelativeImports: testName.includes('relative-'),
    })
    if (result !== testResult) {
      console.log(result)
    }
    expect(result).toEqual(testResult)
  })
}
