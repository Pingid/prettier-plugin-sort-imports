# @pingid/prettier-plugin-sort-imports

A tiny Prettier ³ plugin that keeps your import statements tidy.

- Groups consecutive `import ...` lines that are separated by blank lines.
- Within every group the lines are reordered by length – the longest import goes on top.

## Installation

```bash
pnpm add -D @pingid/prettier-plugin-sort-imports
# or
yarn add -D @pingid/prettier-plugin-sort-imports
# or
npm i -D @pingid/prettier-plugin-sort-imports
```

Add the plugin to your configuration `.prettierrc`:

```json
{
  "plugins": ["@pingid/prettier-plugin-sort-imports"]
}
```

## Example

```ts
// before
import a from 'a'
import { join } from 'node:path'

import b from './b'
import c from './utils/c'

// after — formatted by Prettier
import { join } from 'node:path'
import a from 'a'

import c from './utils/c'
import b from './b'
```

### Option: `shiftRelativeImports`

Moves relative imports (`./` or `../`) into a section **below** absolute imports.  
Still sorts by line length **within each group** and preserves blank lines between original relative-only groups.

**Default:** `false`

**Prettier config:**

```json
{
  "plugins": ["@pingid/prettier-plugin-sort-imports"],
  "shiftRelativeImports": true
}
```

**Example (simple):**

```ts
// before
import a from '../relative'
import { b, c } from 'b'

import d from 'c'
import { e, f } from 'd'
import { g, h } from '../relative'

// after
import { b, c } from 'b'

import d from 'c'
import { e, f } from 'd'

import { g, h } from '../relative'
import a from '../relative'
```

## License

This project is licensed under the MIT License.

MIT © [Dan Beaven](https://github.com/Pingid)
