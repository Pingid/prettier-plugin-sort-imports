import { parsers as typescriptParsers } from 'prettier/plugins/typescript'
import { preprocess } from './peprocess.js'

export default { parsers: { typescript: { ...typescriptParsers.typescript, preprocess } } }
