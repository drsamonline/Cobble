/* Cobble — tests for the part that can be tested without a browser.
 *
 *   node --test tests/
 *
 * No framework, no dependencies: Node 20 has Web Crypto, which is the same
 * implementation the browser exposes, so the round-trip below exercises the
 * real format rather than an imitation of it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('../app/core.js');

const moment = (overrides = {}) => ({
  id: 'm-1',
  date: '2026-11-18',
  text: 'The corner bakery puts the warm loaves in the window at exactly 4:15.',
  category: 'everyday',
  importance: 2,
  repeatCount: 1,
  photo: '',
  createdAt: '2026-11-18T12:04:51.220Z',
  ...overrides
});

/* ── the format ─────────────────────────────────────────────────── */

test('a city round-trips through the encrypted bundle', async () => {
  const entries = [moment(), moment({ id: 'm-2', category: 'joy', text: 'A peach.' })];
  const bundle = await core.encryptEntries(entries, '418902');
  assert.equal(bundle.format, 'cobble-pincode');
  assert.equal(bundle.version, 1);
  assert.equal(bundle.salt.length, 16);
  assert.equal(bundle.iv.length, 12);
  assert.ok(bundle.data.length > 16);
  const back = await core.decryptBundle(bundle, '418902');
  assert.deepEqual(back.map(entry => entry.id), ['m-1', 'm-2']);
  assert.equal(back[0].text, entries[0].text);
});

test('the same city twice gives different ciphertext', async () => {
  const entries = [moment()];
  const a = await core.encryptEntries(entries, '418902');
  const b = await core.encryptEntries(entries, '418902');
  assert.notDeepEqual(a.salt, b.salt);
  assert.notDeepEqual(a.iv, b.iv);
  assert.notDeepEqual(a.data, b.data);
});

test('a wrong PIN fails, and says so', async () => {
  const bundle = await core.encryptEntries([moment()], '418902');
  await assert.rejects(() => core.decryptBundle(bundle, '418903'), /did not unlock/);
});

test('tampering is detected rather than decrypted', async () => {
  const bundle = await core.encryptEntries([moment()], '418902');
  const tampered = { ...bundle, data: [...bundle.data] };
  tampered.data[4] = (tampered.data[4] + 1) % 256;
  await assert.rejects(() => core.decryptBundle(tampered, '418902'), /did not unlock/);
});

test('a file that is not ours is refused before any crypto', async () => {
  await assert.rejects(() => core.decryptBundle({ format: 'something-else', version: 1 }, '418902'), /does not look like/);
  await assert.rejects(() => core.decryptBundle(null, '418902'), /does not look like/);
  await assert.rejects(() => core.decryptBundle({ format: 'cobble-pincode', version: 2 }, '418902'), /does not look like/);
});

test('a damaged bundle is refused with a reason', async () => {
  const bundle = await core.encryptEntries([moment()], '418902');
  await assert.rejects(() => core.decryptBundle({ ...bundle, salt: [1, 2, 3] }, '418902'), /damaged/);
  await assert.rejects(() => core.decryptBundle({ ...bundle, iv: [] }, '418902'), /damaged/);
  await assert.rejects(() => core.decryptBundle({ ...bundle, data: [1, 2, 3] }, '418902'), /damaged/);
  await assert.rejects(
    () => core.decryptBundle({ ...bundle, data: bundle.data.map(value => value + 0.5) }, '418902'),
    /damaged/
  );
});

test('the iteration count is the one the documentation states', () => {
  assert.equal(core.ITERATIONS, 250000);
});

/* ── the import validator ───────────────────────────────────────── */

test('a well-formed moment survives validation, trimmed', () => {
  const clean = core.normaliseEntry(moment({ text: '  A peach.  ' }));
  assert.equal(clean.text, 'A peach.');
  assert.equal(clean.category, 'everyday');
});

test('weights are clamped, not trusted', () => {
  assert.equal(core.normaliseEntry(moment({ importance: 9 })).importance, 3);
  assert.equal(core.normaliseEntry(moment({ importance: 0 })).importance, 1);
  assert.equal(core.normaliseEntry(moment({ importance: 'x' })).importance, 1);
  assert.equal(core.normaliseEntry(moment({ repeatCount: 99 })).repeatCount, 5);
  assert.equal(core.normaliseEntry(moment({ repeatCount: -3 })).repeatCount, 1);
});

test('unknown fields are dropped rather than stored', () => {
  const clean = core.normaliseEntry({ ...moment(), injected: '<script>alert(1)</script>' });
  assert.equal(clean.injected, undefined);
  assert.deepEqual(Object.keys(clean).sort(), ['category', 'createdAt', 'date', 'id', 'importance', 'photo', 'repeatCount', 'text']);
});

const rejected = {
  'no id': { id: '' },
  'an id that is not a string': { id: 42 },
  'an id longer than 120 characters': { id: 'x'.repeat(121) },
  'empty text': { text: '   ' },
  'text longer than 500 characters': { text: 'x'.repeat(501) },
  'a date in the wrong shape': { date: '18/11/2026' },
  'a date that does not exist': { date: '2026-02-31' },
  'a category that is not one of the six': { category: 'shopping' },
  'a photo that is not a data URL': { photo: 'https://example.com/cat.jpg' },
  'a photo with the wrong mime type': { photo: 'data:image/svg+xml;base64,PHN2Zz4=' }
};

for (const [why, overrides] of Object.entries(rejected)) {
  test(`rejects ${why}`, () => {
    assert.equal(core.normaliseEntry(moment(overrides)), null);
  });
}

