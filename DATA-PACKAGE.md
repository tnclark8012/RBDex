# Offline Run & Bun data

`@runbuncalc/rbdex-data` exposes the abilities and legal move names needed by the
Run & Bun calculator, without loading the RBDex website or Pokemon Showdown client.
It is generated exclusively from this repository's `pokedex.js`, `learnsets.js`,
and `moves.js`; no network access or other package is required to build it.

```js
const {pokedex} = require('@runbuncalc/rbdex-data');
console.log(pokedex.venusaur.abilities);
console.log(pokedex.venusaur.moves);
```

Entries are keyed by lowercase alphanumeric species ID, including separate forms.
Each has `id`, `name`, `abilities`, sorted/deduplicated `moves`, and an optional
`prevo` ID. Moves include those of pre-evolutions, matching the calculator's
existing lookup behavior. Missing species return `undefined`. This does not model
level-specific move availability or change damage calculation stats.

Run `npm pack` to test and generate `runbuncalc-rbdex-data-<version>.tgz`.
The archive includes TypeScript declarations, the generated data, the generator,
tests, original input files, and the AGPLv3 license (corresponding source).
No artwork is included.

## Publishing

Increment `package.json`'s version when updating the source data or schema.
Push a matching `data-v<version>` tag to run `.github/workflows/data-release.yml`,
which publishes the tarball as a GitHub Release asset. Consumers can install
that version's asset URL with npm and commit their lockfile to pin its integrity.
Do not replace an existing release asset: publish a new version instead.

This is derived from the Run & Bun Showdown Dex by May8th1995 and contributors:
<https://github.com/May8th1995/RBDex>. The package retains this repository's
AGPLv3 licensing. Consumers must preserve the license and provide corresponding
source as required; publishing a data subset does not relicense the source.
