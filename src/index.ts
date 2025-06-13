import { parsers as typescriptParsers } from 'prettier/plugins/typescript'
import { Parser } from 'prettier'

import { preprocess } from './peprocess.js'

export default {
  parsers: {
    typescript: {
      ...typescriptParsers.typescript,
      preprocess: (text) => preprocess(text),
    } satisfies Parser,
  },
}
