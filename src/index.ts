import { parsers } from 'prettier/plugins/typescript'
import type { Options } from 'prettier'

import { sort } from './sort.js'

// compose with any pre-existing preprocess so we don't trample a downstream plugin
// or a future Prettier that ships its own typescript preprocess step
const basePreprocess = parsers.typescript.preprocess

export default {
  parsers: {
    typescript: {
      ...parsers.typescript,
      preprocess: async (text: string, options: any) =>
        sort(basePreprocess ? await basePreprocess(text, options) : text, options),
    },
  },
  options: {
    shiftRelativeImports: {
      type: 'boolean',
      category: 'Global',
      default: false,
      description: 'Move relative imports into a final group below absolute imports',
    },
  } satisfies Options,
}