test('rejects a duplicate id when the archive already has it', () => {
  const known = new Set(['m-1']);
  assert.equal(core.normaliseEntry(moment(), known), null);
  assert.notEqual(core.normaliseEntry(moment({ id: 'm-9' }), known), null);
});

test('rejects things that are not objects at all', () => {
  for (const value of [null, undefined, 'text', 42, []]) {
    assert.equal(core.normaliseEntry(value), null);
  }
});

test('accepts every district the app offers', () => {
  for (const category of core.CATEGORIES) {
    assert.notEqual(core.normaliseEntry(moment({ category })), null, category);
  }
});

/* ── end to end: what a hostile file can and cannot do ──────────── */

/* ── the vault ───────────────────────────────────────────────────── */

test('a vault round-trips and keeps the moments intact', async () => {
  const rows = [
    { id: 'a', date: '2026-01-02', text: 'Locked away.', category: 'joy', importance: 2, repeatCount: 1, photo: '', createdAt: '2026-01-02T10:00:00.000Z' }
  ];
  const vault = await core.encryptVault(rows, 'a long enough passphrase');
  assert.equal(vault.format, 'cobble-vault');
  assert.equal(vault.version, 1);
  assert.equal(vault.salt.length, 16);
  assert.equal(vault.iv.length, 12);
  const back = await core.decryptVault(vault, 'a long enough passphrase');
  assert.deepEqual(back, rows);
});

test('a vault does not contain its own plaintext', async () => {
  const vault = await core.encryptVault(
    [{ id: 'a', date: '2026-01-02', text: 'marmalade on toast', category: 'joy', importance: 1, repeatCount: 1, photo: '', createdAt: '2026-01-02T10:00:00.000Z' }],
    'a long enough passphrase'
  );
  assert.equal(JSON.stringify(vault).includes('marmalade'), false);
});

test('a vault refuses a wrong passphrase and a short one', async () => {
  const vault = await core.encryptVault([], 'a long enough passphrase');
  await assert.rejects(() => core.decryptVault(vault, 'not the passphrase'), /did not open/);
  await assert.rejects(() => core.encryptVault([], 'short'), /at least eight/);
});

test('two vaults of the same archive differ', async () => {
  const rows = [{ id: 'a', date: '2026-01-02', text: 'x', category: 'joy', importance: 1, repeatCount: 1, photo: '', createdAt: '2026-01-02T10:00:00.000Z' }];
  const first = await core.encryptVault(rows, 'a long enough passphrase');
  const second = await core.encryptVault(rows, 'a long enough passphrase');
  assert.notDeepEqual(first.salt, second.salt);
  assert.notDeepEqual(first.data, second.data);
});

test('a vault that is not a vault is refused', async () => {
  await assert.rejects(() => core.decryptVault({ format: 'cobble-pincode' }, 'a long enough passphrase'), /not a Cobble vault/);
  await assert.rejects(() => core.decryptVault(null, 'a long enough passphrase'), /not a Cobble vault/);
});

/* ── merging one city into another ───────────────────────────────── */

const localCity = [
  { id: 'm1', date: '2026-03-01', text: 'The bakery at four fifteen.', category: 'everyday', importance: 2, repeatCount: 1, photo: '', createdAt: '2026-03-01T10:00:00.000Z' }
];

test('an identical moment is not imported twice', () => {
  const { added, variants } = core.mergeEntries(localCity, [{ ...localCity[0] }]);
  assert.equal(added.length, 0);
  assert.equal(variants, 0);
});

test('a moment edited elsewhere is kept alongside, under a new id', () => {
  const edited = { ...localCity[0], text: 'The bakery, but I have changed my mind about the time.' };
  const { added, variants } = core.mergeEntries(localCity, [edited]);
  assert.equal(added.length, 1);
  assert.equal(variants, 1);
  assert.notEqual(added[0].id, 'm1');
  assert.match(added[0].id, /^m1-v-/);
});

test('importing the same file twice adds nothing the second time', () => {
  const edited = { ...localCity[0], text: 'The bakery, but I have changed my mind about the time.' };
  const fresh = { id: 'm9', date: '2026-03-09', text: 'A brand new moment.', category: 'joy', importance: 1, repeatCount: 1, photo: '', createdAt: '2026-03-09T10:00:00.000Z' };
  const first = core.mergeEntries(localCity, [edited, fresh]);
  assert.equal(first.added.length, 2);
  const second = core.mergeEntries([...localCity, ...first.added], [edited, fresh]);
  assert.equal(second.added.length, 0);
  assert.equal(second.variants, 0);
});

test('merging still refuses malformed moments', () => {
  const { added } = core.mergeEntries(localCity, [
    { id: 'bad', date: '2026-02-31', text: 'impossible date', category: 'joy', importance: 1 },
    { id: 'bad2', date: '2026-03-01', text: 'unknown district', category: 'nonsense', importance: 1 }
  ]);
  assert.equal(added.length, 0);
});

test('an imported city keeps the good moments and drops the rest', async () => {
  const good = moment();
  const hostile = [
    moment({ id: 'm-2', text: 'A peach.' }),
    moment({ id: 'm-3', category: 'not-a-district' }),
    { ...moment({ id: 'm-4' }), text: 'x'.repeat(501) },
    moment({ id: 'm-5', photo: 'javascript:alert(1)' })
  ];
  const bundle = await core.encryptEntries([good, ...hostile], '418902');
  const shared = await core.decryptBundle(bundle, '418902');
  const known = new Set();
  const imported = shared.map(entry => core.normaliseEntry(entry, known)).filter(Boolean);
  imported.forEach(entry => known.add(entry.id));
  assert.deepEqual(imported.map(entry => entry.id), ['m-1', 'm-2']);
});
