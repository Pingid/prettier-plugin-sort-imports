import { parsers } from 'prettier/plugins/typescript'
import type { Options } from 'prettier'

import { preprocess } from './peprocess.js'

export default {
  parsers: { typescript: { ...parsers.typescript, preprocess } },
  options: {
    importRemoveUnused: {
      type: 'boolean',
      category: 'Global',
      default: false,
      description: 'Remove unused imports',
    },
  } satisfies Options,
}
