import { preprocess } from './preprocess.js'
import { it, expect } from 'vitest'

it('should sort import groups by height', () => {
  const result = process(
    ['import a from "a"', 'import { b, c } from "b"'],
    ['import a from "a"', 'import { b, c } from "b"', 'import { b, c, d } from "b"'],
  )
  expect(result).toEqual([
    ['import { b, c } from "b"', 'import a from "a"'],
    ['import { b, c, d } from "b"', 'import { b, c } from "b"', 'import a from "a"'],
  ])
})

it('should ignore semi colon terminated import statements', () => {
  const result = process(
    ['import a from "a";', 'import { b, c } from "b";'],
    ['import a from "a";', 'import { b, c } from "b";', 'import { b, c, d } from "b";'],
  )
  expect(result).toEqual([
    ['import { b, c } from "b";', 'import a from "a";'],
    ['import { b, c, d } from "b";', 'import { b, c } from "b";', 'import a from "a";'],
  ])
})

const process = (...input: string[][]) => {
  const text = input.map((group) => group.join('\n')).join('\n\n')
  const result = preprocess(text, {})
  return result
    .split('\n\n')
    .map((group) => group.split('\n').filter(Boolean))
    .filter(Boolean)
}
