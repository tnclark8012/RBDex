const assert = require('node:assert/strict');
const test = require('node:test');
const {buildPokedex} = require('./build.cjs');

test('inherits ancestor moves, deduplicates and sorts names without modifying source data', () => {
  const species = {
    baby: {name: 'Baby', abilities: {'0': 'First'}},
    middle: {name: 'Middle', prevo: 'Baby', abilities: {'0': 'Second'}},
    finalform: {name: 'Final Form', prevo: 'Middle', abilities: {'0': 'Third', H: 'Hidden'}},
  };
  const learnsets = {
    baby: {learnset: {z: ['9L1'], a: ['9L2']}},
    middle: {learnset: {a: ['9M']}},
    finalform: {learnset: {b: ['9L1']}},
  };
  const before = JSON.stringify({species, learnsets});
  const result = buildPokedex(species, learnsets, {
    z: {name: 'Z Move'}, a: {name: 'A Move'}, b: {name: 'B Move'},
  });
  assert.deepEqual(result.finalform, {
    id: 'finalform', name: 'Final Form', prevo: 'middle',
    abilities: ['Third', 'Hidden'], moves: ['A Move', 'B Move', 'Z Move'],
  });
  assert.equal(JSON.stringify({species, learnsets}), before);
});

test('retains form-specific abilities and permits absent learnsets', () => {
  const result = buildPokedex({
    form: {name: 'Form', abilities: {'0': 'Unique'}},
  }, {}, {});
  assert.deepEqual(result.form.moves, []);
  assert.deepEqual(result.form.abilities, ['Unique']);
});

test('rejects broken evolution and move references instead of publishing incomplete data', () => {
  const species = {a: {name: 'A', prevo: 'Missing', abilities: {'0': 'Ability'}}};
  assert.throws(() => buildPokedex(species, {}, {}), /Unknown pre-evolution/);
  species.a.prevo = 'A';
  assert.throws(() => buildPokedex(species, {}, {}), /Evolution cycle/);
  delete species.a.prevo;
  assert.throws(() => buildPokedex(species, {a: {learnset: {missing: ['9L1']}}}, {}), /Unknown move/);
});

test('the checked-in Run & Bun data builds with inherited moves and form abilities', () => {
  const result = buildPokedex(
    require('../pokedex.js').BattlePokedex,
    require('../learnsets.js').BattleLearnsets,
    require('../moves.js').BattleMovedex
  );
  assert.ok(result.venusaur.moves.includes('Vine Whip'));
  assert.equal(result.venusaur.prevo, 'ivysaur');
  assert.deepEqual(result.aegislashblade.abilities, ['Stance Change']);
  assert.ok(result.nidoranf);
});
