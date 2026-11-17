const assert = require('node:assert/strict');
const test = require('node:test');
const {buildSpriteMap} = require('./build-sprites.cjs');

const csv = [
  'id,identifier,species_id,is_default',
  '25,pikachu,25,1',
  '10094,pikachu-original-cap,25,0',
  '555,darmanitan-standard,555,1',
  '10177,darmanitan-galar-standard,555,0',
].join('\n');

test('maps canonical names, alternate form names, and default species without mixing regional forms', () => {
  const {spriteIds, fallbackSpecies} = buildSpriteMap({
    pikachu: {num: 25},
    pikachuoriginal: {num: 25, forme: 'Original'},
    pikachucustom: {num: 25, forme: 'Custom'},
    darmanitan: {num: 555},
    darmanitangalar: {num: 555, forme: 'Galar'},
  }, csv);
  assert.deepEqual(spriteIds, {
    darmanitan: '555', darmanitangalar: '10177',
    pikachu: '25', pikachuoriginal: '10094', pikachucustom: '25',
  });
  assert.deepEqual(fallbackSpecies, ['pikachucustom']);
});

test('rejects unknown species and malformed metadata rather than generating broken URLs', () => {
  assert.throws(() => buildSpriteMap({missing: {num: 0}}, csv), /No PokeAPI sprite/);
  assert.throws(() => buildSpriteMap({}, 'wrong,columns'), /Invalid PokeAPI/);
  assert.throws(() => buildSpriteMap({}, csv + '\nno,pokemon,1,1'), /Invalid PokeAPI/);
});
