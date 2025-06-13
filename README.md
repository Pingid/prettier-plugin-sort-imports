# @pingid/prettier-plugin-sort-imports

A tiny Prettier ³ plugin that keeps your import statements tidy.

- Groups consecutive `import ...` lines that are separated by blank lines.
- Keeps **external** (package) imports first and moves **relative** imports (paths that start with `./` or `../`) to the bottom of the group.
- Within every group the lines are reordered by length – the longest import goes on top.

## Installation

```bash
pnpm add -D @pingid/prettier-plugin-sort-imports
# or
yarn add -D @pingid/prettier-plugin-sort-imports
# or
npm i -D @pingid/prettier-plugin-sort-imports
```

The plugin is automatically picked up by Prettier ³ when it is in your _node_modules_. If you prefer an explicit configuration, add it to your `.prettierrc`:

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

## Options

### `importRemoveUnused`

Removes unused imports from your files. When enabled, any imported identifiers that are not used elsewhere in the file will be removed from the import statement.

**Usage:**

If you want to enable this option, add it to your Prettier configuration:

```json
{
  "plugins": ["@pingid/prettier-plugin-sort-imports"],
  "importRemoveUnused": true
}
```

By default, this option is `false` and unused imports will not be removed.

## License

This project is licensed under the MIT License.

MIT © [Dan Beaven](https://github.com/Pingid)
