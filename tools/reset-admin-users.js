#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const admin = require('../functions/node_modules/firebase-admin');

const ROOT = path.resolve(__dirname, '..');
const SERVICE_ACCOUNT = path.join(ROOT, 'firebase-service-account.json');
const MASTER_STORE = path.join(ROOT, '.master-store.json');
const BACKUP_DIR = path.join(ROOT, 'backups');
const MASTER_EMAILS = new Set([
  'bocadobrasil.es@gmail.com',
  'pcruz.digital@gmail.com'
]);

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function isMasterAccount(data) {
  const email = String(data.email || data.ownerEmail || data.adminEmail || '').trim().toLowerCase();
  const role = String(data.role || data.accountRole || '').trim();
  return MASTER_EMAILS.has(email) || role === 'master_admin' || role === 'master';
}

function docToPlain(doc) {
  return doc.exists ? Object.assign({ id: doc.id }, doc.data() || {}) : null;
}

async function listCollectionPlain(db, collection) {
  const snap = await db.collection(collection).get();
  return snap.docs.map(docToPlain).filter(Boolean);
}

async function main() {
  const execute = process.argv.includes('--execute');
  if (!fs.existsSync(SERVICE_ACCOUNT)) {
    throw new Error('firebase-service-account.json não encontrado.');
  }

  const serviceAccount = require(SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || 'bocado-brasil'
  });

  const db = admin.firestore();
  const auth = admin.auth();
  const masterStore = readJson(MASTER_STORE, { tenants: [], deleted_tenants: [], templates: [], global_config: {}, publications: [] });
  const systemTenants = await listCollectionPlain(db, 'system_tenants');
  const localTenants = Array.isArray(masterStore.tenants) ? masterStore.tenants : [];

  const byId = new Map();
  systemTenants.concat(localTenants).forEach((tenant) => {
    const id = String(tenant.id || tenant.uid || tenant.tenantId || '').trim();
    if (!id) return;
    const current = byId.get(id) || {};
    byId.set(id, Object.assign({}, current, tenant, { id }));
  });

  const candidates = Array.from(byId.values()).filter((tenant) => !isMasterAccount(tenant));
  const ids = candidates.map((tenant) => tenant.id).filter(Boolean);
  const slugs = candidates
    .flatMap((tenant) => [tenant.slug, tenant.store && tenant.store.slug])
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  const publicStores = await listCollectionPlain(db, 'public_stores');
  const publicStoresToDelete = publicStores.filter((store) => {
    const tenantId = String(store.tenantId || '').trim();
    const slug = String(store.slug || store.id || '').trim();
    return ids.includes(tenantId) || slugs.includes(slug);
  });

  const authUsers = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const result = await auth.getUsers(chunk.map((uid) => ({ uid }))).catch(() => ({ users: [] }));
    (result.users || []).forEach((user) => {
      authUsers.push({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        disabled: user.disabled === true
      });
    });
  }

  const tenantRootDocs = [];
  for (const id of ids) {
    const doc = await db.collection('tenants').doc(id).get();
    if (doc.exists) tenantRootDocs.push(docToPlain(doc));
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backupFile = path.join(BACKUP_DIR, `admin-users-reset-${nowStamp()}.json`);
  const backup = {
    createdAt: new Date().toISOString(),
    mode: execute ? 'execute' : 'dry-run',
    scope: 'admin_user_accounts_only',
    kept: {
      globalConfig: true,
      stripe: true,
      emailSettings: true,
      systemPages: true,
      documentation: true
    },
    candidates,
    authUsers,
    tenantRootDocs,
    publicStoresToDelete,
    masterStoreBefore: masterStore
  };
  writeJson(backupFile, backup);

  const summary = {
    execute,
    backupFile,
    candidates: candidates.length,
    authUsers: authUsers.length,
    tenantRootDocs: tenantRootDocs.length,
    publicStoresToDelete: publicStoresToDelete.length,
    ids
  };

  if (!execute) {
    console.log(JSON.stringify(Object.assign({ ok: true, dryRun: true }, summary), null, 2));
    return;
  }

  if (process.env.CONFIRM_RESET_ADMIN_USERS !== 'SIM') {
    throw new Error('Defina CONFIRM_RESET_ADMIN_USERS=SIM para executar.');
  }

  for (const store of publicStoresToDelete) {
    await db.collection('public_stores').doc(store.id).delete();
  }

  for (const id of ids) {
    await db.collection('system_tenants').doc(id).delete();
    const tenantRef = db.collection('tenants').doc(id);
    const tenantSnap = await tenantRef.get();
    if (tenantSnap.exists) await db.recursiveDelete(tenantRef);
  }

  for (let i = 0; i < ids.length; i += 1000) {
    const chunk = ids.slice(i, i + 1000);
    if (!chunk.length) continue;
    await auth.deleteUsers(chunk).catch(async () => {
      for (const uid of chunk) {
        await auth.deleteUser(uid).catch(() => null);
      }
    });
  }

  const nextStore = Object.assign({}, masterStore, {
    tenants: [],
    deleted_tenants: Array.from(new Set([].concat(masterStore.deleted_tenants || [], ids))),
    lastAdminUsersResetAt: new Date().toISOString(),
    lastAdminUsersResetBackup: path.relative(ROOT, backupFile)
  });
  writeJson(MASTER_STORE, nextStore);

  const remainingSystemTenants = await db.collection('system_tenants').get();
  const remainingLocalStore = readJson(MASTER_STORE, {});
  console.log(JSON.stringify(Object.assign({ ok: true, remainingSystemTenants: remainingSystemTenants.size, remainingLocalTenants: (remainingLocalStore.tenants || []).length }, summary), null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message || String(error) }, null, 2));
  process.exit(1);
});
