import { parsers } from 'prettier/plugins/typescript'
import type { Options } from 'prettier'

import { sort } from './sort.js'

export default {
  parsers: { typescript: { ...parsers.typescript, preprocess: sort } },
  options: {
    shiftRelativeImports: {
      type: 'boolean',
      category: 'Global',
      default: false,
      description: 'Move relative imports into a final group below absolute imports',
    },
  } satisfies Options,
}
