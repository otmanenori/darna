import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LANGUAGE, getDirection, normalizeLanguage, productText, t } from '../i18n.js';
import { PRODUCTS } from '../catalog.js';

test('supports the three site languages and safely defaults unknown values to Arabic', () => {
  assert.equal(DEFAULT_LANGUAGE, 'ar');
  assert.equal(normalizeLanguage('fr'), 'fr');
  assert.equal(normalizeLanguage('en'), 'en');
  assert.equal(normalizeLanguage('FR'), 'fr');
  assert.equal(normalizeLanguage('de'), 'ar');
  assert.equal(normalizeLanguage(null), 'ar');
});

test('uses RTL for Arabic and LTR for French and English', () => {
  assert.equal(getDirection('ar'), 'rtl');
  assert.equal(getDirection('fr'), 'ltr');
  assert.equal(getDirection('en'), 'ltr');
});

test('translates basic storefront copy and falls back to Arabic for unknown keys', () => {
  assert.equal(t('fr', 'nav.home'), 'Accueil');
  assert.equal(t('en', 'nav.home'), 'Home');
  assert.equal(t('ar', 'nav.home'), 'الرئيسية');
  assert.equal(t('fr', 'missing.key'), 'missing.key');
});

test('translates catalog products while preserving Arabic source data for filtering', () => {
  const product = PRODUCTS.find((item) => item.id === 'tagine-prune');
  assert.equal(productText('fr', product).name, 'Tajine de boulettes aux légumes');
  assert.equal(productText('en', product).name, 'Meatball tagine with vegetables');
  assert.equal(product.category, 'أطباق رئيسية');
  assert.equal(productText('fr', { ...product, id: 'future-item' }).name, product.name);
});

test('provides translated names, categories, makers, descriptions, badges, and units for every dish', () => {
  for (const language of ['fr', 'en']) {
    for (const product of PRODUCTS) {
      const translated = productText(language, product);
      for (const field of ['name', 'category', 'maker', 'unit', 'description', 'badge']) {
        assert.ok(translated[field], `${language} translation missing ${field} for ${product.id}`);
      }
    }
  }
});
