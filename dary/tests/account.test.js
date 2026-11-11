import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const indexSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const languageSource = await readFile(new URL('../i18n.js', import.meta.url), 'utf8');

test('public account menu offers buyer and seller only', () => {
  assert.match(appSource, /data-account-role="buyer"[\s\S]*?tr\('account\.buyer'\)/);
  assert.match(appSource, /data-account-role="seller"[\s\S]*?tr\('account\.seller'\)/);
  assert.doesNotMatch(appSource, /data-account-role="admin"/);
  assert.doesNotMatch(indexSource, /data-open="admin"|admin-dash/);
  assert.match(appSource, /dataset\.accountRole/);
});

test('customer-facing actions use masculine wording', () => {
  assert.match(languageSource, /'product\.addToCart': 'أضف \{name\} إلى السلة'/);
  assert.doesNotMatch(languageSource, /'product\.addToCart': 'أضيفي/);
  assert.doesNotMatch(appSource, /تصفّحي النكهات|اختاري طبقك/);
});

test('seller access requires a pending application and administrator approval', () => {
  assert.match(appSource, /name="name" autocomplete="name" required/);
  assert.match(appSource, /name="address" autocomplete="street-address" required/);
  assert.match(appSource, /name="email"[\s\S]*?type="email"/);
  assert.match(appSource, /name="phone"[\s\S]*?type="tel"/);
  assert.match(appSource, /status === 'approved'/);
  assert.match(appSource, /data-approve-seller/);
  assert.match(appSource, /requests\.push\(\{ name, address, email, phone, status: 'pending' \}\)/);
});
