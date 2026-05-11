#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'data', 'tenants', 'bocado-brasil-legacy.seed.json');
const STORE = path.join(ROOT, '.master-store.json');

const TENANT_ID = process.env.TENANT_ID || 'MZDs5MEb9gNbX4q5xdRYVgzLL252';
const TENANT_EMAIL = process.env.TENANT_EMAIL || 'pcruz.digital@gmail.com';
const TENANT_NAME = process.env.TENANT_NAME || 'Bocado Brasil';

function between(source, start, end) {
  const a = source.indexOf(start);
  if (a < 0) throw new Error(`Marker not found: ${start}`);
  const b = source.indexOf(end, a + start.length);
  if (b < 0) throw new Error(`Marker not found: ${end}`);
  return source.slice(a + start.length, b).trim();
}

function readMarkedJson(html, key) {
  return JSON.parse(between(html, `/*[[BOCA_${key}_START]]*/`, `/*[[BOCA_${key}_END]]*/`));
}

function docId(value, fallback) {
  return String(value || fallback).replace(/[\/#?\[\]]/g, '-');
}

function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});
}

function loadStore() {
  if (!fs.existsSync(STORE)) return { tenants: [], templates: [], global_config: {} };
  try {
    return JSON.parse(fs.readFileSync(STORE, 'utf8'));
  } catch (_err) {
    return { tenants: [], templates: [], global_config: {} };
  }
}

function saveStoreTenant(seed) {
  const store = loadStore();
  store.tenants = (store.tenants || []).filter((tenant) => tenant.id !== seed.tenant.id);
  store.tenants.push({
    id: seed.tenant.id,
    name: seed.tenant.name,
    businessName: seed.tenant.name,
    email: seed.tenant.email,
    ownerName: 'Paulo Cruz',
    phone: '',
    document: '',
    plan: 'starter',
    status: 'active',
    role: 'tenant_owner',
    domain: '',
    storeUrl: '',
    adminUrl: 'admin.html',
    source: 'legacy-html',
    seedFile: path.relative(ROOT, OUT),
    notes: 'Usuário criado a partir dos dados embutidos no HTML antigo.',
    updatedAt: seed.generatedAt
  });
  fs.writeFileSync(STORE, `${JSON.stringify(store, null, 2)}\n`);
}

const html = fs.readFileSync(INDEX, 'utf8');
const cfg = readMarkedJson(html, 'CFG');
const products = readMarkedJson(html, 'PROD');
const upsells = readMarkedJson(html, 'UPSELL');
const reviews = readMarkedJson(html, 'REVIEWS');

const categories = (cfg.categories && cfg.categories.length ? cfg.categories : Array.from(
  products.reduce((seen, product) => {
    if (product.category && !seen.has(product.category)) {
      seen.set(product.category, { id: product.category, label: product.category });
    }
    return seen;
  }, new Map()).values()
)).map((category) => ({
  id: docId(category.id || category.slug || category.label, 'categoria'),
  name: category.name || category.label || category.id,
  label: category.label || category.name || category.id,
  hidden: !!category.hidden
}));

const seed = {
  generatedAt: new Date().toISOString(),
  source: 'index.html legacy embedded data',
  tenant: {
    id: TENANT_ID,
    email: TENANT_EMAIL,
    name: TENANT_NAME,
    role: 'tenant_owner',
    status: 'active'
  },
  firestore: {
    system_tenants: {
      [TENANT_ID]: {
        tenantId: TENANT_ID,
        email: TENANT_EMAIL,
        name: TENANT_NAME,
        role: 'tenant_owner',
        status: 'active',
        source: 'legacy-html'
      }
    },
    tenants: {
      [TENANT_ID]: {
        config: {
          geral: {
            businessName: TENANT_NAME,
            logoUrl: cfg.logoUrl || '',
            faviconUrl: cfg.faviconUrl || ''
          },
          dominio: {
            siteUrl: cfg.siteUrl || '',
            publicUrl: cfg.siteUrl || ''
          },
          pagamentos: {
            paymentMethods: cfg.paymentMethods || []
          },
          endereco: {
            pickupAddress: cfg.pickupAddress || '',
            pickupArea: cfg.pickupArea || ''
          },
          operacao: pick(cfg, ['manualClosed', 'prepTime', 'minDeliveryOrder']),
          horarios: {
            hours: cfg.hours || []
          },
          zonas: {
            deliveryZones: cfg.deliveryZones || []
          },
          seo: pick(cfg, ['seoTitle', 'seoDesc', 'seoKeywords']),
          integracoes: pick(cfg, ['gaId', 'gtmId', 'pixelId']),
          template: Object.assign({}, cfg, { categories, coupons: cfg.coupons || [] })
        },
        products: products.reduce((acc, product) => {
          acc[docId(product.id, product.codigo || product.name)] = product;
          return acc;
        }, {}),
        categories: categories.reduce((acc, category) => {
          acc[category.id] = category;
          return acc;
        }, {}),
        upsells: upsells.reduce((acc, upsell) => {
          acc[docId(upsell.id, `upsell-${Object.keys(acc).length + 1}`)] = upsell;
          return acc;
        }, {}),
        upsellRules: upsells.reduce((acc, upsell) => {
          acc[docId(upsell.id, `upsell-${Object.keys(acc).length + 1}`)] = upsell;
          return acc;
        }, {}),
        reviews: reviews.reduce((acc, review) => {
          acc[docId(review.id, `review-${Object.keys(acc).length + 1}`)] = review;
          return acc;
        }, {})
      }
    }
  },
  counts: {
    products: products.length,
    categories: categories.length,
    upsells: upsells.length,
    reviews: reviews.length
  }
};

fs.writeFileSync(OUT, `${JSON.stringify(seed, null, 2)}\n`);
saveStoreTenant(seed);

console.log(`Seed created: ${path.relative(ROOT, OUT)}`);
console.log(JSON.stringify(seed.counts));
