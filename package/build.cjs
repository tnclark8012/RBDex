const fs = require('node:fs');
const path = require('node:path');

const toID = name => name.toLowerCase().replace(/[^a-z0-9]/g, '');

function buildPokedex(species, learnsets, moves) {
  const pokedex = {};
  for (const id of Object.keys(species).sort()) {
    const pokemon = species[id];
    if (!pokemon.name || !pokemon.abilities || !Object.values(pokemon.abilities).every(ability => typeof ability === 'string')) {
      throw new Error(`Missing name or abilities for ${id}`);
    }

    const moveNames = new Set();
    const ancestors = new Set();
    let ancestor = id;
    while (ancestor) {
      if (ancestors.has(ancestor)) throw new Error(`Evolution cycle for ${id}: ${ancestor}`);
      ancestors.add(ancestor);
      if (!species[ancestor]) throw new Error(`Unknown pre-evolution for ${id}: ${ancestor}`);
      for (const move of Object.keys(learnsets[ancestor]?.learnset || {})) {
        if (!moves[move]?.name) throw new Error(`Unknown move for ${ancestor}: ${move}`);
        moveNames.add(moves[move].name);
      }
      ancestor = species[ancestor].prevo ? toID(species[ancestor].prevo) : '';
    }

    pokedex[id] = {
      id,
      name: pokemon.name,
      abilities: Object.values(pokemon.abilities),
      ...(pokemon.prevo ? {prevo: toID(pokemon.prevo)} : {}),
      moves: [...moveNames].sort(),
    };
  }
  return pokedex;
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const pokedex = buildPokedex(
    require('../pokedex.js').BattlePokedex,
    require('../learnsets.js').BattleLearnsets,
    require('../moves.js').BattleMovedex
  );
  const dist = path.join(root, 'dist');
  fs.mkdirSync(dist, {recursive: true});
  fs.writeFileSync(path.join(dist, 'pokedex.json'), JSON.stringify(pokedex) + '\n');
  fs.writeFileSync(path.join(dist, 'index.cjs'), "exports.pokedex = require('./pokedex.json');\nexports.spriteIds = require('./sprite-ids.json');\n");
  fs.writeFileSync(path.join(dist, 'index.d.ts'), [
    'export interface PokedexEntry {',
    '  readonly id: string;',
    '  readonly name: string;',
    '  readonly abilities: readonly string[];',
    '  readonly prevo?: string;',
    '  readonly moves: readonly string[];',
    '}',
    'export declare const pokedex: Readonly<Record<string, PokedexEntry | undefined>>;',
    'export declare const spriteIds: Readonly<Record<string, string | undefined>>;',
    '',
  ].join('\n'));
  console.log(`Built offline data for ${Object.keys(pokedex).length} species.`);
}

module.exports = {buildPokedex};
