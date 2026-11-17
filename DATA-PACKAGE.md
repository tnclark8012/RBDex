# Offline Run & Bun data

`@runbuncalc/rbdex-data` exposes the abilities and legal move names needed by the
Run & Bun calculator, without loading the RBDex website or Pokemon Showdown client.
Dex data is generated exclusively from this repository's `pokedex.js`,
`learnsets.js`, and `moves.js`. The package also downloads a pinned selection of
PokeAPI sprites at build time; nothing is fetched at runtime.

```js
const {pokedex, spriteIds} = require('@runbuncalc/rbdex-data');
console.log(pokedex.venusaur.abilities);
console.log(pokedex.venusaur.moves);
console.log(`sprites/${spriteIds.venusaur}.png`);
```

Entries are keyed by lowercase alphanumeric species ID, including separate forms.
Each has `id`, `name`, `abilities`, sorted/deduplicated `moves`, and an optional
`prevo` ID. Moves include those of pre-evolutions, matching the calculator's
existing lookup behavior. Missing species return `undefined`. This does not model
level-specific move availability or change damage calculation stats.

Run `npm pack` to test and generate `runbuncalc-rbdex-data-<version>.tgz`.
The archive includes TypeScript declarations, the generated data, the generator,
tests, original input files, and the AGPLv3 license (corresponding source).
The images are in `dist/sprites/`. Copy that directory into your build and use
`spriteIds[speciesId]` for filenames. Regional/battle forms are mapped separately;
cosmetic forms with no exact match use their species' default sprite. The exact
fallback list and upstream revisions are recorded in `dist/sprite-sources.json`.

Sprites are provided by [PokeAPI/sprites](https://github.com/PokeAPI/sprites),
whose README explicitly invites downloading the sprites for applications.
Image contents are copyright The Pokemon Company; retain the included
`dist/SPRITES-LICENCE.txt` and `dist/SPRITES-README.md`. The CC0 repository notice
does not assert ownership of that artwork. Metadata is from
[PokeAPI/pokeapi](https://github.com/PokeAPI/pokeapi); its exact CSV input is
included in `dist/pokemon.csv`. Both upstream commits are pinned in
`package/build-sprites.cjs`. Use Node 22+ to build; download errors fail the build.

## Publishing

Increment `package.json`'s version when updating the source data or schema.
Push a matching `data-v<version>` tag to run `.github/workflows/data-release.yml`,
which publishes the tarball as a GitHub Release asset. Consumers can install
that version's asset URL with npm and commit their lockfile to pin its integrity.
Do not replace an existing release asset: publish a new version instead.
Alternatively, install this repository using an exact Git commit. npm's
`prepare` script builds the package, including local sprites, during installation.

This is derived from the Run & Bun Showdown Dex by May8th1995 and contributors:
<https://github.com/May8th1995/RBDex>. The package retains this repository's
AGPLv3 licensing. Consumers must preserve the license and provide corresponding
source as required; publishing a data subset does not relicense the source.
