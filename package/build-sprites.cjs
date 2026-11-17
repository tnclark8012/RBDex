const fs = require('node:fs/promises');
const path = require('node:path');

const SPRITES_REVISION = 'c0542f7c51215d9672439012838c99f520596cbd';
const METADATA_REVISION = '8d8a49d9295bbc951d882004570ca496866fd9d8';
const SPRITES_URL = `https://raw.githubusercontent.com/PokeAPI/sprites/${SPRITES_REVISION}`;
const METADATA_URL = `https://raw.githubusercontent.com/PokeAPI/pokeapi/${METADATA_REVISION}/data/v2/csv/pokemon.csv`;
const toID = name => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const FORM_NAMES = {
  darmanitangalar: 'darmanitan-galar-standard',
  meowsticf: 'meowstic-female',
  indeedeef: 'indeedee-female',
  basculegionf: 'basculegion-female',
  necrozmaduskmane: 'necrozma-dusk',
  necrozmadawnwings: 'necrozma-dawn',
  greninjabond: 'greninja-battle-bond',
  minior: 'minior-red',
  miniormeteor: 'minior-red-meteor',
};

function buildSpriteMap(species, csv) {
  const [header, ...lines] = csv.trim().split(/\r?\n/).map(line => line.split(','));
  const columns = ['id', 'identifier', 'species_id', 'is_default'].map(name => header.indexOf(name));
  if (columns.includes(-1)) throw new Error('Invalid PokeAPI pokemon.csv header');
  const [idColumn, nameColumn, speciesColumn, defaultColumn] = columns;
  const names = new Map();
  const defaults = new Map();
  for (const row of lines) {
    if (!/^[1-9][0-9]*$/.test(row[idColumn]) || !row[nameColumn]) {
      throw new Error(`Invalid PokeAPI sprite record: ${row.join(',')}`);
    }
    names.set(toID(row[nameColumn]), row[idColumn]);
    if (row[defaultColumn] === '1') defaults.set(Number(row[speciesColumn]), row[idColumn]);
  }
  const spriteIds = {};
  const fallbackSpecies = [];
  for (const id of Object.keys(species).sort()) {
    const alias = FORM_NAMES[id] || (id.startsWith('pikachu') ? `${id}cap` : id);
    const exact = names.get(toID(alias)) || names.get(id);
    const sprite = exact || defaults.get(species[id].num);
    if (!sprite) throw new Error(`No PokeAPI sprite for ${id}`);
    spriteIds[id] = sprite;
    if (!exact && species[id].forme) fallbackSpecies.push(id);
  }
  return {spriteIds, fallbackSpecies};
}

async function download(url) {
  const response = await fetch(url, {signal: AbortSignal.timeout(60000)});
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function buildSprites() {
  const root = path.resolve(__dirname, '..');
  const dist = path.join(root, 'dist');
  const spriteDir = path.join(dist, 'sprites');
  await fs.mkdir(spriteDir, {recursive: true});
  let cachedRevision;
  try {
    cachedRevision = JSON.parse(await fs.readFile(path.join(dist, 'sprite-sources.json'), 'utf8')).spritesRevision;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const csv = await download(METADATA_URL);
  const {spriteIds, fallbackSpecies} = buildSpriteMap(require('../pokedex.js').BattlePokedex, csv.toString('utf8'));
  const ids = [...new Set(Object.values(spriteIds))];
  const pending = [...ids];
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  await Promise.all(Array.from({length: 8}, async () => {
    while (pending.length) {
      const id = pending.pop();
      const file = path.join(spriteDir, `${id}.png`);
      let contents;
      if (cachedRevision === SPRITES_REVISION) {
        try {
          contents = await fs.readFile(file);
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
      }
      if (!contents) {
        contents = await download(`${SPRITES_URL}/sprites/pokemon/${id}.png`);
        if (!contents.subarray(0, 8).equals(pngSignature)) throw new Error(`Invalid PNG for ${id}`);
        await fs.writeFile(file, contents);
      }
      if (!contents.subarray(0, 8).equals(pngSignature)) throw new Error(`Invalid cached PNG for ${id}`);
    }
  }));
  await fs.writeFile(path.join(dist, 'sprite-ids.json'), JSON.stringify(spriteIds) + '\n');
  await fs.writeFile(path.join(dist, 'sprite-sources.json'), JSON.stringify({
    spritesRevision: SPRITES_REVISION,
    metadataRevision: METADATA_REVISION,
    fallbackSpecies,
  }, null, 2) + '\n');
  await fs.writeFile(path.join(dist, 'pokemon.csv'), csv);
  await fs.writeFile(path.join(dist, 'SPRITES-LICENCE.txt'), await download(`${SPRITES_URL}/LICENCE.txt`));
  await fs.writeFile(path.join(dist, 'SPRITES-README.md'), await download(`${SPRITES_URL}/README.md`));
  await fs.writeFile(path.join(dist, 'METADATA-LICENSE.md'), await download(
    `https://raw.githubusercontent.com/PokeAPI/pokeapi/${METADATA_REVISION}/LICENSE.md`
  ));
  console.log(`Bundled ${ids.length} PokeAPI sprites; ${fallbackSpecies.length} cosmetic forms use their species' default sprite (see sprite-sources.json).`);
}

if (require.main === module) {
  buildSprites().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {buildSpriteMap};
