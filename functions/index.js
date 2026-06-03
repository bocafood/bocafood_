const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const net = require("net");
const tls = require("tls");
const crypto = require("crypto");

admin.initializeApp({
  projectId: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "bocado-brasil"
});

const db = admin.firestore();
const REGION = "us-central1";
const FIREBASE_ADMIN_SERVICE_ACCOUNT = "firebase-adminsdk-fbsvc@bocado-brasil.iam.gserviceaccount.com";
const FIRESTORE_BACKUP_DEFAULT_BUCKET = "gs://bocado-brasil-firestore-backups";
const BOCAFOOD_BRAND_LOGO_URL = "https://bocafood.app/assets/boca-food-logo.png?v=20260518-bocafood-logo";
const HOTMART_HOTTOK_SECRET = defineSecret("HOTMART_HOTTOK");
const MASTER_EMAILS = new Set([
  "bocadobrasil.es@gmail.com",
  "pcruz.digital@gmail.com"
]);
const HOTMART_OFFER_PLANS = {
  u7wyvsyn: { planSlug: "essencial", billingCycle: "monthly", trialDays: 15 },
  kah1d2ne: { planSlug: "compromisso_anual", billingCycle: "annual", trialDays: 15 },
  woavlwrh: { planSlug: "fundadoras", billingCycle: "monthly", trialDays: 0 }
};
const PLAN_DISPLAY_NAMES = {
  essencial: "Plano Essencial",
  compromisso_anual: "Plano Compromisso Anual",
  fundadoras: "Plano Fundadoras",
  starter: "Plano Essencial"
};
const TENANT_TAG_KEYS = [
  "trial_ending",
  "trial_ends_today",
  "trial_expired",
  "store_not_published",
  "store_ready_to_publish",
  "payment_pending",
  "subscription_canceled",
  "subscription_active",
  "hotmart_pending_access",
  "inactive_user"
];

const HOTMART_BLOCKED_STATUSES = ["canceled", "refunded", "chargeback"];

function normalizeBocaFoodBrandLogoUrl(value) {
  const url = String(value || "").trim();
  if (!url || url.includes("logo%20BocaFood.png") || url.includes("logo BocaFood.png")) return BOCAFOOD_BRAND_LOGO_URL;
  return url;
}

const CRM_TAG_DEFAULTS = {
  trial_sem_cardapio: {
    name: "Trial sem cardápio",
    key: "trial_sem_cardapio",
    description: "Conta em trial que ainda não iniciou o cardápio.",
    color: "#F59E0B",
    enabled: true,
    createdBy: "system"
  },
  usuario_inativo: {
    name: "Usuário inativo",
    key: "usuario_inativo",
    description: "Conta com pouca atividade recente.",
    color: "#6B7280",
    enabled: true,
    createdBy: "system"
  },
  potencial_upgrade: {
    name: "Potencial upgrade",
    key: "potencial_upgrade",
    description: "Conta com sinais de maturidade para plano superior.",
    color: "#2563EB",
    enabled: true,
    createdBy: "system"
  },
  cardapio_iniciado: {
    name: "Cardápio iniciado",
    key: "cardapio_iniciado",
    description: "Conta que já iniciou cadastro de produtos/cardápio.",
    color: "#16A34A",
    enabled: true,
    createdBy: "system"
  },
  loja_publicada: {
    name: "Loja publicada",
    key: "loja_publicada",
    description: "Conta com loja pública publicada.",
    color: "#059669",
    enabled: true,
    createdBy: "system"
  },
  risco_cancelamento: {
    name: "Risco de cancelamento",
    key: "risco_cancelamento",
    description: "Conta com sinais de risco comercial ou cobrança crítica.",
    color: "#DC2626",
    enabled: true,
    createdBy: "system"
  },
  cliente_avancada: {
    name: "Cliente avançada",
    key: "cliente_avancada",
    description: "Conta com uso avançado do BocaFood.",
    color: "#7C3AED",
    enabled: true,
    createdBy: "system"
  }
};

const CRM_TAG_RULE_DEFAULTS = {
  trial_sem_cardapio_rule: {
    name: "Marcar trial sem cardápio",
    description: "Aplica tag CRM quando a conta está em trial há mais de 5 dias e ainda não tem produtos.",
    enabled: false,
    audience: "tenants",
    conditions: [
      { field: "billing.status", operator: "equals", value: "trial" },
      { field: "createdAt", operator: "older_than_days", value: 5 },
      { field: "stats.productsCount", operator: "equals", value: 0 }
    ],
    actions: [
      { type: "add_tag", tagKey: "trial_sem_cardapio" }
    ],
    runFrequency: "daily",
    createdBy: "system"
  },
  cardapio_iniciado_rule: {
    name: "Marcar cardápio iniciado",
    description: "Remove trial sem cardápio e marca cardápio iniciado quando a conta tem produtos.",
    enabled: false,
    audience: "tenants",
    conditions: [
      { field: "stats.productsCount", operator: "greater_than", value: 0 }
    ],
    actions: [
      { type: "remove_tag", tagKey: "trial_sem_cardapio" },
      { type: "add_tag", tagKey: "cardapio_iniciado" }
    ],
    runFrequency: "daily",
    createdBy: "system"
  },
  loja_publicada_rule: {
    name: "Marcar loja publicada",
    description: "Aplica tag CRM quando a loja está publicada.",
    enabled: false,
    audience: "tenants",
    conditions: [
      { field: "store.status", operator: "equals", value: "published" }
    ],
    actions: [
      { type: "add_tag", tagKey: "loja_publicada" }
    ],
    runFrequency: "daily",
    createdBy: "system"
  },
  risco_cancelamento_rule: {
    name: "Marcar risco de cancelamento",
    description: "Aplica tag CRM para contas com cobrança atrasada ou crítica.",
    enabled: false,
    audience: "tenants",
    conditions: [
      { field: "billing.status", operator: "equals", value: "past_due" }
    ],
    actions: [
      { type: "add_tag", tagKey: "risco_cancelamento" }
    ],
    runFrequency: "daily",
    createdBy: "system"
  }
};

const EMAIL_TRIGGER_DEFAULTS = {
  welcome_hotmart_email: {
    triggerKey: "welcome_hotmart_email",
    tagKey: "hotmart_pending_access",
    templateKey: "welcome_hotmart",
    name: "Boas-vindas Hotmart",
    description: "Envia boas-vindas quando existir pendência de acesso Hotmart marcada por etiqueta.",
    enabled: false,
    delayHours: 0,
    dedupeWindowDays: 30,
    source: "system"
  },
  trial_ending_email: {
    triggerKey: "trial_ending_email",
    tagKey: "trial_ending",
    templateKey: "trial_ending",
    name: "Trial acabando",
    description: "Envia aviso quando o trial estiver perto de acabar.",
    enabled: true,
    delayHours: 0,
    dedupeWindowDays: 30,
    source: "system"
  },
  trial_ends_today_email: {
    triggerKey: "trial_ends_today_email",
    tagKey: "trial_ends_today",
    templateKey: "trial_ends_today",
    name: "Trial acaba hoje",
    description: "Envia aviso no dia em que o trial termina.",
    enabled: true,
    delayHours: 0,
    dedupeWindowDays: 30,
    source: "system"
  },
  trial_expired_email: {
    triggerKey: "trial_expired_email",
    tagKey: "trial_expired",
    templateKey: "trial_expired",
    name: "Trial expirado",
    description: "Envia aviso quando o trial terminou sem assinatura ativa.",
    enabled: true,
    delayHours: 0,
    dedupeWindowDays: 30,
    source: "system"
  },
  payment_pending_email: {
    triggerKey: "payment_pending_email",
    tagKey: "payment_pending",
    templateKey: "payment_pending",
    name: "Pagamento pendente",
    description: "Envia aviso quando a cobrança estiver pendente.",
    enabled: true,
    delayHours: 0,
    dedupeWindowDays: 7,
    source: "system"
  },
  subscription_active_email: {
    triggerKey: "subscription_active_email",
    tagKey: "subscription_active",
    templateKey: "subscription_active",
    name: "Assinatura ativa",
    description: "Gatilho preparado para contas marcadas com assinatura ativa.",
    enabled: false,
    delayHours: 0,
    dedupeWindowDays: 30,
    source: "system"
  },
  subscription_canceled_email: {
    triggerKey: "subscription_canceled_email",
    tagKey: "subscription_canceled",
    templateKey: "access_blocked",
    name: "Acesso bloqueado",
    description: "Envia aviso quando cancelamento, reembolso ou chargeback bloqueia o acesso.",
    enabled: true,
    delayHours: 0,
    dedupeWindowDays: 30,
    source: "system"
  },
  store_not_published_email: {
    triggerKey: "store_not_published_email",
    tagKey: "store_not_published",
    templateKey: "store_not_published",
    name: "Loja não publicada",
    description: "Envia lembrete quando a loja ainda não foi publicada.",
    enabled: false,
    delayHours: 24,
    dedupeWindowDays: 7,
    source: "system"
  }
};

const EMAIL_TEMPLATE_DEFAULTS = {
  welcome_hotmart: {
    key: "welcome_hotmart",
    name: "Boas-vindas após compra Hotmart",
    description: "Enviado quando uma compra Hotmart é aprovada ou uma assinatura fica ativa.",
    subject: "Bem-vinda ao {{productName}}, {{buyerName}}",
    preheader: "Seu acesso ao {{productName}} ja esta pronto.",
    body: "<p>Ola {{buyerName}},</p><p>Obrigada por comprar o {{productName}}. Seu plano {{planName}} esta pronto para comecar.</p><p>Clique no botao para criar seu acesso e entrar no BocaFood.</p>",
    ctaLabel: "Criar meu acesso",
    ctaUrl: "{{signupUrl}}",
    enabled: true,
    availableVariables: ["buyerName", "buyerEmail", "signupUrl", "supportEmail", "planName", "productName", "appBaseUrl", "brandName"]
  },
  welcome_access_created: {
    key: "welcome_access_created",
    name: "Cadastro concluído",
    description: "Enviado quando a cliente conclui o cadastro com compra Hotmart ativa vinculada.",
    subject: "Seu acesso ao {{brandName}} esta pronto",
    preheader: "Seu Centro de Controle ja pode ser acessado.",
    body: "<p>Ola {{buyerName}},</p><p>Seu cadastro foi concluido e sua compra foi vinculada com sucesso.</p><p>Sua loja foi criada como rascunho para voce continuar a configuracao no Centro de Controle.</p>",
    ctaLabel: "Abrir Centro de Controle",
    ctaUrl: "{{appBaseUrl}}/admin.html#dashboard",
    enabled: true,
    availableVariables: ["buyerName", "buyerEmail", "supportEmail", "planName", "productName", "appBaseUrl", "brandName", "storeName"]
  },
  password_reset: {
    key: "password_reset",
    name: "Esqueci minha senha",
    description: "Enviado quando a usuária solicita redefinição de senha no login.",
    subject: "Redefina sua senha do {{brandName}}",
    preheader: "Use este link para criar uma nova senha.",
    body: "<p>Ola {{buyerName}},</p><p>Recebemos uma solicitacao para redefinir a senha da sua conta.</p><p>Se foi voce, use o botao abaixo. Se nao solicitou essa alteracao, ignore este e-mail.</p>",
    ctaLabel: "Redefinir senha",
    ctaUrl: "{{resetPasswordUrl}}",
    enabled: true,
    availableVariables: ["buyerName", "buyerEmail", "resetPasswordUrl", "supportEmail", "appBaseUrl", "brandName"]
  },
  verify_email: {
    key: "verify_email",
    name: "Confirmação de e-mail",
    description: "Confirma o endereço de e-mail da conta BocaFood.",
    subject: "Confirme seu e-mail no {{brandName}}",
    preheader: "Falta apenas confirmar seu e-mail para continuar.",
    body: "<p>Ola {{buyerName}},</p><p>Confirme seu endereco de e-mail para proteger sua conta e receber avisos importantes.</p>",
    ctaLabel: "Confirmar e-mail",
    ctaUrl: "{{appBaseUrl}}",
    enabled: true,
    availableVariables: ["buyerName", "buyerEmail", "supportEmail", "appBaseUrl", "brandName"]
  },
  subscription_active: {
    key: "subscription_active",
    name: "Assinatura ativada",
    description: "Confirma que a assinatura está ativa.",
    subject: "Sua assinatura esta ativa",
    preheader: "Voce ja pode usar o {{productName}} com o plano {{planName}}.",
    body: "<p>Ola {{buyerName}},</p><p>Sua assinatura do {{productName}} esta ativa. Voce ja pode entrar no painel e continuar configurando sua loja.</p>",
    ctaLabel: "Abrir BocaFood",
    ctaUrl: "{{appBaseUrl}}",
    enabled: true,
    availableVariables: ["buyerName", "buyerEmail", "supportEmail", "planName", "productName", "appBaseUrl", "brandName"]
  },
  payment_pending: {
    key: "payment_pending",
    name: "Pagamento pendente",
    description: "Avisa que o pagamento ainda está pendente.",
    subject: "Seu pagamento esta pendente",
    preheader: "Avisaremos quando o pagamento for confirmado.",
    body: "<p>Ola {{buyerName}},</p><p>Seu pagamento do {{productName}} ainda esta pendente. Quando ele for confirmado, enviaremos as instrucoes de acesso.</p>",
    ctaLabel: "Ver status",
    ctaUrl: "{{appBaseUrl}}",
    enabled: true,
    availableVariables: ["buyerName", "buyerEmail", "supportEmail", "planName", "productName", "appBaseUrl", "brandName"]
  },
  access_blocked: {
    key: "access_blocked",
    name: "Acesso bloqueado",
    description: "Avisa que o acesso foi bloqueado por cancelamento, reembolso ou chargeback.",
    subject: "Seu acesso ao {{brandName}} foi bloqueado",
    preheader: "Identificamos uma alteração na sua assinatura Hotmart.",
    body: "<p>Ola {{buyerName}},</p><p>Identificamos uma alteração na sua assinatura do {{productName}} e o acesso ao Centro de Controle foi bloqueado.</p><p>Motivo: {{blockedReason}}.</p><p>Se acredita que houve um erro ou precisa regularizar o acesso, fale com o suporte BocaFood.</p>",
    ctaLabel: "Falar com suporte",
    ctaUrl: "mailto:{{supportEmail}}",
    enabled: true,
    availableVariables: ["buyerName", "buyerEmail", "supportEmail", "planName", "productName", "appBaseUrl", "brandName", "billingStatus", "blockedReason", "canceledAt", "hotmartTransaction", "hotmartOfferCode"]
  },
  trial_ending: {
    key: "trial_ending",
    name: "Trial acabando",
    description: "Aviso enviado quando o periodo de teste esta perto do fim.",
    subject: "Seu teste do {{brandName}} acaba em breve",
    preheader: "Faltam poucos dias para terminar seu periodo de teste.",
    body: "<p>Ola {{buyerName}},</p><p>Seu periodo de teste do {{brandName}} esta acabando em breve.</p><p>Entre no Centro de Controle para revisar sua loja e manter o acesso ativo.</p>",
    ctaLabel: "Abrir BocaFood",
    ctaUrl: "{{appBaseUrl}}",
    enabled: true,
    availableVariables: ["buyerName", "buyerEmail", "supportEmail", "appBaseUrl", "brandName", "trialEndsAt", "planName"]
  },
  trial_ends_today: {
    key: "trial_ends_today",
    name: "Trial acaba hoje",
    description: "Aviso enviado no dia final do periodo de teste.",
    subject: "Seu teste do {{brandName}} acaba hoje",
    preheader: "Hoje e o ultimo dia do seu periodo de teste.",
    body: "<p>Ola {{buyerName}},</p><p>Seu teste do {{brandName}} acaba hoje.</p><p>Se precisar de ajuda para continuar, fale com o suporte.</p>",
    ctaLabel: "Abrir BocaFood",
    ctaUrl: "{{appBaseUrl}}",
    enabled: true,
    availableVariables: ["buyerName", "buyerEmail", "supportEmail", "appBaseUrl", "brandName", "trialEndsAt", "planName"]
  },
  trial_expired: {
    key: "trial_expired",
    name: "Trial expirado",
    description: "Aviso enviado quando o periodo de teste terminou.",
    subject: "Seu teste do {{brandName}} terminou",
    preheader: "Seu periodo de teste chegou ao fim.",
    body: "<p>Ola {{buyerName}},</p><p>Seu periodo de teste terminou. Para continuar usando o BocaFood, regularize seu acesso ou fale com o suporte.</p>",
    ctaLabel: "Falar com suporte",
    ctaUrl: "mailto:{{supportEmail}}",
    enabled: true,
    availableVariables: ["buyerName", "buyerEmail", "supportEmail", "appBaseUrl", "brandName", "trialEndsAt", "planName"]
  },
  store_not_published: {
    key: "store_not_published",
    name: "Loja não publicada",
    description: "Lembrete para contas que ainda nao publicaram a loja.",
    subject: "Sua loja ainda nao esta publicada",
    preheader: "Complete a publicacao para seus clientes encontrarem sua loja.",
    body: "<p>Ola {{buyerName}},</p><p>Sua loja publica ainda nao foi publicada.</p><p>Entre no Centro de Controle, revise a configuracao e publique sua loja quando estiver pronta.</p>",
    ctaLabel: "Abrir Centro de Controle",
    ctaUrl: "{{appBaseUrl}}",
    enabled: false,
    availableVariables: ["buyerName", "buyerEmail", "supportEmail", "appBaseUrl", "brandName", "storeName"]
  },
  subscription_canceled: {
    key: "subscription_canceled",
    name: "Assinatura cancelada",
    description: "Avisa sobre cancelamento da assinatura.",
    subject: "Sua assinatura foi cancelada",
    preheader: "Seu acesso pode ficar limitado conforme o ciclo de cobranca.",
    body: "<p>Ola {{buyerName}},</p><p>Registramos o cancelamento da sua assinatura. Se foi um erro ou se voce precisa de ajuda, fale com o suporte.</p>",
    ctaLabel: "Falar com suporte",
    ctaUrl: "mailto:{{supportEmail}}",
    enabled: true,
    availableVariables: ["buyerName", "buyerEmail", "supportEmail", "planName", "productName", "appBaseUrl", "brandName"]
  },
  test_email: {
    key: "test_email",
    name: "Teste de envio",
    description: "Usado pelo Master para validar a fila de e-mail.",
    subject: "Teste de e-mail do {{brandName}}",
    preheader: "Se voce recebeu esta mensagem, a fila de e-mails esta funcionando.",
    body: "<p>Ola {{buyerName}},</p><p>Este e um e-mail de teste enviado pelo Master do BocaFood.</p>",
    ctaLabel: "Abrir BocaFood",
    ctaUrl: "{{appBaseUrl}}",
    enabled: true,
    availableVariables: ["buyerName", "buyerEmail", "supportEmail", "appBaseUrl", "brandName"]
  }
};
const DEFAULT_SUPPORT_EMAIL = "teajudo@bocafood.app";

function serverTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function hotmartOfferCodeFromPayload(payload) {
  const data = payload.data || payload || {};
  const purchase = data.purchase || {};
  const offer = purchase.offer || data.offer || {};
  const direct = offer.code || purchase.offer_code || data.offerCode || data.hotmartOfferCode || "";
  if (direct) return String(direct).trim().toLowerCase();
  const url = String(purchase.checkout_url || purchase.payment_url || data.checkoutUrl || data.url || "");
  const match = url.match(/[?&]off=([^&#]+)/i);
  return match ? decodeURIComponent(match[1]).trim().toLowerCase() : "";
}

function hotmartOfferPlan(payload) {
  return HOTMART_OFFER_PLANS[hotmartOfferCodeFromPayload(payload)] || null;
}

function firstHotmartValue(values) {
  return (values || []).find((item) => item != null && String(item).trim() !== "") || "";
}

function planSlugFromHotmartName(value) {
  const name = String(value || "").toLowerCase();
  if (name.includes("essencial")) return "essencial";
  if (name.includes("compromisso") || name.includes("anual")) return "compromisso_anual";
  if (name.includes("fundadora")) return "fundadoras";
  return "";
}

function eventDateIso(payload) {
  const data = payload.data || payload || {};
  const candidates = [
    data.purchase && data.purchase.approved_date,
    data.purchase && data.purchase.order_date,
    data.purchase && data.purchase.date,
    data.subscription && data.subscription.date_next_charge,
    data.eventDate,
    data.createdAt,
    payload.creation_date,
    payload.createdAt
  ];
  const value = candidates.find((item) => item != null && String(item).trim() !== "");
  if (!value) return nowIso();
  if (typeof value === "number") {
    const ms = value > 9999999999 ? value : value * 1000;
    return new Date(ms).toISOString();
  }
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? nowIso() : new Date(parsed).toISOString();
}

function addDaysIso(iso, days) {
  const count = Number(days || 0);
  if (!count) return "";
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return "";
  return new Date(parsed + count * 86400000).toISOString();
}

function replaceVariables(text, variables) {
  return String(text || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = variables && variables[key] != null ? variables[key] : "";
    return String(value);
  });
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function cleanHeader(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
}

function encodedSubject(value) {
  const text = cleanHeader(value);
  return /[^\x20-\x7E]/.test(text) ? `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=` : text;
}

function emailLogId({ eventId, templateKey, to }) {
  return crypto
    .createHash("sha1")
    .update(`${eventId || "manual"}|${templateKey || ""}|${normalizeEmail(to)}`)
    .digest("hex");
}

function compactMetadata(metadata) {
  const output = {};
  Object.keys(metadata || {}).forEach((key) => {
    if (/password|senha|token|secret|credential|authorization|payload|html|image|customer|cliente/i.test(key)) return;
    const value = metadata[key];
    const text = typeof value === "object" ? JSON.stringify(value) : String(value == null ? "" : value);
    output[key] = text.length > 180 ? text.slice(0, 180) : text;
  });
  return output;
}

function hasActiveTenantTag(tenant, tagKey) {
  const tag = tenant && tenant.tags && tenant.tags[tagKey];
  return !!(tag && tag.active === true);
}

async function applyTenantTag(tenantUid, tagKey, data = {}) {
  if (!tenantUid || !TENANT_TAG_KEYS.includes(tagKey)) return false;
  const ref = db.collection("system_tenants").doc(tenantUid);
  const snap = await ref.get();
  const tenant = snap.exists ? (snap.data() || {}) : {};
  const current = tenant.tags && tenant.tags[tagKey] ? tenant.tags[tagKey] : {};
  const now = nowIso();
  await ref.set({
    tags: {
      [tagKey]: {
        active: true,
        addedAt: current.addedAt || now,
        updatedAt: now,
        source: data.source || "system",
        reason: data.reason || "",
        metadata: compactMetadata(data.metadata || {})
      }
    },
    updatedAt: now
  }, { merge: true });
  return true;
}

async function removeTenantTag(tenantUid, tagKey, data = {}) {
  if (!tenantUid || !TENANT_TAG_KEYS.includes(tagKey)) return false;
  const now = nowIso();
  await db.collection("system_tenants").doc(tenantUid).set({
    tags: {
      [tagKey]: {
        active: false,
        updatedAt: now,
        source: data.source || "system",
        reason: data.reason || "removed"
      }
    },
    updatedAt: now
  }, { merge: true });
  return true;
}

function cleanCrmTagKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

async function ensureCrmTagDefaults() {
  const now = nowIso();
  await Promise.all(Object.keys(CRM_TAG_DEFAULTS).map(async (key) => {
    const ref = db.collection("system_crm_tags").doc(key);
    const snap = await ref.get();
    if (snap.exists) return;
    await ref.set({
      ...CRM_TAG_DEFAULTS[key],
      createdAt: now,
      updatedAt: now
    }, { merge: true });
  }));
}

async function ensureCrmTagRuleDefaults() {
  const now = nowIso();
  await Promise.all(Object.keys(CRM_TAG_RULE_DEFAULTS).map(async (key) => {
    const ref = db.collection("system_crm_tag_rules").doc(key);
    const snap = await ref.get();
    if (snap.exists) return;
    await ref.set({
      ...CRM_TAG_RULE_DEFAULTS[key],
      createdAt: now,
      updatedAt: now
    }, { merge: true });
  }));
}

function getPathValue(source, path) {
  const parts = String(path || "").split(".").filter(Boolean);
  let current = source;
  for (const part of parts) {
    if (current == null || typeof current !== "object" || !(part in current)) return undefined;
    current = current[part];
  }
  return current;
}

function comparableNumber(value) {
  if (typeof value === "number") return value;
  const parsed = Number(String(value == null ? "" : value).replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

function valueExists(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function evaluateCrmCondition(tenant, condition) {
  const field = String(condition && condition.field || "").trim();
  const operator = String(condition && condition.operator || "").trim();
  const expected = condition ? condition.value : undefined;
  const actual = getPathValue(tenant, field);
  if (!field || !operator) return false;
  if (operator === "exists") return valueExists(actual);
  if (operator === "not_exists") return !valueExists(actual);
  if (operator === "equals") return String(actual == null ? "" : actual).toLowerCase() === String(expected == null ? "" : expected).toLowerCase();
  if (operator === "not_equals") return String(actual == null ? "" : actual).toLowerCase() !== String(expected == null ? "" : expected).toLowerCase();
  if (["greater_than", "greater_or_equal", "less_than", "less_or_equal"].includes(operator)) {
    const actualNumber = comparableNumber(actual);
    const expectedNumber = comparableNumber(expected);
    if (actualNumber == null || expectedNumber == null) return false;
    if (operator === "greater_than") return actualNumber > expectedNumber;
    if (operator === "greater_or_equal") return actualNumber >= expectedNumber;
    if (operator === "less_than") return actualNumber < expectedNumber;
    if (operator === "less_or_equal") return actualNumber <= expectedNumber;
  }
  if (operator === "older_than_days" || operator === "newer_than_days") {
    const parsed = actual && actual.toDate ? actual.toDate().getTime() : Date.parse(String(actual || ""));
    const days = comparableNumber(expected);
    if (Number.isNaN(parsed) || days == null) return false;
    const ageMs = Date.now() - parsed;
    const windowMs = days * 86400000;
    return operator === "older_than_days" ? ageMs > windowMs : ageMs <= windowMs;
  }
  return false;
}

function tenantMatchesCrmRule(tenant, rule) {
  const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
  if (!conditions.length) return false;
  return conditions.every((condition) => evaluateCrmCondition(tenant, condition));
}

async function writeCrmTagLog({ ruleId = "", tenantUid = "", action = "", tagKey = "", matched = false, reason = "" }) {
  await db.collection("system_crm_tag_logs").doc().set({
    ruleId,
    tenantUid,
    action,
    tagKey,
    matched: matched === true,
    reason: String(reason || "").slice(0, 240),
    createdAt: serverTimestamp()
  });
}

async function applyCrmTagToTenant(tenantUid, tagKey, meta = {}) {
  const cleanKey = cleanCrmTagKey(tagKey);
  if (!tenantUid || !cleanKey) return false;
  const now = nowIso();
  await db.collection("system_tenants").doc(tenantUid).set({
    crmTags: { [cleanKey]: true },
    crmTagMeta: {
      [cleanKey]: {
        addedAt: meta.addedAt || now,
        addedBy: meta.addedBy || "system",
        source: meta.source || "rule"
      }
    },
    updatedAt: now
  }, { merge: true });
  return true;
}

async function removeCrmTagFromTenant(tenantUid, tagKey) {
  const cleanKey = cleanCrmTagKey(tagKey);
  if (!tenantUid || !cleanKey) return false;
  await db.collection("system_tenants").doc(tenantUid).set({
    crmTags: { [cleanKey]: false },
    updatedAt: nowIso()
  }, { merge: true });
  return true;
}

function dateOnlyMadrid(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function daysUntilMadrid(value) {
  if (!value) return null;
  const date = value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const today = Date.parse(`${dateOnlyMadrid(new Date())}T00:00:00Z`);
  const target = Date.parse(`${dateOnlyMadrid(date)}T00:00:00Z`);
  return Math.round((target - today) / 86400000);
}

function isApprovedHotmartEvent(eventName) {
  const event = String(eventName || "").toUpperCase();
  return [
    "PURCHASE_APPROVED",
    "PURCHASE_COMPLETE",
    "PURCHASE_COMPLETED",
    "SUBSCRIPTION_ACTIVE",
    "SUBSCRIPTION_ACTIVATED",
    "SUBSCRIPTION_REACTIVATED"
  ].includes(event);
}

function hotmartBillingStatus(eventName, payload) {
  const event = String(eventName || "").toUpperCase();
  const data = payload.data || payload || {};
  const purchase = data.purchase || {};
  const subscription = data.subscription || {};
  const rawStatus = String(purchase.status || subscription.status || data.status || "").toUpperCase();
  if (event.includes("CHARGEBACK") || rawStatus.includes("CHARGEBACK")) return "chargeback";
  if (event.includes("REFUND") || event.includes("REIMBURSE") || rawStatus.includes("REFUND")) return "refunded";
  if (event.includes("CANCEL") || rawStatus.includes("CANCEL")) return "canceled";
  if (event.includes("OVERDUE") || event.includes("PAST_DUE") || event.includes("DELAYED") || rawStatus.includes("OVERDUE") || rawStatus.includes("PAST_DUE")) return "past_due";
  if (event.includes("BILLET") || event.includes("BOLETO") || event.includes("PENDING") || event.includes("WAITING") || rawStatus.includes("PENDING") || rawStatus.includes("WAITING")) return "pending_payment";
  if (isApprovedHotmartEvent(event)) return "active";
  return "";
}

function hotmartLogAction(status) {
  return {
    active: "hotmart_subscription_activated",
    canceled: "hotmart_subscription_canceled",
    pending_payment: "hotmart_payment_pending",
    past_due: "hotmart_payment_past_due",
    refunded: "hotmart_refunded",
    chargeback: "hotmart_chargeback"
  }[status] || "hotmart_event_received";
}

function hotmartBlocksAccess(status) {
  return HOTMART_BLOCKED_STATUSES.includes(String(status || ""));
}

function hotmartBlockedReason(status) {
  return {
    canceled: "assinatura cancelada",
    refunded: "compra reembolsada",
    chargeback: "chargeback registrado"
  }[String(status || "")] || "assinatura alterada";
}

function planDisplayName(planSlug) {
  const normalized = String(planSlug || "").trim();
  if (!normalized) return "Plano BocaFood";
  return PLAN_DISPLAY_NAMES[normalized] || normalized.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function mapHotmartCycle(payload) {
  const offerPlan = hotmartOfferPlan(payload);
  if (offerPlan) return { billingCycle: offerPlan.billingCycle, fallback: false };
  const data = payload.data || payload || {};
  const subscription = data.subscription || {};
  const purchase = data.purchase || {};
  const offer = data.offer || {};
  const raw = [
    data.billingCycle,
    data.billing_cycle,
    data.recurrence,
    subscription.billingCycle,
    subscription.billing_cycle,
    subscription.recurrence,
    purchase.billingCycle,
    offer.billingCycle
  ].find((item) => item != null && String(item).trim() !== "");
  const value = String(raw || "").toLowerCase();
  if (["annual", "annually", "yearly", "year", "anual", "ano"].includes(value) || value.includes("annual") || value.includes("year") || value.includes("anual")) return { billingCycle: "annual", fallback: false };
  if (["monthly", "month", "mensal", "mes", "mês"].includes(value) || value.includes("month") || value.includes("mensal")) return { billingCycle: "monthly", fallback: false };
  const reference = [
    subscription.plan && subscription.plan.name,
    subscription.plan_name,
    purchase.plan,
    data.planName,
    offer.code,
    offer.name
  ].map((item) => String(item || "").toLowerCase()).join(" ");
  if (reference.includes("annual") || reference.includes("year") || reference.includes("anual")) return { billingCycle: "annual", fallback: false };
  if (reference.includes("monthly") || reference.includes("mensal") || reference.includes("month")) return { billingCycle: "monthly", fallback: false };
  return { billingCycle: "monthly", fallback: true };
}

function extractHotmartTrialDays(payload) {
  const offerPlan = hotmartOfferPlan(payload);
  if (offerPlan) return offerPlan.trialDays || 0;
  const data = payload.data || payload || {};
  const subscription = data.subscription || {};
  const offer = data.offer || {};
  const plan = subscription.plan || {};
  const value = [data.trialDays, data.trial_days, subscription.trialDays, subscription.trial_days, offer.trialDays, offer.trial_days, plan.trialDays, plan.trial_days]
    .find((item) => item != null && String(item).trim() !== "");
  const days = Number(value || 0);
  return Number.isFinite(days) && days > 0 ? days : 0;
}

function extractHotmartBuyer(payload) {
  const data = payload.data || payload;
  const buyer = data.buyer || data.buyer_info || {};
  const subscriber = data.subscriber || {};
  const purchase = data.purchase || {};
  const subscription = data.subscription || {};
  const product = data.product || {};
  const offer = data.offer || {};
  const fullName = buyer.name || buyer.full_name || subscriber.name || data.buyerName || "";
  const cycleInfo = mapHotmartCycle(payload);
  const activatedAt = eventDateIso(payload);
  const trialDays = extractHotmartTrialDays(payload);
  const planName = subscription.plan && subscription.plan.name ? subscription.plan.name : (subscription.plan_name || purchase.plan || data.planName || "Plano BocaFood");
  const offerCode = hotmartOfferCodeFromPayload(payload);
  const offerPlan = hotmartOfferPlan(payload);
  const rawPlanSlug = firstHotmartValue([
    data.planSlug,
    subscription.plan_slug,
    subscription.plan && subscription.plan.slug,
    offer.planSlug
  ]);
  const planSlug = (offerPlan && offerPlan.planSlug) || rawPlanSlug || planSlugFromHotmartName(planName) || slugify(offerCode || planName || (subscription.plan && subscription.plan.id)) || "essencial";
  return {
    buyerName: fullName || "Cliente",
    buyerEmail: normalizeEmail(buyer.email || subscriber.email || data.buyerEmail || data.email),
    buyerPhone: buyer.phone || buyer.phone_number || (subscriber.phone && (subscriber.phone.phone || subscriber.phone.cell)) || data.buyerPhone || "",
    buyerCountry: buyer.country_iso || buyer.country || subscriber.country || subscriber.country_iso || data.buyerCountry || "",
    planName,
    planSlug,
    productName: product.name || data.productName || "BocaFood",
    hotmartSubscriberCode: subscription.subscriber_code || subscription.subscriberCode || subscriber.code || subscription.code || data.hotmartSubscriberCode || "",
    hotmartTransaction: purchase.transaction || purchase.transaction_code || data.transaction || data.hotmartTransaction || "",
    hotmartProductId: product.id || product.ucode || data.hotmartProductId || "",
    hotmartOfferCode: offerCode,
    billingCycle: cycleInfo.billingCycle,
    billingCycleFallback: cycleInfo.fallback,
    trialDays,
    activatedAt,
    trialEndsAt: trialDays ? addDaysIso(activatedAt, trialDays) : "",
    purchaseStatus: purchase.status || data.purchaseStatus || "",
    subscriptionStatus: subscription.status || data.subscriptionStatus || "",
    buyerAddress: buyer.address || data.buyerAddress || {}
  };
}

async function recordSystemAccessLog(data) {
  const metadata = {};
  Object.keys(data.metadata || {}).forEach((key) => {
    if (/password|senha|token|secret|credential|authorization|payload|html|image|customer|cliente/i.test(key)) return;
    const value = data.metadata[key];
    const text = typeof value === "object" ? JSON.stringify(value) : String(value == null ? "" : value);
    metadata[key] = text.length > 180 ? text.slice(0, 180) : text;
  });
  await db.collection("system_access_logs").doc().set({
    tenantUid: data.tenantUid || "",
    uid: data.tenantUid || "",
    email: data.email || "",
    action: data.action || "hotmart_event_received",
    module: "hotmart",
    entityType: "tenant",
    entityId: data.tenantUid || data.email || "",
    summary: data.summary || "",
    message: data.summary || "",
    source: "hotmart",
    severity: data.severity || "info",
    metadata,
    details: metadata,
    createdAt: nowIso()
  });
}

async function findSystemTenantsForHotmart(buyer) {
  const matches = [];
  if (buyer.buyerEmail) {
    const emailSnap = await db.collection("system_tenants").where("email", "==", buyer.buyerEmail).get();
    emailSnap.forEach((doc) => matches.push({ id: doc.id, data: doc.data() || {} }));
  }
  const codes = [buyer.hotmartSubscriberCode, buyer.hotmartTransaction].filter(Boolean);
  for (const code of codes) {
    const field = code === buyer.hotmartSubscriberCode ? "billing.hotmartSubscriberCode" : "billing.hotmartTransaction";
    const snap = await db.collection("system_tenants").where(field, "==", code).get();
    snap.forEach((doc) => {
      if (!matches.some((item) => item.id === doc.id)) matches.push({ id: doc.id, data: doc.data() || {} });
    });
  }
  return matches;
}

async function applyHotmartBillingToTenants({ buyer, status, eventName, eventAt }) {
  const matches = await findSystemTenantsForHotmart(buyer);
  if (!matches.length) return { count: 0, tenantUids: [] };
  const shouldBlockAccess = hotmartBlocksAccess(status);
  const canceledAt = shouldBlockAccess ? eventAt : "";
  let activePatch = status === "active" ? {
    accountStatus: "active",
    status: "active",
    plan: buyer.planSlug,
    billingCycle: buyer.billingCycle,
    activatedAt: eventAt,
    billingStatus: "active",
    billing: {
      provider: "hotmart",
      status: "active",
      planSlug: buyer.planSlug,
      billingCycle: buyer.billingCycle,
      activatedAt: eventAt,
      hotmartSubscriberCode: buyer.hotmartSubscriberCode || "",
      hotmartTransaction: buyer.hotmartTransaction || "",
      hotmartProductId: buyer.hotmartProductId || "",
      hotmartOfferCode: buyer.hotmartOfferCode || "",
      purchaseStatus: buyer.purchaseStatus || "",
      subscriptionStatus: buyer.subscriptionStatus || "",
      lastHotmartEventAt: eventAt
    },
    updatedAt: eventAt
  } : {
    billingStatus: status,
    billing: {
      provider: "hotmart",
      status,
      canceledAt: canceledAt || "",
      hotmartSubscriberCode: buyer.hotmartSubscriberCode || "",
      hotmartTransaction: buyer.hotmartTransaction || "",
      hotmartProductId: buyer.hotmartProductId || "",
      hotmartOfferCode: buyer.hotmartOfferCode || "",
      purchaseStatus: buyer.purchaseStatus || "",
      subscriptionStatus: buyer.subscriptionStatus || status,
      lastHotmartEventAt: eventAt
    },
    updatedAt: eventAt
  };
  if (shouldBlockAccess) {
    activePatch.accountStatus = "blocked";
    activePatch.status = "blocked";
    activePatch.blockedAt = eventAt;
    activePatch.blockedReason = `hotmart_${status}`;
  }
  if (status === "active" && buyer.trialEndsAt) {
    activePatch.trialEndsAt = buyer.trialEndsAt;
    activePatch.billing.trialEndsAt = buyer.trialEndsAt;
  } else if (status === "active") {
    activePatch.trialEndsAt = admin.firestore.FieldValue.delete();
    activePatch.billing.trialEndsAt = admin.firestore.FieldValue.delete();
  }
  [
    "hotmartSubscriberCode",
    "hotmartTransaction",
    "hotmartProductId",
    "hotmartOfferCode",
    "purchaseStatus",
    "subscriptionStatus"
  ].forEach((field) => {
    if (activePatch.billing && activePatch.billing[field] === "") delete activePatch.billing[field];
  });
  if (canceledAt) activePatch.canceledAt = canceledAt;
  await Promise.all(matches.map(async (item) => {
    await db.collection("system_tenants").doc(item.id).set(activePatch, { merge: true });
    await recordSystemAccessLog({
      tenantUid: item.id,
      email: buyer.buyerEmail || item.data.email || "",
      action: hotmartLogAction(status),
      summary: `Evento Hotmart aplicado ao tenant: ${status}.`,
      severity: ["chargeback", "past_due"].includes(status) ? "warning" : "info",
      metadata: {
        eventType: eventName,
        billingStatus: status,
        accountStatus: activePatch.accountStatus || "",
        planSlug: buyer.planSlug,
        billingCycle: buyer.billingCycle,
        transaction: buyer.hotmartTransaction,
        subscriber: buyer.hotmartSubscriberCode
      }
    });
  }));
  return { count: matches.length, tenantUids: matches.map((item) => item.id) };
}

async function ensureEmailDefaults() {
  const settingsRef = db.collection("system_email_settings").doc("default");
  const settingsSnap = await settingsRef.get();
  if (!settingsSnap.exists) {
    await settingsRef.set({
      fromName: "BocaFood",
      fromEmail: "no-reply@bocafood.com",
      replyTo: DEFAULT_SUPPORT_EMAIL,
      supportEmail: DEFAULT_SUPPORT_EMAIL,
      appBaseUrl: "https://bocafood.app",
      brandName: "BocaFood",
      brandLogoUrl: BOCAFOOD_BRAND_LOGO_URL,
      termsUrl: "https://bocafood.app/termosdeuso",
      privacyUrl: "https://bocafood.app/politicadeprivacidade",
      securityText: "o BocaFood nunca solicita senha por e-mail.",
      footerReasonDefault: "esta mensagem faz parte do seu relacionamento com o BocaFood",
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: "tls",
      smtpUser: "",
      smtpPasswordConfigured: false,
      enabled: false,
      provider: "smtp",
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  const currentSettings = settingsSnap.exists ? (settingsSnap.data() || {}) : {};
  if (
    currentSettings.replyTo === "suporte@bocafood.com" ||
    currentSettings.supportEmail === "suporte@bocafood.com"
  ) {
    await settingsRef.set({
      replyTo: currentSettings.replyTo === "suporte@bocafood.com" ? DEFAULT_SUPPORT_EMAIL : currentSettings.replyTo,
      supportEmail: currentSettings.supportEmail === "suporte@bocafood.com" ? DEFAULT_SUPPORT_EMAIL : currentSettings.supportEmail,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  const batch = db.batch();
  const now = serverTimestamp();
  for (const [key, template] of Object.entries(EMAIL_TEMPLATE_DEFAULTS)) {
    const ref = db.collection("system_email_templates").doc(key);
    const snap = await ref.get();
    if (!snap.exists) {
      batch.set(ref, {
        ...template,
        createdAt: now,
        updatedAt: now
      }, { merge: true });
    } else {
      const current = snap.data() || {};
      const looksLikeOldSpanishDefault = /Hola |Bienvenida|Restablece|suscripci|Prueba de e-mail|Tu pago|Confirma tu/i.test(
        `${current.subject || ""} ${current.preheader || ""} ${current.body || current.html || ""}`
      );
      if (looksLikeOldSpanishDefault) {
        batch.set(ref, {
          ...template,
          createdAt: current.createdAt || now,
          updatedAt: now
        }, { merge: true });
      }
    }
  }
  await batch.commit();
}

async function ensureEmailTriggerDefaults() {
  const batch = db.batch();
  const now = serverTimestamp();
  for (const [key, trigger] of Object.entries(EMAIL_TRIGGER_DEFAULTS)) {
    const ref = db.collection("system_email_triggers").doc(key);
    const snap = await ref.get();
    if (!snap.exists) {
      batch.set(ref, {
        ...trigger,
        createdAt: now,
        updatedAt: now
      }, { merge: true });
    } else {
      const current = snap.data() || {};
      if (
        key === "subscription_canceled_email" &&
        current.source === "system" &&
        current.tagKey === "subscription_canceled" &&
        current.templateKey === "subscription_canceled"
      ) {
        batch.set(ref, {
          templateKey: "access_blocked",
          name: "Acesso bloqueado",
          description: "Envia aviso quando cancelamento, reembolso ou chargeback bloqueia o acesso.",
          updatedAt: now
        }, { merge: true });
      }
    }
  }
  await batch.commit();
}

function buildEmailLayout(settings, template, variables) {
  const brandName = variables.brandName || settings.brandName || "BocaFood";
  const supportEmail = variables.supportEmail || settings.supportEmail || settings.replyTo || "";
  const logoUrl = normalizeBocaFoodBrandLogoUrl(variables.brandLogoUrl || settings.brandLogoUrl);
  const termsUrl = variables.termsUrl || settings.termsUrl || "";
  const privacyUrl = variables.privacyUrl || settings.privacyUrl || "";
  const preheader = replaceVariables(template.preheader || "", variables);
  const body = replaceVariables(template.body || template.html || "", variables);
  const ctaLabel = replaceVariables(template.ctaLabel || "", variables);
  const ctaUrl = replaceVariables(template.ctaUrl || "", variables);
  const title = replaceVariables(template.subject || template.name || brandName, variables);
  const securityText = replaceVariables(variables.securityText || settings.securityText || "o BocaFood nunca solicita senha por e-mail.", variables);
  const reasonSource = String(template.footerReason || "").trim() || variables.footerReasonDefault || settings.footerReasonDefault || "esta mensagem faz parte do seu relacionamento com o BocaFood";
  const emailReason = replaceVariables(reasonSource, variables);
  const termsLink = termsUrl ? `<a href="${escapeHtml(termsUrl)}" style="color:#8A7E7C;text-decoration:none;">Termos de uso</a>` : "Termos de uso";
  const privacyLink = privacyUrl ? `<a href="${escapeHtml(privacyUrl)}" style="color:#8A7E7C;text-decoration:none;">Política de privacidade</a>` : "Política de privacidade";
  const ctaHtml = ctaLabel && ctaUrl
    ? `<div style="margin-top:20px;text-align:left;"><a href="${escapeHtml(ctaUrl)}" target="_blank" rel="noopener" style="display:inline-block;background:linear-gradient(135deg,#C4362A 0%,#A92F25 100%);color:#ffffff;text-decoration:none;border-radius:12px;padding:0 19px;height:44px;line-height:44px;font-size:14px;font-weight:700;min-width:158px;text-align:center;border:1px solid rgba(126,31,24,.16);box-shadow:0 10px 20px rgba(196,54,42,.14),inset 0 1px 0 rgba(255,255,255,.20);">${escapeHtml(ctaLabel)}</a><div style="margin-top:10px;font-size:12px;line-height:1.45;color:#8A7E7C;">Se o botão não abrir, acesse: <a href="${escapeHtml(ctaUrl)}" target="_blank" rel="noopener" style="color:#B42318;text-decoration:none;font-weight:700;">${escapeHtml(ctaUrl)}</a></div></div>`
    : "";
  const footerHtml = `<strong style="font-weight:700;color:#5F5552;">Segurança:</strong> ${escapeHtml(securityText)}<br>Precisa de ajuda? Escreva para <a href="mailto:${escapeHtml(supportEmail)}" style="color:#B42318;text-decoration:none;font-weight:700;">${escapeHtml(supportEmail)}</a><br>Você recebeu este e-mail porque ${escapeHtml(emailReason)}.<br>${escapeHtml(brandName)}<br>${termsLink} &middot; ${privacyLink}`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head><body style="margin:0;padding:0;background:#FAF8F4;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Arial,sans-serif;color:#1F1F1F;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:radial-gradient(circle at 12% 0%,rgba(196,54,42,.085),transparent 30%),linear-gradient(135deg,#FFFCFB 0%,#FAF8F4 55%,#FFF8F6 100%);padding:28px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:linear-gradient(145deg,#FFFFFF 0%,#FFFDFB 42%,#FFF8F6 78%,#FAF8F4 100%);border-radius:20px;box-shadow:0 20px 44px rgba(63,38,35,.085),0 2px 8px rgba(31,31,31,.035);overflow:hidden;border:1px solid #EDE6E3;"><tr><td style="height:4px;background:linear-gradient(90deg,#B42318,#B6925E);font-size:1px;line-height:1px;">&nbsp;</td></tr><tr><td style="padding:18px 28px 13px;text-align:left;border-bottom:1px solid rgba(242,237,237,.75);"><img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brandName)}" width="76" style="display:block;width:76px;max-width:34%;height:auto;border:0;outline:none;text-decoration:none;"></td></tr><tr><td style="padding:20px 28px 0;text-align:left;"><div style="font-size:23px;line-height:1.25;font-weight:700;color:#191514;">${escapeHtml(title)}</div>${preheader ? `<div style="margin-top:8px;max-width:500px;font-size:14.5px;line-height:1.55;color:#6B615F;">${escapeHtml(preheader)}</div>` : ""}<div style="margin-top:18px;font-size:15.5px;line-height:1.68;color:#3F3430;">${body}${ctaHtml}</div></td></tr><tr><td style="padding:18px 28px 28px;background:linear-gradient(135deg,#FFFFFF 0%,#FFF8F6 62%,#FDF1EF 100%);border-top:1px solid rgba(242,237,237,.82);font-size:12px;line-height:1.55;color:#8A7E7C;">${footerHtml}</td></tr></table></td></tr></table></body></html>`;
}

function smtpRead(socket, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(() => cleanup(new Error("smtp_timeout")), timeoutMs);
    const cleanup = (result) => {
      clearTimeout(timer);
      socket.off("data", onData);
      socket.off("error", onError);
      if (result instanceof Error) reject(result);
      else resolve(result);
    };
    const onError = (error) => cleanup(error);
    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      if (!lines.length) return;
      const last = lines[lines.length - 1];
      if (/^\d{3}\s/.test(last)) cleanup(buffer);
    };
    socket.on("data", onData);
    socket.once("error", onError);
  });
}

function maskSmtpUser(user) {
  const text = String(user || "").trim();
  if (!text) return "";
  const parts = text.split("@");
  if (parts.length === 2) {
    return `${parts[0].slice(0, 2)}***@${parts[1]}`;
  }
  return `${text.slice(0, 2)}***`;
}

function smtpTransportConfig(settings) {
  const host = String(settings.smtpHost || "").trim();
  const port = Number(settings.smtpPort || 587);
  const requested = String(settings.smtpSecure || "tls").toLowerCase();
  const secure = port === 465 || requested === "ssl";
  const requireTLS = !secure && (port === 587 || port === 2525 || requested === "tls");
  return { host, port, secure, requireTLS };
}

async function smtpExpect(socket, command, acceptedCodes) {
  if (command) socket.write(`${command}\r\n`);
  const response = await smtpRead(socket);
  const code = Number(String(response).slice(0, 3));
  if (!acceptedCodes.includes(code)) {
    const error = new Error(`smtp_response_${code || "unknown"}`);
    error.responseCode = code || 0;
    error.smtpResponse = String(response || "").slice(0, 500);
    throw error;
  }
  return response;
}

async function smtpAuthenticate(socket, user, password) {
  const plainAuth = Buffer.from(`\u0000${user}\u0000${password}`, "utf8").toString("base64");
  return smtpExpect(socket, `AUTH PLAIN ${plainAuth}`, [235, 503]);
}

function smtpConnect(settings) {
  return new Promise((resolve, reject) => {
    const transport = smtpTransportConfig(settings);
    const { host, port, secure } = transport;
    const options = { host, port, servername: host, rejectUnauthorized: false };
    const socket = secure ? tls.connect(options) : net.connect({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("smtp_connection_timeout"));
    }, 15000);
    socket.once(secure ? "secureConnect" : "connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function smtpStartTls(socket, settings) {
  await smtpExpect(socket, "STARTTLS", [220]);
  return new Promise((resolve, reject) => {
    const secureSocket = tls.connect({
      socket,
      servername: String(settings.smtpHost || "").trim(),
      rejectUnauthorized: false
    });
    secureSocket.once("secureConnect", () => resolve(secureSocket));
    secureSocket.once("error", reject);
  });
}

async function sendSmtpEmail({ settings, password, to, subject, html }) {
  const transport = smtpTransportConfig(settings);
  const { host, port, secure, requireTLS } = transport;
  const user = String(settings.smtpUser || "").trim();
  const fromEmail = normalizeEmail(settings.fromEmail);
  const envelopeFrom = fromEmail;
  const replyTo = normalizeEmail(settings.replyTo || settings.supportEmail || fromEmail);
  const fromName = cleanHeader(settings.fromName || settings.brandName || "BocaFood");
  const trimmedPassword = String(password || "").trim();
  console.info("[SMTP] send config", {
    host,
    port,
    secure,
    requireTLS,
    user: maskSmtpUser(user),
    fromEmail,
    envelopeFrom
  });
  if (!host || !port || !fromEmail || !user || !trimmedPassword) throw new Error("smtp_config_incomplete");
  if (!normalizeEmail(to)) throw new Error("email_to_required");

  let socket = await smtpConnect(settings);
  try {
    await smtpExpect(socket, "", [220]);
    await smtpExpect(socket, "EHLO bocafood.app", [250]);
    if (requireTLS) {
      socket = await smtpStartTls(socket, settings);
      await smtpExpect(socket, "EHLO bocafood.app", [250]);
    }
    await smtpAuthenticate(socket, user, trimmedPassword);
    await smtpExpect(socket, `MAIL FROM:<${envelopeFrom}>`, [250]);
    await smtpExpect(socket, `RCPT TO:<${normalizeEmail(to)}>`, [250, 251]);
    await smtpExpect(socket, "DATA", [354]);
    const safeSubject = encodedSubject(subject || "BocaFood");
    const body = String(html || "").replace(/^\./gm, "..");
    const message = [
      `From: ${encodedSubject(fromName)} <${fromEmail}>`,
      `To: <${normalizeEmail(to)}>`,
      `Reply-To: <${replyTo}>`,
      `Subject: ${safeSubject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "X-BocaFood-Origin: hotmart",
      "",
      body,
      "."
    ].join("\r\n");
    try {
      await smtpExpect(socket, message, [250]);
    } catch (error) {
      const postDataError = String(error && error.message ? error.message : "");
      if (/smtp_response_535|SSL_read|EOF|ECONNRESET|connection reset/i.test(postDataError)) {
        return { accepted: true, warning: postDataError };
      }
      throw error;
    }
    try {
      await smtpExpect(socket, "QUIT", [221]);
    } catch (error) {
      // Alguns SMTPs fecham a conexão logo após aceitar DATA; o envio já foi aceito.
    }
    return { accepted: true };
  } catch (error) {
    console.warn("[SMTP] send failed", {
      host,
      port,
      secure,
      requireTLS,
      user: maskSmtpUser(user),
      fromEmail,
      envelopeFrom,
      responseCode: error && error.responseCode ? error.responseCode : 0,
      response: error && error.smtpResponse ? String(error.smtpResponse).slice(0, 240) : String(error && error.message ? error.message : "").slice(0, 240)
    });
    throw error;
  } finally {
    try { socket.end(); } catch (error) {}
  }
}

async function loadEmailTemplate(templateKey) {
  await ensureEmailDefaults();
  const snap = await db.collection("system_email_templates").doc(templateKey).get();
  if (!snap.exists) throw new Error(`Template ${templateKey} não encontrado`);
  const savedTemplate = snap.data() || {};
  const defaultTemplate = EMAIL_TEMPLATE_DEFAULTS[templateKey] || {};
  const mergedTemplate = { ...defaultTemplate, ...savedTemplate };
  if (!String(mergedTemplate.ctaUrl || "").trim() && defaultTemplate.ctaUrl) {
    mergedTemplate.ctaUrl = defaultTemplate.ctaUrl;
  }
  if (!String(mergedTemplate.ctaLabel || "").trim() && defaultTemplate.ctaLabel) {
    mergedTemplate.ctaLabel = defaultTemplate.ctaLabel;
  }
  return mergedTemplate;
}

async function createEmailFromTemplate({ to, templateKey, variables = {}, origin = "sistema", metadata = {} }) {
  const settingsSnap = await db.collection("system_email_settings").doc("default").get();
  const settings = settingsSnap.exists ? settingsSnap.data() : {};
  const logBase = {
    to: normalizeEmail(to),
    templateKey,
    origin,
    metadata,
    createdAt: serverTimestamp()
  };

  if (!settings.enabled) {
    await db.collection("email_logs").add({ ...logBase, status: "skipped", error: "system_email_disabled" });
    return { ok: false, skipped: true, reason: "system_email_disabled" };
  }

  const template = await loadEmailTemplate(templateKey);
  if (template.enabled === false) {
    await db.collection("email_logs").add({ ...logBase, status: "skipped", error: "template_disabled" });
    return { ok: false, skipped: true, reason: "template_disabled" };
  }

  const mergedVariables = {
    supportEmail: settings.supportEmail || settings.replyTo || "",
    appBaseUrl: settings.appBaseUrl || "https://bocafood.app",
    brandName: settings.brandName || settings.fromName || "BocaFood",
    brandLogoUrl: normalizeBocaFoodBrandLogoUrl(settings.brandLogoUrl),
    termsUrl: settings.termsUrl || "",
    privacyUrl: settings.privacyUrl || "",
    securityText: settings.securityText || "o BocaFood nunca solicita senha por e-mail.",
    footerReasonDefault: settings.footerReasonDefault || "esta mensagem faz parte do seu relacionamento com o BocaFood",
    ...variables
  };
  const subject = replaceVariables(template.subject || "", mergedVariables);
  const html = buildEmailLayout(settings, template, mergedVariables);
  const mailRef = await db.collection("mail").add({
    to: normalizeEmail(to),
    message: { subject, html },
    createdAt: serverTimestamp(),
    templateKey,
    origin
  });
  await db.collection("email_logs").add({
    ...logBase,
    mailId: mailRef.id,
    subject,
    status: "queued"
  });
  return { ok: true, mailId: mailRef.id, subject };
}

async function sendEmailFromTemplateViaSmtp({ to, templateKey, variables = {}, source = "hotmart", eventId = "", tenantUid = "", triggerKey = "", tagKey = "", requireSystemEnabled = true, requireTemplateEnabled = true }) {
  const normalizedTo = normalizeEmail(to);
  const logId = emailLogId({ eventId, templateKey, to: normalizedTo });
  const logRef = db.collection("email_logs").doc(logId);
  const existingLog = await logRef.get();
  if (existingLog.exists && (existingLog.data() || {}).status === "success") {
    await db.collection("email_logs").doc(`${logId}_skipped_${Date.now()}`).set({
      to: normalizedTo,
      templateKey,
      status: "skipped",
      source,
      origin: source,
      eventId,
      tenantUid,
      triggerKey,
      tagKey,
      error: "duplicate_success",
      createdAt: serverTimestamp()
    });
    return { ok: true, skipped: true, reason: "duplicate_success" };
  }

  const baseLog = {
    to: normalizedTo,
    templateKey,
    source,
    origin: source,
    eventId,
    tenantUid,
    triggerKey,
    tagKey,
    createdAt: serverTimestamp()
  };

  try {
    await ensureEmailDefaults();
    const settingsSnap = await db.collection("system_email_settings").doc("default").get();
    const secretSnap = await db.collection("system_private_email_secrets").doc("default").get();
    const settings = settingsSnap.exists ? (settingsSnap.data() || {}) : {};
    const secret = secretSnap.exists ? (secretSnap.data() || {}) : {};
    const settingsTransport = smtpTransportConfig(settings);

    if (requireSystemEnabled && !settings.enabled) {
      await logRef.set({ ...baseLog, status: "skipped", error: "system_email_disabled" }, { merge: true });
      return { ok: false, skipped: true, reason: "system_email_disabled" };
    }

    const template = await loadEmailTemplate(templateKey);
    if (requireTemplateEnabled && template.enabled === false) {
      await logRef.set({ ...baseLog, status: "skipped", error: "template_disabled" }, { merge: true });
      return { ok: false, skipped: true, reason: "template_disabled" };
    }

    const mergedVariables = {
      supportEmail: settings.supportEmail || settings.replyTo || DEFAULT_SUPPORT_EMAIL,
      appBaseUrl: settings.appBaseUrl || "https://bocafood.app",
      brandName: settings.brandName || settings.fromName || "BocaFood",
      brandLogoUrl: normalizeBocaFoodBrandLogoUrl(settings.brandLogoUrl),
      termsUrl: settings.termsUrl || "",
      privacyUrl: settings.privacyUrl || "",
      securityText: settings.securityText || "o BocaFood nunca solicita senha por e-mail.",
      footerReasonDefault: settings.footerReasonDefault || "esta mensagem faz parte do seu relacionamento com o BocaFood",
      ...variables
    };
    const subject = replaceVariables(template.subject || template.name || "BocaFood", mergedVariables);
    const html = buildEmailLayout(settings, template, mergedVariables);
    const smtpResult = await sendSmtpEmail({
      settings,
      password: String(secret.smtpPassword || ""),
      to: normalizedTo,
      subject,
      html
    });
    await logRef.set({
      ...baseLog,
      subject,
      status: smtpResult && smtpResult.warning ? "warning" : "success",
      error: smtpResult && smtpResult.warning ? String(smtpResult.warning).slice(0, 240) : ""
    }, { merge: true });
    return {
      ok: true,
      subject,
      warning: smtpResult && smtpResult.warning ? smtpResult.warning : ""
    };
  } catch (error) {
    const smtpErrorDetail = error && error.smtpResponse
      ? `${error.message || "send_failed"}:${String(error.smtpResponse).slice(0, 180)}`
      : (error && error.message ? error.message : "send_failed");
    await logRef.set({
      ...baseLog,
      subject: "",
      status: "error",
      error: String(smtpErrorDetail).slice(0, 240)
    }, { merge: true });
    return { ok: false, error: error && error.message ? error.message : "send_failed" };
  }
}

async function findTenantByEmail(email) {
  const snap = await db.collection("system_tenants").where("email", "==", normalizeEmail(email)).limit(1).get();
  let found = null;
  snap.forEach((doc) => {
    if (!found) found = { id: doc.id, data: doc.data() || {} };
  });
  return found;
}

exports.requestPasswordResetEmail = onCall({ region: REGION, serviceAccount: FIREBASE_ADMIN_SERVICE_ACCOUNT }, async (request) => {
  const email = normalizeEmail(request.data && request.data.email);
  if (!email || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Informe um e-mail válido.");
  }

  const safeEventHash = crypto.createHash("sha1").update(email).digest("hex").slice(0, 12);
  const eventId = `password_reset_${safeEventHash}_${Date.now()}`;
  let authUser = null;
  try {
    authUser = await admin.auth().getUserByEmail(email);
    console.info("[PASSWORD RESET] auth_user_found", { emailHash: safeEventHash, uid: authUser.uid || "" });
  } catch (error) {
    console.info("[PASSWORD RESET] auth_user_not_found", { emailHash: safeEventHash });
  }

  const settingsSnap = await db.collection("system_email_settings").doc("default").get();
  const secretSnap = await db.collection("system_private_email_secrets").doc("default").get();
  const templateSnap = await db.collection("system_email_templates").doc("password_reset").get();
  const settings = settingsSnap.exists ? (settingsSnap.data() || {}) : {};
  const secret = secretSnap.exists ? (secretSnap.data() || {}) : {};
  const template = templateSnap.exists ? (templateSnap.data() || {}) : {};
  const resetDiagnostics = {
    settingsFound: settingsSnap.exists,
    templateFound: templateSnap.exists,
    templateEnabled: template.enabled !== false,
    smtpHostConfigured: !!settings.smtpHost,
    smtpUserConfigured: !!settings.smtpUser,
    smtpPasswordConfigured: !!secret.smtpPassword,
    settingsEnabled: settings.enabled === true
  };
  console.info("[PASSWORD RESET] config_check", { emailHash: safeEventHash, ...resetDiagnostics });
  const appBaseUrl = String(settings.appBaseUrl || "https://bocafood.app").replace(/\/$/, "");
  let resetPasswordUrl = "";
  let resetLinkErrorCode = "";
  try {
    const generatedResetLink = await admin.auth().generatePasswordResetLink(email, {
      url: `${appBaseUrl}/redefinir-senha`,
      handleCodeInApp: false
    });
    const generatedUrl = new URL(generatedResetLink);
    const generatedOobCode = generatedUrl.searchParams.get("oobCode");
    resetPasswordUrl = generatedOobCode
      ? `${appBaseUrl}/redefinir-senha?mode=resetPassword&oobCode=${encodeURIComponent(generatedOobCode)}`
      : generatedResetLink;
  } catch (error) {
    try {
      const generatedResetLink = await admin.auth().generatePasswordResetLink(email);
      const generatedUrl = new URL(generatedResetLink);
      const generatedOobCode = generatedUrl.searchParams.get("oobCode");
      resetPasswordUrl = generatedOobCode
        ? `${appBaseUrl}/redefinir-senha?mode=resetPassword&oobCode=${encodeURIComponent(generatedOobCode)}`
        : generatedResetLink;
      await db.collection("email_logs").doc(emailLogId({ eventId: `${eventId}_continue_url_fallback`, templateKey: "password_reset", to: email })).set({
        to: email,
        templateKey: "password_reset",
        status: "warning",
        source: "auth",
        origin: "auth",
        eventId,
        error: "password_reset_continue_url_fallback",
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (fallbackError) {
      resetLinkErrorCode = fallbackError && fallbackError.code ? fallbackError.code : "unknown";
      console.info("[PASSWORD RESET] link_not_generated", {
        emailHash: safeEventHash,
        code: resetLinkErrorCode
      });
    }
  }
  if (!resetPasswordUrl) {
    await db.collection("email_logs").doc(emailLogId({ eventId, templateKey: "password_reset", to: email })).set({
      to: email,
      templateKey: "password_reset",
      status: "skipped",
      source: "auth",
      origin: "auth",
      eventId,
      error: resetLinkErrorCode ? `password_reset_link_not_generated:${resetLinkErrorCode}` : "password_reset_link_not_generated",
      createdAt: serverTimestamp()
    }, { merge: true });
    return {
      ok: true,
      smtpSent: false,
      fallbackRequired: false,
      debugCode: "password_reset_link_not_generated"
    };
  }
  const tenant = await findTenantByEmail(email);
  const tenantData = tenant ? tenant.data : {};
  const result = await sendEmailFromTemplateViaSmtp({
    to: email,
    templateKey: "password_reset",
    source: "auth",
    eventId,
    tenantUid: tenant ? tenant.id : (authUser.uid || ""),
    requireSystemEnabled: false,
    requireTemplateEnabled: false,
    variables: {
      buyerName: tenantData.socialName || tenantData.ownerName || tenantData.fullName || authUser.displayName || "Cliente",
      buyerEmail: email,
      resetPasswordUrl,
      supportEmail: settings.supportEmail || settings.replyTo || DEFAULT_SUPPORT_EMAIL,
      appBaseUrl,
      brandName: settings.brandName || settings.fromName || "BocaFood"
    }
  });
  console.info("[PASSWORD RESET] smtp_result", {
    emailHash: safeEventHash,
    ok: result.ok === true,
    skipped: result.skipped === true,
    reason: result.reason || "",
    error: result.error ? String(result.error).slice(0, 120) : ""
  });
  const debugCode = result.ok === true && result.skipped !== true
    ? "smtp_success"
    : (result.skipped === true ? `smtp_skipped_${result.reason || "unknown"}` : `smtp_error_${result.error || "send_failed"}`);
  await db.collection("system_access_logs").doc().set({
    tenantUid: tenant ? tenant.id : (authUser.uid || ""),
    email,
    action: "password_reset_requested",
    module: "auth",
    entityType: "tenant",
    entityId: tenant ? tenant.id : (authUser.uid || ""),
    summary: "Solicitação de redefinição de senha.",
    source: "auth",
    severity: "info",
    metadata: {
      templateKey: "password_reset",
      smtpStatus: result.ok === true && result.skipped !== true ? "success" : "smtp_not_sent",
      fallbackRequired: false,
      debugCode,
      diagnostics: resetDiagnostics
    },
    createdAt: nowIso()
  });
  return {
    ok: true,
    smtpSent: result.ok === true && result.skipped !== true,
    fallbackRequired: false,
    debugCode,
    diagnostics: resetDiagnostics
  };
});

async function tenantEmailRecentlySent({ tenantUid, triggerKey, dedupeWindowDays }) {
  if (!tenantUid || !triggerKey) return false;
  const since = Date.now() - Number(dedupeWindowDays || 30) * 86400000;
  const snap = await db.collection("email_logs")
    .where("tenantUid", "==", tenantUid)
    .where("triggerKey", "==", triggerKey)
    .where("status", "==", "success")
    .limit(10)
    .get();
  let found = false;
  snap.forEach((doc) => {
    const data = doc.data() || {};
    const created = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt || 0);
    if (!Number.isNaN(created.getTime()) && created.getTime() >= since) found = true;
  });
  return found;
}

function tenantEmailVariables(tenant, tagKey) {
  const billing = tenant.billing || {};
  const store = tenant.store || {};
  const email = normalizeEmail(tenant.email || (tenant.auth && tenant.auth.email));
  return {
    buyerName: tenant.socialName || tenant.ownerName || tenant.fullName || tenant.name || "Cliente",
    buyerEmail: email,
    supportEmail: DEFAULT_SUPPORT_EMAIL,
    appBaseUrl: "https://bocafood.app",
    brandName: "BocaFood",
    brandLogoUrl: BOCAFOOD_BRAND_LOGO_URL,
    planName: billing.planSlug || tenant.plan || "",
    productName: "BocaFood",
    billingStatus: billing.status || tenant.billingStatus || "",
    billingCycle: billing.billingCycle || tenant.billingCycle || "",
    trialEndsAt: billing.trialEndsAt || tenant.trialEndsAt || "",
    storeName: store.name || tenant.businessName || "",
    tagKey
  };
}

function tenantMeetsStoreReady(tenant) {
  const store = tenant.store || {};
  return !!(store.name && store.slug && store.country && store.language);
}

async function requireMaster(req) {
  const authHeader = req.get("Authorization") || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) throw new Error("missing_auth");
  const decoded = await admin.auth().verifyIdToken(match[1]);
  if (!(await isMasterUser(decoded))) throw new Error("forbidden");
  return decoded;
}

async function isMasterUser(decoded) {
  const email = normalizeEmail(decoded && decoded.email);
  if (MASTER_EMAILS.has(email)) return true;
  const uid = String((decoded && decoded.uid) || "").trim();
  if (!uid) return false;
  const snap = await db.collection("system_master_users").doc(uid).get().catch(() => null);
  if (!snap || !snap.exists) return false;
  const data = snap.data() || {};
  const savedEmail = normalizeEmail(data.email || "");
  if (savedEmail && savedEmail !== email) return false;
  return data.active !== false;
}

async function requireAuthenticatedAdmin(req) {
  const authHeader = req.get("Authorization") || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) throw new Error("missing_auth");
  return admin.auth().verifyIdToken(match[1]);
}

function validSeasonAIReading(value) {
  const data = value && typeof value === "object" ? value : {};
  const cleanList = (items) => Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 4)
    : [];
  const headline = String(data.headline || "").trim().slice(0, 180);
  const nextAction = String(data.nextAction || "").trim().slice(0, 360);
  if (!headline || !nextAction) throw new Error("invalid_ai_response");
  return {
    headline,
    helpingSignals: cleanList(data.helpingSignals),
    blockingSignals: cleanList(data.blockingSignals),
    nextAction
  };
}

function safeSeasonAIContext(context) {
  const out = context && typeof context === "object" ? { ...context } : {};
  delete out.prompt;
  return out;
}

async function loadOpenAIConfig() {
  let apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  let model = String(process.env.OPENAI_SEASONS_MODEL || process.env.OPENAI_MODEL || "").trim();
  let source = apiKey ? "secret_manager" : "";
  try {
    const [settingsSnap, secretSnap] = await Promise.all([
      db.collection("system_ai_settings").doc("default").get(),
      db.collection("system_private_ai_secrets").doc("default").get()
    ]);
    const settings = settingsSnap.exists ? (settingsSnap.data() || {}) : {};
    const secret = secretSnap.exists ? (secretSnap.data() || {}) : {};
    if (settings.enabled === false) {
      return { apiKey: "", model: model || "gpt-4.1-mini", source: "disabled" };
    }
    if (!apiKey && secret.openaiApiKey) {
      apiKey = String(secret.openaiApiKey || "").trim();
      source = "firestore_private";
    }
    if (!model && settings.openaiSeasonsModel) model = String(settings.openaiSeasonsModel || "").trim();
  } catch (error) {
    console.warn("[SeasonsAI] failed to load Firestore AI config", {
      error: String(error && error.message ? error.message : error).slice(0, 180)
    });
  }
  return {
    apiKey,
    model: model || "gpt-4.1-mini",
    source
  };
}

function handleCors(req, res) {
  res.set("Access-Control-Allow-Origin", req.get("Origin") || "*");
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

function normalizeCurrency(value) {
  const raw = String(value || "EUR").trim().toLowerCase();
  return /^[a-z]{3}$/.test(raw) ? raw : "eur";
}

function moneyToStripeCents(value) {
  return Math.max(0, Math.round(Number(value || 0) * 100));
}

function stripeMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function safeStripeSettings(settingsSnap, secretSnap) {
  const settings = settingsSnap && settingsSnap.exists ? (settingsSnap.data() || {}) : {};
  const secret = secretSnap && secretSnap.exists ? (secretSnap.data() || {}) : {};
  const secretKey = String(secret.secretKey || "").trim();
  const publishableKey = String(settings.publishableKey || "").trim();
  return {
    found: !!(settingsSnap && settingsSnap.exists),
    enabled: settings.enabled === true,
    connectEnabled: settings.connectEnabled !== false,
    publishableKeyConfigured: !!publishableKey,
    secretKeyConfigured: !!secretKey || settings.secretKeyConfigured === true,
    webhookSecretConfigured: !!secret.webhookSecret || settings.webhookSecretConfigured === true,
    currency: normalizeCurrency(settings.currency || "EUR").toUpperCase(),
    mode: settings.mode || (publishableKey.startsWith("pk_live_") ? "live" : "test"),
    secretMode: secretKey.startsWith("sk_live_") ? "live" : (secretKey.startsWith("sk_test_") ? "test" : ""),
    keyModesMatch: !publishableKey || !secretKey || (publishableKey.startsWith("pk_live_") && secretKey.startsWith("sk_live_")) || (publishableKey.startsWith("pk_test_") && secretKey.startsWith("sk_test_")),
    updatedAt: settings.updatedAt || ""
  };
}

function sanitizeGlobalFinanceCountry(value) {
  const raw = String(value || "ambos").trim().toLowerCase();
  if (raw === "pt" || raw === "portugal" || raw === "pt-pt") return "PT";
  if (raw === "es" || raw === "espana" || raw === "espanha" || raw === "spain") return "ES";
  return "ambos";
}

function sanitizeGlobalFinanceSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

function sanitizeGlobalFinanceItem(item, index, kind) {
  const data = item && typeof item === "object" ? item : {};
  const name = String(data.name || data.nome || "").trim().slice(0, 90);
  if (!name) return null;
  const slug = sanitizeGlobalFinanceSlug(data.slug || data.code || data.codigo || name);
  const clean = {
    id: String(data.id || `gf-${kind}-${slug || index}`).trim().slice(0, 110),
    name,
    slug,
    order: Number.isFinite(Number(data.order)) ? Number(data.order) : (index + 1) * 10,
    countryFiscal: sanitizeGlobalFinanceCountry(data.countryFiscal || data.fiscalCountry || data.country),
    active: data.active !== false,
    notes: String(data.notes || data.observacao || "").trim().slice(0, 260)
  };
  if (kind === "payment") {
    clean.requiresBankAccount = data.requiresBankAccount != null ? data.requiresBankAccount === true : data.exigeConta === true;
    clean.defaultCompensationDays = Math.max(0, Math.min(365, Number(data.defaultCompensationDays || data.prazoCompensacaoDias || 0) || 0));
  }
  return clean;
}

function sanitizeGlobalFinanceConfig(value) {
  const data = value && typeof value === "object" ? value : {};
  const bankAccountTypes = Array.isArray(data.bankAccountTypes) ? data.bankAccountTypes : undefined;
  const paymentMethodTypes = Array.isArray(data.paymentMethodTypes) ? data.paymentMethodTypes : undefined;
  const clean = {};
  if (bankAccountTypes) {
    clean.bankAccountTypes = bankAccountTypes
      .slice(0, 120)
      .map((item, index) => sanitizeGlobalFinanceItem(item, index, "bank"))
      .filter(Boolean);
  }
  if (paymentMethodTypes) {
    clean.paymentMethodTypes = paymentMethodTypes
      .slice(0, 120)
      .map((item, index) => sanitizeGlobalFinanceItem(item, index, "payment"))
      .filter(Boolean);
  }
  return clean;
}

function sanitizeMasterSystemConfigPatch(body) {
  const input = body && typeof body === "object" ? body : {};
  const patch = input.patch && typeof input.patch === "object" ? input.patch : {};
  const clean = {};
  if (patch.globalFinance || input.globalFinance) {
    clean.globalFinance = sanitizeGlobalFinanceConfig(patch.globalFinance || input.globalFinance);
  }
  if (!Object.keys(clean).length) throw new Error("empty_system_config_patch");
  return clean;
}

async function loadStripePlatformConfig() {
  const [settingsSnap, secretSnap] = await Promise.all([
    db.collection("system_stripe_settings").doc("default").get(),
    db.collection("system_private_stripe_secrets").doc("default").get()
  ]);
  const settings = settingsSnap.exists ? (settingsSnap.data() || {}) : {};
  const secret = secretSnap.exists ? (secretSnap.data() || {}) : {};
  return {
    enabled: settings.enabled === true,
    connectEnabled: settings.connectEnabled !== false,
    publishableKey: String(settings.publishableKey || "").trim(),
    secretKey: String(secret.secretKey || "").trim(),
    webhookSecret: String(secret.webhookSecret || "").trim(),
    currency: normalizeCurrency(settings.currency || "EUR")
  };
}

function stripeFormBody(data) {
  const params = new URLSearchParams();
  Object.keys(data || {}).forEach((key) => {
    if (data[key] === undefined || data[key] === null || data[key] === "") return;
    params.append(key, String(data[key]));
  });
  return params;
}

async function stripeRequest(path, data, config, stripeAccountId) {
  const headers = {
    Authorization: `Bearer ${config.secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded"
  };
  if (stripeAccountId) headers["Stripe-Account"] = stripeAccountId;
  const response = await fetch(`https://api.stripe.com/v1/${path.replace(/^\/+/, "")}`, {
    method: "POST",
    headers,
    body: stripeFormBody(data)
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = json && json.error && json.error.message ? json.error.message : `stripe_http_${response.status}`;
    throw new Error(message);
  }
  return json;
}

async function stripeGet(path, config, stripeAccountId) {
  const headers = { Authorization: `Bearer ${config.secretKey}` };
  if (stripeAccountId) headers["Stripe-Account"] = stripeAccountId;
  const response = await fetch(`https://api.stripe.com/v1/${path.replace(/^\/+/, "")}`, { method: "GET", headers });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = json && json.error && json.error.message ? json.error.message : `stripe_http_${response.status}`;
    throw new Error(message);
  }
  return json;
}

async function stripePlatformDiagnostics(config) {
  if (!config || !config.secretKey) return { checked: false, reason: "secret_key_missing" };
  const result = { checked: true };
  try {
    const account = await stripeGet("account", config);
    result.accountId = account.id || "";
    result.email = account.email || "";
    result.country = account.country || "";
    result.defaultCurrency = account.default_currency || "";
    result.businessName = account.business_profile && account.business_profile.name ? account.business_profile.name : "";
    result.chargesEnabled = account.charges_enabled === true;
    result.payoutsEnabled = account.payouts_enabled === true;
    result.detailsSubmitted = account.details_submitted === true;
  } catch (error) {
    result.accountLookupError = String(error && error.message ? error.message : error).slice(0, 220);
  }
  try {
    await stripeGet("accounts?limit=1", config);
    result.connectAccountListAvailable = true;
  } catch (error) {
    result.connectAccountListAvailable = false;
    result.connectLookupError = String(error && error.message ? error.message : error).slice(0, 220);
  }
  return result;
}

function sanitizeStripeReturnUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "https://cc.bocafood.app/admin.html#configuracoes/integracoes";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.hostname !== "localhost") return "https://cc.bocafood.app/admin.html#configuracoes/integracoes";
    return url.toString().slice(0, 500);
  } catch (error) {
    return "https://cc.bocafood.app/admin.html#configuracoes/integracoes";
  }
}

function stripeCountryFromTenant(tenant, integracoes) {
  const raw = String(
    (integracoes && (integracoes.stripeCountry || integracoes.country)) ||
    tenant.fiscalCountry ||
    tenant.country ||
    (tenant.store && (tenant.store.fiscalCountry || tenant.store.country)) ||
    (tenant.accountAddress && (tenant.accountAddress.fiscalCountry || tenant.accountAddress.country)) ||
    "ES"
  ).trim().toUpperCase();
  if (raw === "PT" || raw === "PORTUGAL") return "PT";
  return "ES";
}

function safeStripeAccountStatus(account) {
  account = account || {};
  const req = account.requirements || {};
  return {
    accountId: String(account.id || ""),
    chargesEnabled: account.charges_enabled === true,
    payoutsEnabled: account.payouts_enabled === true,
    detailsSubmitted: account.details_submitted === true,
    disabledReason: String(req.disabled_reason || ""),
    currentlyDue: Array.isArray(req.currently_due) ? req.currently_due.slice(0, 30) : [],
    eventuallyDue: Array.isArray(req.eventually_due) ? req.eventually_due.slice(0, 30) : [],
    status: account.charges_enabled === true && account.payouts_enabled === true
      ? "ready"
      : (account.details_submitted === true ? "pending_review" : "onboarding_required")
  };
}

function stripePaymentMethodPayload(accountId = "", now = new Date().toISOString()) {
  return {
    nome: "Stripe",
    tipo: "Cartão",
    tipoGlobalId: "card",
    tipoGlobalSlug: "card",
    tipoGlobalNome: "Cartão",
    tipoGlobalCountry: "ambos",
    ativo: true,
    exigeConta: true,
    contaPadraoId: accountId || "",
    provider: "stripe",
    stripe: true,
    stripeConnected: true,
    prazoCompensacaoDias: 0,
    taxaPercentual: 0,
    taxaFixa: 0,
    observacao: "Forma criada automaticamente para pagamentos Stripe Connect.",
    updatedAt: now,
    createdAt: now
  };
}

function findStripePaymentMethod(financeConfig) {
  const methods = Array.isArray(financeConfig && financeConfig.formas_pagamento) ? financeConfig.formas_pagamento : [];
  return methods.find((item) => {
    if (!item || typeof item !== "object") return false;
    const name = String(item.nome || item.name || "").trim().toLowerCase();
    return item.provider === "stripe" || item.stripe === true || item.stripeConnected === true || name === "stripe";
  }) || null;
}

async function ensureStripeFinancePaymentMethod(tenantId, accountId = "") {
  const ref = db.collection("tenants").doc(tenantId).collection("config").doc("financeiro");
  const snap = await ref.get();
  const finance = snap.exists ? snap.data() || {} : {};
  let methods = Array.isArray(finance.formas_pagamento) ? finance.formas_pagamento.slice() : [];
  const itemNow = new Date().toISOString();
  let found = false;
  methods = methods.map((item) => {
    if (typeof item === "string") item = { nome: item, tipo: "outro", ativo: true };
    item = { ...(item || {}) };
    const name = String(item.nome || item.name || "").trim().toLowerCase();
    const isStripe = item.provider === "stripe" || item.stripe === true || item.stripeConnected === true || name === "stripe";
    if (!isStripe) return item;
    found = true;
    return {
      ...item,
      ...stripePaymentMethodPayload(accountId || item.contaPadraoId || "", itemNow),
      taxaPercentual: Number(item.taxaPercentual || item.feePct || 0),
      taxaFixa: Number(item.taxaFixa || item.fixedFee || 0),
      createdAt: item.createdAt || itemNow
    };
  });
  if (!found) methods.push(stripePaymentMethodPayload(accountId, itemNow));
  await ref.set({ formas_pagamento: methods, updatedAt: serverTimestamp() }, { merge: true });
  return methods.find((item) => item && (item.provider === "stripe" || item.stripe === true || String(item.nome || "").toLowerCase() === "stripe")) || null;
}

function stripeEstimatedFee(amount, method) {
  amount = Number(amount || 0);
  method = method || {};
  const pct = Number(method.taxaPercentual || method.feePct || 0);
  const fixed = Number(method.taxaFixa || method.fixedFee || 0);
  return stripeMoney((amount * pct / 100) + fixed);
}

async function stripePaymentFeeFromCharge(config, stripeAccountId, paymentIntent) {
  const chargeId = String(paymentIntent && paymentIntent.latest_charge || "");
  if (!chargeId) return 0;
  try {
    const charge = await stripeGet(`charges/${encodeURIComponent(chargeId)}?expand[]=balance_transaction`, config, stripeAccountId);
    const bt = charge && charge.balance_transaction;
    if (bt && typeof bt === "object" && Number(bt.fee || 0) > 0) return stripeMoney(Number(bt.fee || 0) / 100);
  } catch (error) {
    console.warn("[Stripe] fee lookup failed", { chargeId, error: String(error && error.message ? error.message : error).slice(0, 160) });
  }
  return 0;
}

async function syncStripeFinanceMovements(tenantId, orderId, paymentIntent, config) {
  const tenantRef = db.collection("tenants").doc(tenantId);
  const [orderSnap, integrationsSnap, financeSnap] = await Promise.all([
    tenantRef.collection("orders").doc(orderId).get(),
    tenantRef.collection("config").doc("integracoes").get(),
    tenantRef.collection("config").doc("financeiro").get()
  ]);
  if (!orderSnap.exists) return false;
  const order = orderSnap.data() || {};
  const integrations = integrationsSnap.exists ? integrationsSnap.data() || {} : {};
  const finance = financeSnap.exists ? financeSnap.data() || {} : {};
  const stripeAccountId = String(integrations.stripeConnectedAccountId || integrations.stripeAccountId || "").trim();
  const method = findStripePaymentMethod(finance) || await ensureStripeFinancePaymentMethod(tenantId, integrations.stripeFinanceAccountId || integrations.stripeDefaultAccountId || "");
  const gross = stripeMoney(Number(paymentIntent.amount_received || paymentIntent.amount || 0) / 100);
  if (!(gross > 0)) return false;
  const feeFromStripe = await stripePaymentFeeFromCharge(config, stripeAccountId, paymentIntent);
  const fee = feeFromStripe > 0 ? feeFromStripe : stripeEstimatedFee(gross, method);
  const net = stripeMoney(Math.max(0, gross - fee));
  const accountId = String(integrations.stripeFinanceAccountId || integrations.stripeDefaultAccountId || method.contaPadraoId || "");
  const baseDate = new Date().toISOString().slice(0, 10);
  const orderLabel = String(order.publicOrderCode || order.orderRef || order.orderNumber || orderId);
  const common = {
    conta_id: accountId,
    contaBancariaId: accountId,
    forma_pagamento: "Stripe",
    paymentMethod: "Stripe",
    paymentProvider: "stripe",
    stripePaymentIntentId: paymentIntent.id || "",
    stripeConnectedAccountId: stripeAccountId,
    data: baseDate,
    status: "efetivado",
    updatedAt: serverTimestamp()
  };
  await tenantRef.collection("movimentacoes").doc(`stripe_order_${orderId}_entrada`).set({
    ...common,
    origem: "pedido",
    pedidoId: orderId,
    pedidoNumero: orderLabel,
    tipo: "entrada",
    descricao: `Pedido ${orderLabel} pago no Stripe`,
    valor: gross,
    valorTotalOriginal: gross,
    valorParcela: gross,
    valorRecebido: gross,
    saldoRestante: 0,
    stripeFee: fee,
    stripeNetAmount: net,
    pessoaId: String(order.customerId || order.customerUid || order.clientId || ""),
    pessoaNome: String(order.customerName || order.clientName || order.name || ""),
    customerId: String(order.customerId || order.customerUid || order.clientId || ""),
    customerName: String(order.customerName || order.clientName || order.name || ""),
    createdAt: serverTimestamp()
  }, { merge: true });
  if (fee > 0) {
    await tenantRef.collection("movimentacoes").doc(`stripe_order_${orderId}_taxa`).set({
      ...common,
      origem: "stripe_fee",
      pedidoId: orderId,
      pedidoNumero: orderLabel,
      tipo: "saida",
      descricao: `Taxa Stripe do pedido ${orderLabel}`,
      valor: fee,
      valorTotalOriginal: fee,
      valorParcela: fee,
      valorPago: fee,
      saldoRestante: 0,
      categoria: "Taxas de pagamento",
      categoriaFinanceiraNome: "Taxas de pagamento",
      financialNature: "custo",
      costClass: "indireto",
      stripeGrossAmount: gross,
      stripeNetAmount: net,
      createdAt: serverTimestamp()
    }, { merge: true });
  }
  await tenantRef.collection("orders").doc(orderId).set({
    financeMovementCreated: true,
    financeMovementCreatedAt: serverTimestamp(),
    financeMovementProvider: "stripe",
    stripeFeeAmount: fee,
    stripeNetAmount: net,
    stripeGrossAmount: gross,
    contaBancariaId: accountId,
    conta_id: accountId,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return true;
}

function stockNum(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  let str = String(value == null ? "" : value).trim();
  if (!str) return 0;
  str = str.replace(/[^\d,.-]/g, "");
  if (!str) return 0;
  const lastComma = str.lastIndexOf(",");
  const lastDot = str.lastIndexOf(".");
  if (lastComma > lastDot) str = str.replace(/\./g, "").replace(",", ".");
  else str = str.replace(/,/g, "");
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : 0;
}

function stockFirstText(...values) {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function stockSafeId(value, fallback = "pedido") {
  return String(value || fallback).replace(/[^\w-]/g, "_");
}

function stockRoundQty(value) {
  return Math.round((stockNum(value) + Number.EPSILON) * 10000) / 10000;
}

function stockOrderLabel(order, orderId) {
  return stockFirstText(
    order && order.publicOrderCode,
    order && order.orderRef,
    order && order.orderNumber,
    order && order.number,
    order && order.code,
    order && order.reference,
    orderId ? `#${String(orderId).slice(-6).toUpperCase()}` : ""
  );
}

function stockDateText(...values) {
  for (const value of values) {
    if (!value) continue;
    if (typeof value === "string") {
      const text = value.trim();
      if (text) return text.slice(0, 10);
    }
    if (value && typeof value.toDate === "function") {
      try {
        return value.toDate().toISOString().slice(0, 10);
      } catch (error) {}
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

function stockOrderItemQuantity(item) {
  return stockNum(item && (item.quantity != null ? item.quantity : item.qty != null ? item.qty : item.qtd != null ? item.qtd : item.amount)) || 1;
}

function stockOrderItemUnitCost(item, product) {
  return stockNum(stockFirstText(
    item && item.stockUnitCost,
    item && item.unitCost,
    product && product.stockUnitCost,
    product && product.costPerYield,
    product && product.custoUnitario,
    product && product.custoAtual,
    product && product.custo,
    product && product.cost,
    ""
  ));
}

function stockFindProductForOrderItem(item, products) {
  const wantedId = String((item && (item.productId || item.id)) || "").trim();
  if (wantedId) {
    const byId = products.find((p) => String(p.id || "") === wantedId);
    if (byId) return byId;
  }
  const name = String((item && (item.name || item.productName)) || "").trim().toLowerCase();
  if (!name) return null;
  return products.find((p) => String(p.name || p.title || "").trim().toLowerCase() === name) || null;
}

function stockFindProductByAnyId(id, products) {
  const wanted = String(id || "").trim();
  if (!wanted) return null;
  return products.find((p) => (
    String(p.id || "") === wanted ||
    String(p.productId || "") === wanted ||
    String(p.sourceItemId || "") === wanted ||
    String(p.produtoProntoId || "") === wanted ||
    String(p.fichaId || p.fichaTecnicaId || "") === wanted
  )) || null;
}

function stockFindRecipeById(id, recipes) {
  const wanted = String(id || "").trim();
  if (!wanted) return null;
  return recipes.find((recipe) => (
    String(recipe.id || "") === wanted ||
    String(recipe.fichaTecnicaId || "") === wanted ||
    String(recipe.recipeId || "") === wanted
  )) || null;
}

function stockComponentCost(component) {
  return (component && Array.isArray(component.ingredients) ? component.ingredients : []).reduce((sum, ing) => {
    return sum + stockNum(ing.totalCost || ing.plannedTotalCost || ing.costTotal || ing.custoTotal);
  }, 0);
}

function stockBaseRefsFromRecipe(item, product, quantity, source, fichaId, recipes) {
  const recipe = stockFindRecipeById(fichaId, recipes);
  const components = recipe && Array.isArray(recipe.components) ? recipe.components : [];
  const baseComponents = components.filter((comp) => comp && (comp.stockControl || comp.controlsStock));
  if (!baseComponents.length) return [];
  const recipeYield = stockNum(recipe.yieldQuantity || recipe.yield || recipe.rendimento || product && (product.yieldQuantity || product.yield)) || 1;
  const soldQty = stockNum(quantity) || 1;
  return baseComponents.map((comp, idx) => {
    let baseYield = stockNum(comp.stageYieldQuantity || comp.baseYieldQuantity || comp.stockYieldQuantity);
    if (baseYield <= 0) baseYield = recipeYield;
    const qty = stockRoundQty((baseYield / Math.max(1, recipeYield)) * soldQty);
    const totalCost = stockComponentCost(comp);
    const unitCost = baseYield > 0 ? totalCost / baseYield : 0;
    return {
      fichaId,
      fichaNome: recipe.name || recipe.title || "",
      readyItemId: "",
      productId: stockFirstText(item && item.productId, item && item.id, product && product.id, ""),
      productName: stockFirstText(item && item.name, item && item.productName, product && product.name, product && product.title, "Produto"),
      baseProductionId: stockBaseProductionId(recipe, comp, idx),
      baseProductionName: comp.name || "Base de produção",
      componentName: comp.name || "",
      quantity: qty,
      unit: comp.stageYieldUnit || comp.baseYieldUnit || comp.stockYieldUnit || recipe.yieldUnit || "unidades",
      unitCost,
      stockItemType: "base_producao",
      source: source === "combo" ? "combo_base_producao" : "base_producao"
    };
  }).filter((ref) => stockNum(ref.quantity) > 0);
}

function stockBaseProductionId(recipe, comp, idx) {
  const existing = String((comp && comp.baseProductionId) || "").trim();
  if (existing) return existing;
  const shared = String((comp && comp.sharedBaseId) || "").trim();
  if (shared) return shared;
  const componentId = String((comp && (comp.componentId || comp.recipeComponentId)) || "").trim();
  if (componentId) return componentId.startsWith("base_component:") ? componentId : `base_component:${componentId}`;
  return `${(recipe && recipe.id) || "receita"}:${(comp && comp.name) || `etapa_${idx || 0}`}`;
}

function stockRefFromProductLike(item, product, quantity, source, products, recipes) {
  const fichaId = stockFirstText(item && item.fichaTecnicaId, item && item.fichaId, item && item.recipeId, product && product.fichaTecnicaId, product && product.fichaId, product && product.recipeId, "");
  const baseRefs = fichaId ? stockBaseRefsFromRecipe(item, product, quantity, source, fichaId, recipes) : [];
  if (baseRefs.length) return baseRefs;
  const readyItemId = fichaId ? "" : stockFirstText(item && item.sourceItemId, item && item.produtoProntoId, item && item.readyProductId, product && product.sourceItemId, product && product.produtoProntoId, product && product.readyProductId, "");
  if (!fichaId && !readyItemId) return null;
  return {
    fichaId,
    fichaNome: "",
    readyItemId,
    productId: stockFirstText(item && item.productId, item && item.id, product && product.id, ""),
    productName: stockFirstText(item && item.name, item && item.productName, product && product.name, product && product.title, "Produto"),
    quantity,
    unit: stockFirstText(item && item.unit, product && product.stockUnit, product && product.yieldUnit, product && product.unit, "unidades"),
    unitCost: stockOrderItemUnitCost(item, product),
    stockItemType: fichaId ? "produto_produzido" : "produto_pronto",
    source
  };
}

function stockExtractChoiceRefs(item, product, mainQty, products, recipes) {
  let sources = [];
  ["stockChoices", "choiceStockRefs", "choices", "variants", "selections", "options", "selectedOptions", "comboItems", "comboSelections", "items"].forEach((key) => {
    const value = item && item[key];
    if (Array.isArray(value)) sources = sources.concat(value);
  });
  if (!sources.length && product) {
    ["comboItems", "menuItems", "itemsIncluded", "components"].forEach((key) => {
      const value = product[key];
      if (Array.isArray(value)) sources = sources.concat(value);
    });
  }
  const refs = [];
  sources.forEach((choice) => {
    if (!choice || typeof choice !== "object") return;
    const boundRef = stockRefFromChoiceBinding(choice, mainQty, recipes);
    if (Array.isArray(boundRef) && boundRef.length) {
      refs.push(...boundRef);
      return;
    }
    if (boundRef) {
      refs.push(boundRef);
      return;
    }
    const choiceProduct = stockFindProductForOrderItem(choice, products) || stockFindProductByAnyId(stockFirstText(choice.productId, choice.id, choice.itemId, choice.value, choice.optionId, ""), products) || {};
    let qty = stockNum(choice.quantity != null ? choice.quantity : choice.qty != null ? choice.qty : choice.count != null ? choice.count : choice.amount);
    if (qty <= 0) qty = 1;
    const ref = stockRefFromProductLike(choice, choiceProduct, mainQty * qty, "combo", products, recipes);
    if (Array.isArray(ref)) refs.push(...ref);
    else if (ref) refs.push(ref);
  });
  return refs;
}

function stockRefFromChoiceBinding(choice, mainQty, recipes) {
  if (!choice || typeof choice !== "object") return null;
  const ref = String(stockFirstText(choice.stockRef, choice.stockItemRef, choice.stockItem, "") || "").trim();
  const refParts = ref ? ref.split(":") : [];
  const refType = refParts[0] || "";
  const refId = refParts.slice(1).join(":");
  let stockType = stockFirstText(choice.stockItemType, choice.itemClass, choice.classe, "");
  if (!stockType && (refType === "ficha" || refType === "receita")) stockType = "produto_produzido";
  if (!stockType && refType === "produto_pronto") stockType = "produto_pronto";
  if (!stockType && refType === "embalagem") stockType = "embalagem";
  if (!stockType && (refType === "insumo" || refType === "ingrediente")) stockType = "insumo";
  if (!stockType && refType === "base_producao") stockType = "base_producao";
  stockType = stockNormalizeItemType(stockType);
  const itemId = stockFirstText(choice.stockItemId, choice.itemId, refId, choice.fichaTecnicaId, choice.fichaId, choice.sourceItemId, choice.produtoProntoId, "");
  if (!itemId) return null;
  const absoluteQty = stockNum(choice.stockAbsoluteQuantity != null ? choice.stockAbsoluteQuantity : choice.stockQuantityTotal);
  let perChoice = stockNum(choice.stockQuantityPerChoice != null ? choice.stockQuantityPerChoice : choice.stockQuantity != null ? choice.stockQuantity : choice.stockQty);
  if (perChoice <= 0) perChoice = 1;
  let selectedQty = stockNum(choice.quantity != null ? choice.quantity : choice.qty != null ? choice.qty : choice.count != null ? choice.count : choice.amount);
  if (selectedQty <= 0) selectedQty = 1;
  const qty = stockRoundQty(absoluteQty > 0 ? absoluteQty : (stockNum(mainQty) || 1) * selectedQty * perChoice);
  if (qty <= 0) return null;
  if (stockType === "produto_produzido") {
    const baseRefs = stockBaseRefsFromRecipe(choice, {}, qty, "combo_opcao", itemId, recipes);
    if (baseRefs.length) return baseRefs;
  }
  const stockName = stockFirstText(choice.stockItemName, choice.itemName, choice.optionName, choice.name, choice.label, stockType === "produto_produzido" ? "Produto produzido" : "Item da escolha");
  return {
    fichaId: stockType === "produto_produzido" ? itemId : "",
    fichaNome: stockType === "produto_produzido" ? stockName : "",
    readyItemId: (stockType === "produto_produzido" || stockType === "base_producao") ? "" : itemId,
    baseProductionId: stockType === "base_producao" ? itemId : "",
    baseProductionName: stockType === "base_producao" ? stockName : "",
    productId: itemId,
    productName: stockName,
    quantity: qty,
    unit: stockFirstText(choice.stockUnit, choice.unit, "un"),
    unitCost: stockNum(choice.stockUnitCost != null ? choice.stockUnitCost : choice.unitCost),
    stockItemType: stockType,
    source: "combo_opcao"
  };
}

function stockNormalizeItemType(value) {
  const type = String(value || "").trim().toLowerCase();
  if (type === "ingrediente" || type === "ingredientes") return "insumo";
  if (type === "produto" || type === "produto pronto" || type === "compras_produto") return "produto_pronto";
  if (type === "receita" || type === "ficha") return "produto_produzido";
  if (type === "base" || type === "base_producao") return "base_producao";
  if (type === "embalagens") return "embalagem";
  return type || "insumo";
}

function stockMovementBalanceEntry(movement) {
  if (!movement || typeof movement !== "object") return null;
  const type = movement.type || "";
  const isPurchaseEntry = type === "entrada_compra";
  const isProductionEntry = type === "entrada_producao";
  const isBaseProductionEntry = type === "entrada_base_producao";
  const isBaseSaleExit = type === "saida_base_venda";
  const isSaleExit = type === "saida_venda" || isBaseSaleExit;
  const isSaleReturn = type === "retorno_venda";
  const isPurchaseReversal = type === "estorno_compra";
  const isSaleReversal = type === "estorno_venda";
  const isProductionIngredientReversal = type === "estorno_producao_ingrediente";
  const isProductionProductReversal = type === "estorno_producao_produto";
  const isBaseProductionReversal = type === "estorno_base_producao";
  const isAdjustmentEntry = type === "ajuste_entrada";
  const isAdjustmentExit = type === "ajuste_saida";
  const isRegularizationEntry = type === "entrada_regularizacao";
  const isEntry = isProductionEntry || isBaseProductionEntry || isPurchaseEntry || isSaleReversal || isSaleReturn || isProductionIngredientReversal || isAdjustmentEntry || isRegularizationEntry;
  const isExit = type === "saida_producao" || isSaleExit || isPurchaseReversal || isProductionProductReversal || isBaseProductionReversal || isAdjustmentExit;
  if (!isEntry && !isExit) return null;
  const directType = stockNormalizeItemType(movement.stockItemType || movement.itemClass || movement.classe || "");
  const isBase = isBaseProductionEntry || isBaseProductionReversal || isBaseSaleExit || !!movement.baseProductionId;
  const readyId = movement.sourceItemId || movement.produtoProntoId || "";
  const itemId = isBase
    ? (movement.baseProductionId || movement.stockItemId || movement.componentName || "")
    : ((isProductionEntry || isProductionProductReversal)
      ? (movement.fichaTecnicaId || movement.stockItemId || "")
      : (isSaleExit || isSaleReversal || isSaleReturn)
        ? (movement.fichaTecnicaId || readyId || movement.stockItemId || movement.productId || "")
        : (isRegularizationEntry)
          ? (movement.itemId || movement.stockItemId || movement.fichaTecnicaId || readyId || movement.productId || "")
        : ((isAdjustmentEntry || isAdjustmentExit)
          ? (movement.itemId || movement.stockItemId || "")
          : ((isPurchaseEntry || isPurchaseReversal)
            ? (movement.itemId || movement.stockItemId || "")
            : (movement.ingredientId || movement.stockItemId || ""))));
  const fallbackName = isBase
    ? (movement.baseProductionName || movement.componentName || "Base de produção")
    : (movement.fichaTecnicaNome || movement.productName || movement.itemName || movement.ingredientName || "Item");
  const stockType = directType || (isBase ? "base_producao" : ((isProductionEntry || isProductionProductReversal || movement.fichaTecnicaId) ? "produto_produzido" : (readyId ? "produto_pronto" : "insumo")));
  const quantity = (isProductionEntry || isProductionProductReversal || isBaseProductionEntry || isBaseProductionReversal) ? stockNum(movement.quantityProduced || movement.quantity) : stockNum(movement.quantity);
  if (quantity <= 0) return null;
  return {
    key: `${stockType}:${itemId || fallbackName}`,
    direction: isEntry ? 1 : -1,
    quantity: Math.abs(quantity)
  };
}

function stockBalancesByKey(movements) {
  const balances = {};
  (movements || []).forEach((movement) => {
    const entry = stockMovementBalanceEntry(movement);
    if (!entry || !entry.key) return;
    balances[entry.key] = stockRoundQty(stockNum(balances[entry.key]) + entry.direction * entry.quantity);
  });
  return balances;
}

function stockRefBalanceKey(ref) {
  const stockType = stockNormalizeItemType((ref && (ref.stockItemType || ref.itemClass || ref.classe)) || (ref && ref.fichaId ? "produto_produzido" : "produto_pronto"));
  const itemId = ref && (ref.baseProductionId || ref.fichaId || ref.readyItemId || ref.stockItemId || ref.productId || "");
  const name = ref && (ref.baseProductionName || ref.fichaNome || ref.productName || "Item");
  return `${stockType}:${itemId || name}`;
}

function stockRegularizationPendingItem(ref, orderItem, product, data = {}) {
  const stockType = stockNormalizeItemType((ref && (ref.stockItemType || ref.itemClass || ref.classe)) || (ref && ref.fichaId ? "produto_produzido" : "produto_pronto"));
  const itemId = ref && (ref.baseProductionId || ref.fichaId || ref.readyItemId || ref.stockItemId || ref.productId || "");
  const itemName = (ref && (ref.baseProductionName || ref.fichaNome || ref.productName || "")) || stockFirstText(orderItem && orderItem.name, orderItem && orderItem.productName, product && product.name, product && product.title, "Item");
  return {
    status: "pendente",
    origin: "saldo_negativo_venda",
    stockKey: data.stockKey || stockRefBalanceKey(ref),
    stockItemId: itemId,
    stockItemType: stockType,
    itemClass: stockType,
    classe: stockType,
    itemName,
    productId: (ref && ref.productId) || stockFirstText(orderItem && orderItem.productId, orderItem && orderItem.id, product && product.id, ""),
    productName: stockFirstText(orderItem && orderItem.name, orderItem && orderItem.productName, product && product.name, product && product.title, itemName),
    stockSource: (ref && ref.source) || "item",
    movementId: data.movementId || "",
    requiredQuantity: stockRoundQty(stockNum(ref && ref.quantity)),
    shortageQuantity: stockRoundQty(stockNum(data.shortage)),
    balanceBefore: stockRoundQty(stockNum(data.balanceBefore)),
    balanceAfter: stockRoundQty(stockNum(data.balanceAfter)),
    unit: (ref && ref.unit) || "un",
    unitCost: stockNum(ref && ref.unitCost),
    estimatedTotalCost: stockNum(ref && ref.unitCost) > 0 ? stockRoundQty(stockNum(data.shortage) * stockNum(ref && ref.unitCost)) : 0
  };
}

function stockRegularizationMode(config) {
  let mode = String((config && (config.regularizationMode || config.stockRegularizationMode)) || "pendencia").trim().toLowerCase();
  if (mode === "auto") mode = "automatico";
  if (mode === "off") mode = "desligado";
  return ["pendencia", "automatico", "desligado"].includes(mode) ? mode : "pendencia";
}

function stockRegularizationMovementId(orderId, itemIdx, refIdx, ref) {
  return `regularizacao_${stockSafeId(orderId)}_${itemIdx}_${refIdx}_${stockSafeId(ref && (ref.baseProductionId || ref.fichaId || ref.readyItemId || ref.productId) || "item")}`;
}

function stockRegularizationMovementPayload(item, order, movementId) {
  const stockType = stockNormalizeItemType(item.stockItemType || item.itemClass || item.classe || "");
  const qty = stockRoundQty(item.shortageQuantity);
  const unitCost = stockNum(item.unitCost);
  const payload = {
    id: movementId,
    type: "entrada_regularizacao",
    movementGroup: "stock_regularization",
    regularizationOrigin: "saldo_negativo_venda",
    regularizationStatus: "aplicada",
    regularizationEntry: true,
    regularizationSourceMovementId: item.movementId || "",
    orderId: order && order.id || "",
    orderNumber: stockOrderLabel(order || {}, order && order.id),
    itemId: item.stockItemId || "",
    itemName: item.itemName || "",
    productId: item.productId || "",
    productName: item.productName || item.itemName || "",
    stockItemId: item.stockItemId || "",
    stockItemType: stockType,
    itemClass: stockType,
    classe: stockType,
    quantity: qty,
    unit: item.unit || "un",
    unitCost,
    totalCost: unitCost > 0 ? qty * unitCost : 0,
    previousBalance: stockNum(item.balanceAfter),
    balanceBefore: stockNum(item.balanceAfter),
    balanceAfter: stockRoundQty(stockNum(item.balanceAfter) + qty),
    reason: "Regularização automática de venda sem saldo",
    notes: "Entrada criada automaticamente conforme configuração do estoque.",
    movementDate: new Date().toISOString().slice(0, 10),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  if (stockType === "base_producao") {
    payload.baseProductionId = item.stockItemId || "";
    payload.baseProductionName = item.itemName || "";
  } else if (stockType === "produto_produzido") {
    payload.fichaTecnicaId = item.stockItemId || "";
    payload.fichaTecnicaNome = item.itemName || "";
  } else if (stockType === "produto_pronto") {
    payload.sourceItemId = item.stockItemId || "";
    payload.produtoProntoId = item.stockItemId || "";
  }
  return payload;
}

function stockInternalCompositionRefs(item, product, mainQty) {
  const composition = Array.isArray(product && product.internalComposition)
    ? product.internalComposition
    : (Array.isArray(product && product.internalCompositionItems)
      ? product.internalCompositionItems
      : (Array.isArray(product && product.composicaoInterna)
        ? product.composicaoInterna
        : (Array.isArray(product && product.stockComposition) ? product.stockComposition : [])));
  if (!composition.length) return [];
  return composition.map((part) => {
    if (!part || typeof part !== "object") return null;
    const ref = String(part.ref || "").trim();
    const refParts = ref.split(":");
    const refType = refParts[0] || "";
    const refId = refParts.slice(1).join(":");
    let stockType = String(part.stockItemType || part.itemClass || part.classe || "").trim();
    if (!stockType && (refType === "ficha" || refType === "receita")) stockType = "produto_produzido";
    if (!stockType && refType === "produto_pronto") stockType = "produto_pronto";
    if (!stockType && refType === "embalagem") stockType = "embalagem";
    if (!stockType && (refType === "insumo" || refType === "ingrediente")) stockType = "insumo";
    if (!stockType) stockType = "produto_pronto";
    stockType = stockNormalizeItemType(stockType);
    const itemId = String(part.itemId || refId || part.fichaTecnicaId || part.fichaId || part.sourceItemId || part.produtoProntoId || "").trim();
    const qty = stockRoundQty((stockNum(part.quantity != null ? part.quantity : part.qty != null ? part.qty : 1) || 1) * (stockNum(mainQty) || 1));
    if (!itemId || qty <= 0) return null;
    const isProduced = stockType === "produto_produzido" || refType === "ficha" || refType === "receita";
    const stockName = stockFirstText(part.itemName, part.name, part.label, isProduced ? "Produto produzido" : "Item interno");
    return {
      fichaId: isProduced ? itemId : "",
      fichaNome: isProduced ? stockName : "",
      readyItemId: isProduced ? "" : itemId,
      productId: itemId,
      productName: stockName,
      quantity: qty,
      unit: part.unit || "un",
      unitCost: stockNum(part.unitCost),
      stockItemType: stockType,
      source: "composicao_interna"
    };
  }).filter(Boolean);
}

function stockOrderItemRefs(item, product, products, recipes) {
  const mainQty = stockOrderItemQuantity(item);
  const internalRefs = stockInternalCompositionRefs(item, product, mainQty);
  if (internalRefs.length) return internalRefs;
  const direct = stockRefFromProductLike(item, product, mainQty, "item", products, recipes);
  const choices = stockExtractChoiceRefs(item, product, mainQty, products, recipes);
  if (choices.length) return choices;
  if (Array.isArray(direct)) return direct;
  return direct ? [direct] : [];
}

async function syncStripeOrderStockMovements(tenantId, orderId) {
  const tenantRef = db.collection("tenants").doc(tenantId);
  const orderRef = tenantRef.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) return false;
  const order = { id: orderSnap.id, ...(orderSnap.data() || {}) };
  if (order.stockMovementCreated) return true;

  const existingSnap = await tenantRef.collection("stock_movements").where("orderId", "==", orderId).get();
  const existing = [];
  existingSnap.forEach((doc) => {
    const movement = doc.data() || {};
    if (movement.type === "saida_venda" || movement.type === "saida_base_venda") existing.push(movement);
  });
  if (existing.length) {
    await orderRef.set({
      stockMovementCreated: true,
      stockMovementCreatedAt: order.stockMovementCreatedAt || serverTimestamp(),
      stockMovementCount: existing.length,
      stockMovementSkippedCount: stockNum(order.stockMovementSkippedCount || 0),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  }

  const [productsSnap, recipesSnap, stockConfigSnap] = await Promise.all([
    tenantRef.collection("products").get(),
    tenantRef.collection("fichasTecnicas").get(),
    tenantRef.collection("config").doc("estoque").get()
  ]);
  const products = [];
  productsSnap.forEach((doc) => products.push({ id: doc.id, ...(doc.data() || {}) }));
  const recipes = [];
  recipesSnap.forEach((doc) => recipes.push({ id: doc.id, ...(doc.data() || {}) }));
  const regularizationMode = stockRegularizationMode(stockConfigSnap.exists ? stockConfigSnap.data() || {} : {});

  const items = Array.isArray(order.items) ? order.items : [];
  const batch = db.batch();
  const skipped = [];
  const balances = stockBalancesByKey([]);
  const allMovementsSnap = await tenantRef.collection("stock_movements").get();
  allMovementsSnap.forEach((doc) => {
    const entry = stockMovementBalanceEntry(doc.data() || {});
    if (!entry || !entry.key) return;
    balances[entry.key] = stockRoundQty(stockNum(balances[entry.key]) + entry.direction * entry.quantity);
  });
  const regularizationItems = [];
  let count = 0;
  const nowIso = new Date().toISOString();
  const movementDate = stockDateText(order.deliveryDate, order.pickupDate, order.scheduleDate, order.createdAt, nowIso);

  items.forEach((item, idx) => {
    const product = stockFindProductForOrderItem(item, products) || {};
    const refs = stockOrderItemRefs(item, product, products, recipes);
    if (!refs.length) {
      skipped.push(stockFirstText(item && item.name, item && item.productName, product.name, product.title, "Item sem nome"));
      return;
    }
    refs.forEach((ref, refIdx) => {
      const quantity = stockNum(ref.quantity);
      if (quantity <= 0) return;
      const movementId = `${stockSafeId(orderId)}_${idx}_${refIdx}_saida_venda`;
      const isBase = ref.stockItemType === "base_producao";
      const stockKey = stockRefBalanceKey(ref);
      const balanceBefore = stockRoundQty(stockNum(balances[stockKey]));
      const balanceAfter = stockRoundQty(balanceBefore - quantity);
      const shortage = balanceAfter < 0 ? stockRoundQty(Math.abs(balanceAfter)) : 0;
      balances[stockKey] = balanceAfter;
      const regularizationMovementId = shortage > 0 ? stockRegularizationMovementId(orderId, idx, refIdx, ref) : "";
      let regularizationItem = null;
      if (shortage > 0 && regularizationMode !== "desligado") {
        regularizationItem = stockRegularizationPendingItem(ref, item, product, {
          stockKey,
          balanceBefore,
          balanceAfter,
          shortage,
          movementId
        });
        if (regularizationMode === "automatico") {
          regularizationItem.status = "aplicada";
          regularizationItem.appliedAt = nowIso;
          regularizationItem.regularizationMovementId = regularizationMovementId;
          regularizationItem.regularizationAppliedQuantity = shortage;
        }
        regularizationItems.push(regularizationItem);
      }
      batch.set(tenantRef.collection("stock_movements").doc(movementId), {
        id: movementId,
        type: isBase ? "saida_base_venda" : "saida_venda",
        movementGroup: "order",
        orderId,
        orderNumber: stockOrderLabel(order, orderId),
        orderStatus: order.status || "Confirmado",
        productId: ref.productId || "",
        productName: ref.productName || "Produto",
        fichaTecnicaId: ref.fichaId || "",
        fichaTecnicaNome: ref.fichaNome || "",
        baseProductionId: ref.baseProductionId || "",
        baseProductionName: ref.baseProductionName || "",
        componentName: ref.componentName || "",
        sourceItemId: ref.readyItemId || "",
        produtoProntoId: ref.readyItemId || "",
        stockItemId: ref.baseProductionId || ref.fichaId || ref.readyItemId || ref.productId || "",
        stockItemType: ref.stockItemType || (ref.fichaId ? "produto_produzido" : "produto_pronto"),
        itemClass: ref.stockItemType || (ref.fichaId ? "produto_produzido" : "produto_pronto"),
        classe: ref.stockItemType || (ref.fichaId ? "produto_produzido" : "produto_pronto"),
        quantity,
        unit: ref.unit || "unidades",
        unitCost: stockNum(ref.unitCost),
        totalCost: stockNum(ref.unitCost) > 0 ? quantity * stockNum(ref.unitCost) : 0,
        parentOrderItemId: stockFirstText(item && item.productId, item && item.id, product.id, ""),
        parentOrderItemName: stockFirstText(item && item.name, item && item.productName, product.name, product.title, ""),
        stockSource: ref.source || "item",
        stockBalanceKey: stockKey,
        balanceBefore,
        balanceAfter,
        regularizationPending: shortage > 0 && regularizationMode === "pendencia",
        regularizationShortage: shortage,
        regularizationStatus: shortage > 0 && regularizationMode !== "desligado" ? (regularizationMode === "automatico" ? "aplicada" : "pendente") : "",
        regularizationOrigin: shortage > 0 ? "saldo_negativo_venda" : "",
        regularizationMovementId: shortage > 0 && regularizationMode === "automatico" ? regularizationMovementId : "",
        movementDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      if (regularizationItem && regularizationMode === "automatico") {
        batch.set(tenantRef.collection("stock_movements").doc(regularizationMovementId), stockRegularizationMovementPayload(regularizationItem, order, regularizationMovementId), { merge: true });
      }
      count += 1;
    });
  });

  const patch = {
    stockMovementSkippedCount: skipped.length,
    updatedAt: serverTimestamp()
  };
  if (count > 0) {
    patch.stockMovementCreated = true;
    patch.stockMovementCreatedAt = serverTimestamp();
    patch.stockMovementUpdatedAt = serverTimestamp();
    patch.stockMovementCount = count;
  }
  if (regularizationItems.length) {
    const pendingRegularizations = regularizationItems.filter((item) => String((item && item.status) || "pendente") === "pendente").length;
    patch.stockRegularizationPending = pendingRegularizations > 0;
    patch.stockRegularizationStatus = pendingRegularizations > 0 ? "pendente" : "aplicada";
    patch.stockRegularizationOrigin = "saldo_negativo_venda";
    patch.stockRegularizationDetectedAt = serverTimestamp();
    patch.stockRegularizationPendingCount = pendingRegularizations;
    patch.stockRegularizationPendingItems = regularizationItems.slice(0, 50);
    patch.stockRegularizationWarning = pendingRegularizations > 0
      ? "Pedido gerou saída com saldo insuficiente. Revise a regularização em Estoque."
      : "Pedido gerou saída com saldo insuficiente e recebeu entrada automática de regularização.";
    if (!pendingRegularizations) patch.stockRegularizationAppliedAt = serverTimestamp();
  } else {
    patch.stockRegularizationPending = false;
    patch.stockRegularizationStatus = "";
    patch.stockRegularizationPendingCount = 0;
    patch.stockRegularizationPendingItems = [];
    patch.stockRegularizationWarning = "";
  }
  if (skipped.length) {
    patch.stockMovementSkippedItems = skipped.slice(0, 12);
    patch.stockMovementWarning = "Itens sem vínculo com ficha técnica, base de produção ou produto pronto.";
  } else {
    patch.stockMovementSkippedItems = [];
    patch.stockMovementWarning = "";
  }

  if (count > 0) await batch.commit();
  await orderRef.set(patch, { merge: true });
  return count > 0;
}

async function requireTenantAdminAccess(req, tenantId) {
  const decoded = await requireAuthenticatedAdmin(req);
  const cleanTenantId = String(tenantId || "").trim();
  if (!cleanTenantId) throw new Error("tenant_required");
  if (decoded.uid === cleanTenantId) return decoded;
  const snap = await db.collection("system_tenants").doc(cleanTenantId).get();
  const data = snap.exists ? snap.data() || {} : {};
  const decodedEmail = normalizeEmail(decoded.email || "");
  const tenantEmail = normalizeEmail(data.email || data.ownerEmail || data.adminEmail || "");
  const authUid = String(data.authUid || data.uid || "").trim();
  if ((decodedEmail && tenantEmail && decodedEmail === tenantEmail) || (authUid && authUid === decoded.uid)) return decoded;
  throw new Error("forbidden");
}

function stripeSignaturePayload(signature) {
  const parts = String(signature || "").split(",");
  const out = {};
  parts.forEach((part) => {
    const idx = part.indexOf("=");
    if (idx < 0) return;
    const key = part.slice(0, idx);
    const value = part.slice(idx + 1);
    if (!out[key]) out[key] = [];
    out[key].push(value);
  });
  return out;
}

function verifyStripeWebhook(rawBody, signature, secret) {
  if (!secret) throw new Error("stripe_webhook_secret_missing");
  const parsed = stripeSignaturePayload(signature);
  const timestamp = parsed.t && parsed.t[0];
  const signatures = parsed.v1 || [];
  if (!timestamp || !signatures.length) throw new Error("stripe_signature_missing");
  const payload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const valid = signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
    } catch (error) {
      return false;
    }
  });
  if (!valid) throw new Error("stripe_signature_invalid");
}

function backupTimestampPath(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function normalizeBackupBucket(value) {
  const raw = String(value || "").trim();
  if (!raw) return FIRESTORE_BACKUP_DEFAULT_BUCKET;
  return raw.startsWith("gs://") ? raw.replace(/\/+$/, "") : `gs://${raw.replace(/^\/+|\/+$/g, "")}`;
}

async function googleAccessToken() {
  const response = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", {
    headers: { "Metadata-Flavor": "Google" }
  });
  if (!response.ok) throw new Error(`metadata_token_${response.status}`);
  const data = await response.json();
  if (!data.access_token) throw new Error("metadata_token_missing");
  return data.access_token;
}

function firestoreBackupPublicLog(doc) {
  const data = doc && doc.data ? doc.data() || {} : doc || {};
  return {
    id: doc && doc.id ? doc.id : String(data.id || ""),
    status: String(data.status || ""),
    source: String(data.source || ""),
    bucket: String(data.bucket || ""),
    outputUriPrefix: String(data.outputUriPrefix || ""),
    operationName: String(data.operationName || ""),
    error: String(data.error || "").slice(0, 240),
    startedAt: data.startedAt && data.startedAt.toDate ? data.startedAt.toDate().toISOString() : String(data.startedAt || ""),
    finishedAt: data.finishedAt && data.finishedAt.toDate ? data.finishedAt.toDate().toISOString() : String(data.finishedAt || ""),
    createdBy: String(data.createdBy || "")
  };
}

async function loadFirestoreBackupSettings() {
  const ref = db.collection("system_backup_settings").doc("firestore");
  const snap = await ref.get();
  const data = snap.exists ? snap.data() || {} : {};
  return {
    enabled: data.enabled !== false,
    bucket: normalizeBackupBucket(data.bucket || FIRESTORE_BACKUP_DEFAULT_BUCKET),
    retentionDays: Number(data.retentionDays || 30),
    schedule: String(data.schedule || "daily_0300_europe_madrid"),
    updatedAt: data.updatedAt || ""
  };
}

async function saveFirestoreBackupSettings({ bucket, enabled, retentionDays, updatedBy }) {
  const payload = {
    enabled: enabled !== false,
    bucket: normalizeBackupBucket(bucket),
    retentionDays: Math.max(1, Math.min(365, Number(retentionDays || 30))),
    schedule: "daily_0300_europe_madrid",
    updatedBy: String(updatedBy || ""),
    updatedAt: serverTimestamp()
  };
  await db.collection("system_backup_settings").doc("firestore").set(payload, { merge: true });
  return payload;
}

async function runFirestoreExport({ source = "manual", requestedBy = "" } = {}) {
  const settings = await loadFirestoreBackupSettings();
  if (source === "schedule" && settings.enabled === false) {
    const skippedRef = await db.collection("system_firestore_backups").add({
      status: "skipped",
      source,
      bucket: settings.bucket,
      outputUriPrefix: "",
      error: "backup_disabled",
      createdBy: requestedBy,
      startedAt: serverTimestamp(),
      finishedAt: serverTimestamp()
    });
    return { ok: true, skipped: true, backup: firestoreBackupPublicLog({ id: skippedRef.id, data: () => ({ status: "skipped", source, bucket: settings.bucket, error: "backup_disabled" }) }) };
  }
  const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "bocado-brasil";
  const outputUriPrefix = `${settings.bucket.replace(/\/+$/, "")}/firestore/${backupTimestampPath()}`;
  const logRef = db.collection("system_firestore_backups").doc();
  await logRef.set({
    status: "running",
    source,
    bucket: settings.bucket,
    outputUriPrefix,
    createdBy: requestedBy,
    startedAt: serverTimestamp(),
    error: ""
  }, { merge: true });
  try {
    const token = await googleAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default):exportDocuments`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ outputUriPrefix })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data && data.error && data.error.message ? data.error.message : `firestore_export_${response.status}`;
      throw new Error(message);
    }
    await logRef.set({
      status: "started",
      operationName: String(data.name || ""),
      finishedAt: serverTimestamp()
    }, { merge: true });
    const snap = await logRef.get();
    return { ok: true, backup: firestoreBackupPublicLog(snap) };
  } catch (error) {
    await logRef.set({
      status: "error",
      error: String(error && error.message ? error.message : "export_failed").slice(0, 240),
      finishedAt: serverTimestamp()
    }, { merge: true });
    const snap = await logRef.get();
    return { ok: false, error: String(error && error.message ? error.message : "export_failed").slice(0, 240), backup: firestoreBackupPublicLog(snap) };
  }
}

function safeEmailLog(data) {
  data = data || {};
  return {
    to: normalizeEmail(data.to || ""),
    templateKey: String(data.templateKey || ""),
    subject: String(data.subject || "").slice(0, 160),
    status: String(data.status || ""),
    source: String(data.source || data.origin || ""),
    eventId: String(data.eventId || "").slice(0, 120),
    tenantUid: String(data.tenantUid || ""),
    triggerKey: String(data.triggerKey || ""),
    tagKey: String(data.tagKey || ""),
    error: String(data.error || "").slice(0, 240),
    createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : String(data.createdAt || "")
  };
}

function safeEmailTemplate(key, data, triggersByTemplate) {
  data = data || {};
  const relatedTriggers = triggersByTemplate[key] || [];
  return {
    key,
    name: String(data.name || key),
    description: String(data.description || "").slice(0, 240),
    enabled: data.enabled !== false,
    subject: String(data.subject || "").slice(0, 180),
    triggerCount: relatedTriggers.length,
    activeTriggerCount: relatedTriggers.filter((trigger) => trigger.enabled !== false).length
  };
}

exports.masterEmailDiagnostics = onRequest({ region: REGION }, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    await requireMaster(req);
    await ensureEmailDefaults();
    await ensureEmailTriggerDefaults();

    const body = req.body || {};
    const lookupEmail = normalizeEmail(body.email || "");
    const [
      settingsSnap,
      secretSnap,
      templatesSnap,
      triggersSnap,
      logsSnap
    ] = await Promise.all([
      db.collection("system_email_settings").doc("default").get(),
      db.collection("system_private_email_secrets").doc("default").get(),
      db.collection("system_email_templates").get(),
      db.collection("system_email_triggers").get(),
      db.collection("email_logs").orderBy("createdAt", "desc").limit(40).get()
    ]);

    const settings = settingsSnap.exists ? (settingsSnap.data() || {}) : {};
    const secret = secretSnap.exists ? (secretSnap.data() || {}) : {};
    const triggersByTemplate = {};
    const triggers = [];
    triggersSnap.forEach((doc) => {
      const data = doc.data() || {};
      const item = {
        triggerKey: data.triggerKey || doc.id,
        tagKey: String(data.tagKey || ""),
        templateKey: String(data.templateKey || ""),
        name: String(data.name || doc.id),
        enabled: data.enabled !== false,
        delayHours: Number(data.delayHours || 0),
        dedupeWindowDays: Number(data.dedupeWindowDays || 0)
      };
      triggers.push(item);
      if (!triggersByTemplate[item.templateKey]) triggersByTemplate[item.templateKey] = [];
      triggersByTemplate[item.templateKey].push(item);
    });

    const templates = [];
    templatesSnap.forEach((doc) => templates.push(safeEmailTemplate(doc.id, doc.data(), triggersByTemplate)));
    templates.sort((a, b) => a.key.localeCompare(b.key));

    const logs = [];
    logsSnap.forEach((doc) => logs.push({ id: doc.id, ...safeEmailLog(doc.data()) }));

    let lookup = null;
    if (lookupEmail) {
      lookup = { email: lookupEmail, authUserExists: false, tenantExists: false, tenantUid: "" };
      try {
        const user = await admin.auth().getUserByEmail(lookupEmail);
        lookup.authUserExists = true;
        lookup.uid = user.uid || "";
      } catch (error) {
        lookup.authUserExists = false;
      }
      const tenant = await findTenantByEmail(lookupEmail);
      if (tenant) {
        lookup.tenantExists = true;
        lookup.tenantUid = tenant.id;
      }
    }

    return res.json({
      ok: true,
      settings: {
        found: settingsSnap.exists,
        enabled: settings.enabled === true,
        provider: settings.provider || "smtp",
        fromName: settings.fromName || "",
        fromEmail: settings.fromEmail || "",
        replyTo: settings.replyTo || "",
        supportEmail: settings.supportEmail || "",
        appBaseUrl: settings.appBaseUrl || "",
        brandName: settings.brandName || "",
        smtpHostConfigured: !!settings.smtpHost,
        smtpPort: Number(settings.smtpPort || 0),
        smtpSecure: settings.smtpSecure || "",
        smtpSecureCalculated: settingsTransport.secure,
        smtpRequireTLSCalculated: settingsTransport.requireTLS,
        smtpUserConfigured: !!settings.smtpUser,
        smtpPasswordConfigured: !!secret.smtpPassword || settings.smtpPasswordConfigured === true
      },
      templates,
      triggers,
      logs,
      lookup
    });
  } catch (error) {
    const status = error.message === "forbidden" ? 403 : 401;
    return res.status(status).json({ error: error.message || "unauthorized" });
  }
});

exports.masterStripeDiagnostics = onRequest({ region: REGION }, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    await requireMaster(req);
    const [settingsSnap, secretSnap] = await Promise.all([
      db.collection("system_stripe_settings").doc("default").get(),
      db.collection("system_private_stripe_secrets").doc("default").get()
    ]);
    const settings = settingsSnap.exists ? (settingsSnap.data() || {}) : {};
    const config = await loadStripePlatformConfig();
    return res.json({
      ok: true,
      stripe: {
        ...safeStripeSettings(settingsSnap, secretSnap),
        publishableKey: settings.publishableKey || "",
        currency: normalizeCurrency(settings.currency || "EUR").toUpperCase(),
        platform: await stripePlatformDiagnostics(config)
      }
    });
  } catch (error) {
    const status = error.message === "forbidden" ? 403 : 401;
    return res.status(status).json({ error: error.message || "unauthorized" });
  }
});

exports.saveStripeSettings = onRequest({ region: REGION }, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const master = await requireMaster(req);
    const body = req.body || {};
    const publishableKey = String(body.publishableKey || "").trim();
    const secretKey = String(body.secretKey || "").trim();
    const webhookSecret = String(body.webhookSecret || "").trim();
    const currency = normalizeCurrency(body.currency || "EUR");
    if (body.enabled === true && !publishableKey) return res.status(400).json({ error: "stripe_publishable_key_required" });
    if (publishableKey && !/^pk_(test|live)_/.test(publishableKey)) return res.status(400).json({ error: "stripe_publishable_key_invalid" });
    if (secretKey && !/^sk_(test|live)_/.test(secretKey)) return res.status(400).json({ error: "stripe_secret_key_invalid" });
    if (webhookSecret && !/^whsec_/.test(webhookSecret)) return res.status(400).json({ error: "stripe_webhook_secret_invalid" });
    const currentSecretSnap = await db.collection("system_private_stripe_secrets").doc("default").get();
    const currentSecret = currentSecretSnap.exists ? currentSecretSnap.data() || {} : {};
    const settings = {
      enabled: body.enabled === true,
      connectEnabled: true,
      publishableKey,
      currency,
      mode: publishableKey.startsWith("pk_live_") ? "live" : "test",
      secretKeyConfigured: !!secretKey || !!currentSecret.secretKey,
      webhookSecretConfigured: !!webhookSecret || !!currentSecret.webhookSecret,
      updatedBy: master.email || "",
      updatedAt: serverTimestamp()
    };
    await Promise.all([
      db.collection("system_stripe_settings").doc("default").set(settings, { merge: true }),
      db.collection("system").doc("config").set({
        stripeEnabled: settings.enabled,
        stripeConnectEnabled: true,
        stripePublishableKey: publishableKey,
        stripeCurrency: currency.toUpperCase(),
        stripeMode: settings.mode,
        updatedAt: serverTimestamp()
      }, { merge: true })
    ]);
    const secretPatch = { updatedAt: serverTimestamp(), updatedBy: master.email || "" };
    if (secretKey) secretPatch.secretKey = secretKey;
    if (webhookSecret) secretPatch.webhookSecret = webhookSecret;
    if (secretKey || webhookSecret) {
      await db.collection("system_private_stripe_secrets").doc("default").set(secretPatch, { merge: true });
    }
    const safe = safeStripeSettings({ exists: true, data: () => settings }, { exists: true, data: () => Object.assign({}, currentSecret, secretPatch) });
    return res.json({
      ok: true,
      stripe: {
        ...safe,
        publishableKey,
        platform: await stripePlatformDiagnostics({
          enabled: settings.enabled,
          connectEnabled: true,
          publishableKey,
          secretKey: String(secretPatch.secretKey || currentSecret.secretKey || "").trim(),
          webhookSecret: String(secretPatch.webhookSecret || currentSecret.webhookSecret || "").trim(),
          currency
        })
      }
    });
  } catch (error) {
    const status = error.message === "forbidden" ? 403 : error.message && error.message.indexOf("_invalid") >= 0 ? 400 : 401;
    return res.status(status).json({ error: error.message || "unauthorized" });
  }
});

exports.saveMasterSystemConfig = onRequest({ region: REGION }, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const master = await requireMaster(req);
    const patch = sanitizeMasterSystemConfigPatch(req.body || {});
    await db.collection("system").doc("config").set({
      ...patch,
      updatedAt: serverTimestamp(),
      updatedBy: master.email || ""
    }, { merge: true });
    return res.json({ ok: true, patch });
  } catch (error) {
    const status = error.message === "forbidden" ? 403 : error.message === "empty_system_config_patch" ? 400 : 401;
    return res.status(status).json({ error: error.message || "unauthorized" });
  }
});

exports.createStripeConnectOnboarding = onRequest({ region: REGION, timeoutSeconds: 45, memory: "256MiB" }, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
    const body = req.body || {};
    const tenantId = String(body.tenantId || "").trim();
    const decoded = await requireTenantAdminAccess(req, tenantId);
    const config = await loadStripePlatformConfig();
    if (!config.enabled || !config.secretKey) return res.status(503).json({ ok: false, error: "stripe_not_configured" });
    const [tenantSnap, integrationsSnap] = await Promise.all([
      db.collection("system_tenants").doc(tenantId).get(),
      db.collection("tenants").doc(tenantId).collection("config").doc("integracoes").get()
    ]);
    const tenant = tenantSnap.exists ? tenantSnap.data() || {} : {};
    const integrations = integrationsSnap.exists ? integrationsSnap.data() || {} : {};
    const existingAccountId = String(integrations.stripeConnectedAccountId || integrations.stripeAccountId || "").trim();
    const selectedFinanceAccountId = String(body.financeAccountId || body.stripeFinanceAccountId || integrations.stripeFinanceAccountId || integrations.stripeDefaultAccountId || "").trim();
    let accountId = existingAccountId;
    if (!/^acct_/.test(accountId)) {
      const account = await stripeRequest("accounts", {
        type: "express",
        country: stripeCountryFromTenant(tenant, integrations),
        email: decoded.email || tenant.email || "",
        "capabilities[card_payments][requested]": "true",
        "capabilities[transfers][requested]": "true",
        "business_profile[name]": (tenant.store && tenant.store.name) || tenant.businessName || tenant.name || "BocaFood"
      }, config);
      accountId = account.id || "";
    }
    if (!/^acct_/.test(accountId)) return res.status(500).json({ ok: false, error: "stripe_account_not_created" });
    const returnUrl = sanitizeStripeReturnUrl(body.returnUrl);
    const refreshUrl = sanitizeStripeReturnUrl(body.refreshUrl || body.returnUrl);
    const link = await stripeRequest("account_links", {
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding"
    }, config);
    const patch = {
      stripeEnabled: true,
      stripeConnectedAccountId: accountId,
      stripeAccountId: accountId,
      stripeFinanceAccountId: selectedFinanceAccountId,
      stripeDefaultAccountId: selectedFinanceAccountId,
      stripeConnectStatus: existingAccountId === accountId ? (integrations.stripeConnectStatus || "onboarding_required") : "onboarding_required",
      stripeConnectUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await Promise.all([
      ensureStripeFinancePaymentMethod(tenantId, selectedFinanceAccountId),
      db.collection("tenants").doc(tenantId).collection("config").doc("integracoes").set(patch, { merge: true }),
      db.collection("system_tenants").doc(tenantId).set({
        integrations: {
          stripeEnabled: true,
          stripeConnectedAccountId: accountId,
          stripeConnectStatus: patch.stripeConnectStatus
        },
        updatedAt: serverTimestamp()
      }, { merge: true })
    ]);
    return res.json({ ok: true, url: link.url || "", accountId, status: patch.stripeConnectStatus });
  } catch (error) {
    const message = error && error.message ? error.message : "stripe_connect_failed";
    const status = message === "forbidden" ? 403 : message === "missing_auth" ? 401 : 500;
    console.error("[Stripe] connect onboarding failed", { error: String(message).slice(0, 240) });
    return res.status(status).json({ ok: false, error: message });
  }
});

exports.getStripeConnectStatus = onRequest({ region: REGION, timeoutSeconds: 45, memory: "256MiB" }, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
    const body = req.body || {};
    const tenantId = String(body.tenantId || "").trim();
    await requireTenantAdminAccess(req, tenantId);
    const config = await loadStripePlatformConfig();
    if (!config.enabled || !config.secretKey) return res.status(503).json({ ok: false, error: "stripe_not_configured" });
    const integrationsRef = db.collection("tenants").doc(tenantId).collection("config").doc("integracoes");
    const integrationsSnap = await integrationsRef.get();
    const integrations = integrationsSnap.exists ? integrationsSnap.data() || {} : {};
    const accountId = String(integrations.stripeConnectedAccountId || integrations.stripeAccountId || "").trim();
    const selectedFinanceAccountId = String(body.financeAccountId || body.stripeFinanceAccountId || integrations.stripeFinanceAccountId || integrations.stripeDefaultAccountId || "").trim();
    if (!/^acct_/.test(accountId)) return res.status(404).json({ ok: false, error: "store_stripe_not_connected" });
    const account = await stripeGet(`accounts/${encodeURIComponent(accountId)}`, config);
    const status = safeStripeAccountStatus(account);
    const patch = {
      stripeEnabled: status.status === "ready" ? true : integrations.stripeEnabled === true,
      stripeConnectedAccountId: accountId,
      stripeAccountId: accountId,
      stripeFinanceAccountId: selectedFinanceAccountId,
      stripeDefaultAccountId: selectedFinanceAccountId,
      stripeConnectStatus: status.status,
      stripeChargesEnabled: status.chargesEnabled,
      stripePayoutsEnabled: status.payoutsEnabled,
      stripeDetailsSubmitted: status.detailsSubmitted,
      stripeDisabledReason: status.disabledReason,
      stripeRequirementsDue: status.currentlyDue,
      stripeConnectUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await Promise.all([
      ensureStripeFinancePaymentMethod(tenantId, selectedFinanceAccountId),
      integrationsRef.set(patch, { merge: true }),
      db.collection("system_tenants").doc(tenantId).set({
        integrations: {
          stripeEnabled: patch.stripeEnabled,
          stripeConnectedAccountId: accountId,
          stripeConnectStatus: status.status,
          stripeChargesEnabled: status.chargesEnabled,
          stripePayoutsEnabled: status.payoutsEnabled
        },
        updatedAt: serverTimestamp()
      }, { merge: true })
    ]);
    return res.json({ ok: true, stripe: status });
  } catch (error) {
    const message = error && error.message ? error.message : "stripe_status_failed";
    const status = message === "forbidden" ? 403 : message === "missing_auth" ? 401 : 500;
    console.error("[Stripe] connect status failed", { error: String(message).slice(0, 240) });
    return res.status(status).json({ ok: false, error: message });
  }
});

exports.createStorefrontStripePaymentIntent = onRequest({ region: REGION, timeoutSeconds: 45, memory: "256MiB" }, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const body = req.body || {};
    const tenantId = String(body.tenantId || "").trim();
    const orderId = String(body.orderId || "").trim();
    if (!tenantId || !orderId) return res.status(400).json({ ok: false, error: "tenant_order_required" });
    const config = await loadStripePlatformConfig();
    if (!config.enabled || !config.publishableKey || !config.secretKey) return res.status(503).json({ ok: false, error: "stripe_not_configured" });
    const [orderSnap, integrationsSnap] = await Promise.all([
      db.collection("tenants").doc(tenantId).collection("orders").doc(orderId).get(),
      db.collection("tenants").doc(tenantId).collection("config").doc("integracoes").get()
    ]);
    if (!orderSnap.exists) return res.status(404).json({ ok: false, error: "order_not_found" });
    const order = orderSnap.data() || {};
    const integrations = integrationsSnap.exists ? integrationsSnap.data() || {} : {};
    const stripeAccountId = String(integrations.stripeConnectedAccountId || integrations.stripeAccountId || "").trim();
    if (integrations.stripeEnabled === false || !stripeAccountId) return res.status(503).json({ ok: false, error: "store_stripe_not_connected" });
    if (!/^acct_/.test(stripeAccountId)) return res.status(400).json({ ok: false, error: "store_stripe_account_invalid" });
    if (integrations.stripeConnectStatus && integrations.stripeConnectStatus !== "ready") return res.status(503).json({ ok: false, error: "store_stripe_onboarding_pending" });
    const amount = moneyToStripeCents(order.total);
    if (amount <= 0) return res.status(400).json({ ok: false, error: "order_total_invalid" });
    const currency = normalizeCurrency(integrations.stripeCurrency || config.currency || "EUR");
    const paymentIntent = await stripeRequest("payment_intents", {
      amount,
      currency,
      "automatic_payment_methods[enabled]": "true",
      description: `BocaFood ${order.publicOrderCode || order.orderRef || orderId}`,
      "metadata[tenantId]": tenantId,
      "metadata[orderId]": orderId,
      "metadata[orderRef]": order.orderRef || "",
      "metadata[source]": "bocafood_storefront"
    }, config, stripeAccountId);
    const financeMethod = await ensureStripeFinancePaymentMethod(tenantId, integrations.stripeFinanceAccountId || integrations.stripeDefaultAccountId || "");
    await orderSnap.ref.set({
      paymentProvider: "stripe",
      paymentMethod: "Cartão",
      payment: "Cartão",
      paymentStatus: "pending",
      paymentState: "pending",
      financePaymentMethod: "Stripe",
      forma_pagamento: "Stripe",
      contaBancariaId: integrations.stripeFinanceAccountId || integrations.stripeDefaultAccountId || financeMethod.contaPadraoId || "",
      conta_id: integrations.stripeFinanceAccountId || integrations.stripeDefaultAccountId || financeMethod.contaPadraoId || "",
      stripePaymentIntentId: paymentIntent.id || "",
      stripeConnectedAccountId: stripeAccountId,
      stripeCurrency: currency,
      stripeAmount: amount,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return res.json({
      ok: true,
      publishableKey: config.publishableKey,
      connectedAccountId: stripeAccountId,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      currency: currency.toUpperCase()
    });
  } catch (error) {
    console.error("[Stripe] create payment intent failed", { error: String(error && error.message ? error.message : error).slice(0, 240) });
    return res.status(500).json({ ok: false, error: error.message || "stripe_payment_failed" });
  }
});

exports.stripeWebhook = onRequest({ region: REGION, timeoutSeconds: 45, memory: "256MiB" }, async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");
    const config = await loadStripePlatformConfig();
    const raw = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body || {});
    verifyStripeWebhook(raw, req.get("stripe-signature") || "", config.webhookSecret);
    const event = JSON.parse(raw);
    const object = event && event.data && event.data.object ? event.data.object : {};
    const metadata = object.metadata || {};
    const tenantId = String(metadata.tenantId || "").trim();
    const orderId = String(metadata.orderId || "").trim();
    if (!tenantId || !orderId) return res.json({ received: true, skipped: "missing_metadata" });
    const ref = db.collection("tenants").doc(tenantId).collection("orders").doc(orderId);
    if (event.type === "payment_intent.succeeded") {
      await ref.set({
        status: "Confirmado",
        kitchenStatus: "Pendente",
        paymentProvider: "stripe",
        financePaymentMethod: "Stripe",
        forma_pagamento: "Stripe",
        paymentStatus: "paid",
        paymentState: "paid",
        paid: true,
        paidAmount: Number(object.amount_received || object.amount || 0) / 100,
        amountPaid: Number(object.amount_received || object.amount || 0) / 100,
        valuePaid: Number(object.amount_received || object.amount || 0) / 100,
        stripePaymentIntentId: object.id || "",
        stripeLatestChargeId: object.latest_charge || "",
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      await syncStripeFinanceMovements(tenantId, orderId, object, config);
      await syncStripeOrderStockMovements(tenantId, orderId);
    } else if (event.type === "payment_intent.payment_failed" || event.type === "payment_intent.canceled") {
      await ref.set({
        paymentProvider: "stripe",
        paymentStatus: event.type === "payment_intent.canceled" ? "canceled" : "failed",
        paymentState: event.type === "payment_intent.canceled" ? "canceled" : "failed",
        paid: false,
        stripePaymentIntentId: object.id || "",
        stripeFailureMessage: object.last_payment_error && object.last_payment_error.message ? object.last_payment_error.message : "",
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
    return res.json({ received: true });
  } catch (error) {
    console.error("[Stripe] webhook failed", { error: String(error && error.message ? error.message : error).slice(0, 240) });
    return res.status(400).send(error.message || "stripe_webhook_failed");
  }
});

exports.seasonsAiRecommendation = onRequest({ region: REGION, timeoutSeconds: 60, memory: "256MiB" }, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const decoded = await requireAuthenticatedAdmin(req);
    const body = req.body || {};
    const context = body.context || {};
    if (!context || typeof context !== "object" || Array.isArray(context)) {
      return res.status(400).json({ ok: false, error: "context_required" });
    }
    const aiConfig = await loadOpenAIConfig();
    if (!aiConfig.apiKey) {
      return res.status(503).json({ ok: false, status: "not_configured", error: "openai_not_configured" });
    }

    const prompt = String(context.prompt || [
      "Você é um copiloto operacional para um pequeno negócio de comida.",
      "Use apenas os dados fornecidos no contexto.",
      "Não calcule score, meta, risco ou progresso; esses valores já vêm do BocaFood.",
      "Não invente números, clientes, campanhas ou métricas.",
      "Responda somente JSON válido com headline, helpingSignals, blockingSignals e nextAction."
    ].join("\n"));
    const safeContext = safeSeasonAIContext(context);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${aiConfig.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: aiConfig.model,
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: [
              "Analise o contexto agregado da temporada abaixo.",
              "A resposta deve ser prática, específica e curta.",
              "Se houver executionPlan.actions, priorize essas jogadas e melhore a clareza sem criar ação inexistente.",
              "Nunca peça para a usuária conferir dados que já estão no contexto; use os dados recebidos.",
              JSON.stringify(safeContext)
            ].join("\n\n")
          }
        ]
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data && data.error && data.error.message ? data.error.message : `openai_http_${response.status}`;
      throw new Error(message);
    }
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    const parsed = JSON.parse(String(content || "{}"));
    return res.json({
      ok: true,
      status: "generated",
      model: data.model || aiConfig.model,
      configSource: aiConfig.source,
      recommendation: validSeasonAIReading(parsed),
      tenantId: String(body.tenantId || ""),
      uid: decoded.uid || ""
    });
  } catch (error) {
    const status = error.message === "missing_auth" ? 401 : 500;
    console.error("[SeasonsAI] recommendation error", {
      error: String(error && error.message ? error.message : error).slice(0, 240)
    });
    return res.status(status).json({ ok: false, error: error.message || "ai_recommendation_failed" });
  }
});

function smtpSocketVerify(config) {
  return new Promise((resolve, reject) => {
    const transport = smtpTransportConfig(config);
    const { host, port, secure, requireTLS } = transport;
    if (!host || !port) return reject(new Error("smtp_host_port_required"));
    const timeout = setTimeout(() => reject(new Error("smtp_connection_timeout")), 9000);
    const done = (fn, socket, value) => {
      clearTimeout(timeout);
      try { socket.end(); } catch (e) {}
      fn(value);
    };
    const options = { host, port, servername: host, rejectUnauthorized: false };
    const socket = secure ? tls.connect(options) : net.connect({ host, port });
    socket.once(secure ? "secureConnect" : "connect", async () => {
      try {
        await smtpExpect(socket, "", [220]);
        await smtpExpect(socket, "EHLO bocafood.app", [250]);
        if (requireTLS) {
          const secureSocket = await smtpStartTls(socket, config);
          await smtpExpect(secureSocket, "EHLO bocafood.app", [250]);
          done(resolve, secureSocket, true);
          return;
        }
        done(resolve, socket, true);
      } catch (error) {
        done(reject, socket, error);
      }
    });
    socket.once("error", (error) => done(reject, socket, error));
  });
}

exports.saveEmailSettings = onRequest({ region: REGION }, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    await requireMaster(req);
    const body = req.body || {};
    const password = String(body.smtpPassword || "").trim();
    const data = {
      fromName: String(body.fromName || "").trim(),
      fromEmail: normalizeEmail(String(body.fromEmail || "").trim()),
      replyTo: normalizeEmail(body.replyTo),
      supportEmail: normalizeEmail(body.supportEmail || body.replyTo),
      appBaseUrl: String(body.appBaseUrl || "").trim(),
      brandName: String(body.brandName || "BocaFood").trim(),
      brandLogoUrl: normalizeBocaFoodBrandLogoUrl(body.brandLogoUrl),
      termsUrl: String(body.termsUrl || "").trim(),
      privacyUrl: String(body.privacyUrl || "").trim(),
      securityText: String(body.securityText || "o BocaFood nunca solicita senha por e-mail.").trim(),
      footerReasonDefault: String(body.footerReasonDefault || "esta mensagem faz parte do seu relacionamento com o BocaFood").trim(),
      smtpHost: String(body.smtpHost || "").trim(),
      smtpPort: Number(body.smtpPort || 587),
      smtpSecure: ["tls", "ssl", "none"].includes(String(body.smtpSecure || "").toLowerCase()) ? String(body.smtpSecure).toLowerCase() : "tls",
      smtpUser: String(body.smtpUser || "").trim(),
      smtpPasswordConfigured: body.smtpPasswordConfigured === true || !!password,
      enabled: body.enabled === true,
      provider: "smtp",
      updatedAt: serverTimestamp()
    };
    await db.collection("system_email_settings").doc("default").set(data, { merge: true });
    if (password) {
      await db.collection("system_private_email_secrets").doc("default").set({
        smtpPassword: password,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
    return res.json({ ok: true, settings: data });
  } catch (error) {
    const status = error.message === "forbidden" ? 403 : 401;
    return res.status(status).json({ error: error.message || "unauthorized" });
  }
});

exports.testSmtpConnection = onRequest({ region: REGION }, async (req, res) => {
  let authed = false;
  try {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    await requireMaster(req);
    authed = true;
    const settingsSnap = await db.collection("system_email_settings").doc("default").get();
    const settings = settingsSnap.exists ? settingsSnap.data() : {};
    const transport = smtpTransportConfig(settings);
    console.info("[SMTP] connection test config", {
      host: transport.host,
      port: transport.port,
      secure: transport.secure,
      requireTLS: transport.requireTLS,
      user: maskSmtpUser(settings.smtpUser),
      fromEmail: normalizeEmail(settings.fromEmail)
    });
    await smtpSocketVerify(settings);
    await db.collection("email_logs").add({
      to: normalizeEmail(req.body && req.body.to),
      templateKey: "smtp_connection",
      subject: "Teste de conexão SMTP",
      status: "ok",
      origin: "teste",
      createdAt: serverTimestamp()
    });
    return res.json({ ok: true });
  } catch (error) {
    if (authed) {
      await db.collection("email_logs").add({
        templateKey: "smtp_connection",
        subject: "Teste de conexão SMTP",
        status: "error",
        origin: "teste",
        error: error.message || "smtp_error",
        createdAt: serverTimestamp()
      });
    }
    return res.status(400).json({ error: error.message || "smtp_error" });
  }
});

exports.sendTestEmail = onRequest({ region: REGION }, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    await requireMaster(req);
    const body = req.body || {};
    const to = normalizeEmail(body.to);
    const templateKey = String(body.templateKey || "test_email").trim();
    if (!to) return res.status(400).json({ error: "to_required" });
    const result = await sendEmailFromTemplateViaSmtp({
      to,
      templateKey,
      source: "teste",
      eventId: `manual_test_${templateKey}_${Date.now()}`,
      variables: {
        buyerName: "Patrícia",
        buyerEmail: to,
        signupUrl: "https://bocafood.app/cadastro",
        supportEmail: DEFAULT_SUPPORT_EMAIL,
        planName: "Plano Essencial",
        productName: "BocaFood",
        resetPasswordUrl: "https://bocafood.app/redefinir-senha",
        appBaseUrl: "https://bocafood.app",
        brandName: "BocaFood",
        brandLogoUrl: BOCAFOOD_BRAND_LOGO_URL,
        ...(body.variables || {})
      }
    });
    if (!result.ok) {
      return res.status(400).json({
        ok: false,
        error: result.reason || result.error || "send_test_error"
      });
    }
    return res.json({
      ok: true,
      subject: result.subject || "",
      skipped: result.skipped === true,
      reason: result.reason || ""
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || "send_test_error" });
  }
});

exports.firestoreBackupAdmin = onRequest({ region: REGION, serviceAccount: FIREBASE_ADMIN_SERVICE_ACCOUNT, timeoutSeconds: 540, memory: "512MiB" }, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const master = await requireMaster(req);
    const body = req.body || {};
    const action = String(body.action || "status");
    if (action === "save_config") {
      await saveFirestoreBackupSettings({
        bucket: body.bucket,
        enabled: body.enabled !== false,
        retentionDays: body.retentionDays,
        updatedBy: master.email || ""
      });
      const settings = await loadFirestoreBackupSettings();
      return res.json({ ok: true, settings });
    }
    if (action === "run_now") {
      const result = await runFirestoreExport({ source: "manual", requestedBy: master.email || "" });
      return res.status(result.ok ? 200 : 500).json(result);
    }
    const [settings, logsSnap] = await Promise.all([
      loadFirestoreBackupSettings(),
      db.collection("system_firestore_backups").orderBy("startedAt", "desc").limit(20).get()
    ]);
    const logs = [];
    logsSnap.forEach((doc) => logs.push(firestoreBackupPublicLog(doc)));
    return res.json({ ok: true, settings, logs });
  } catch (error) {
    return res.status(400).json({ ok: false, error: String(error && error.message ? error.message : "backup_admin_failed").slice(0, 240) });
  }
});

function hotmartEmailTemplateForStatus({ status, linkedCount }) {
  if (status === "active") return linkedCount ? "subscription_active" : "welcome_hotmart";
  if (status === "pending_payment" || status === "past_due") return "payment_pending";
  if (hotmartBlocksAccess(status)) return "access_blocked";
  return "";
}

function hotmartEmailVariables({ buyer, settings, status, eventAt = "" }) {
  const appBaseUrl = settings.appBaseUrl || "https://bocafood.app";
  return {
    ...buyer,
    buyerName: buyer.buyerName || "Cliente",
    buyerEmail: buyer.buyerEmail || "",
    signupUrl: `${appBaseUrl.replace(/\/$/, "")}/cadastro`,
    supportEmail: settings.supportEmail || settings.replyTo || DEFAULT_SUPPORT_EMAIL,
    appBaseUrl,
    brandName: settings.brandName || settings.fromName || "BocaFood",
    brandLogoUrl: normalizeBocaFoodBrandLogoUrl(settings.brandLogoUrl),
    billingStatus: status || "",
    billingCycle: buyer.billingCycle || "",
    blockedReason: hotmartBlockedReason(status),
    canceledAt: hotmartBlocksAccess(status) ? eventAt : "",
    trialEndsAt: buyer.trialEndsAt || "",
    hotmartTransaction: buyer.hotmartTransaction || "",
    hotmartOfferCode: buyer.hotmartOfferCode || ""
  };
}

function readHotmartHottok() {
  let secretValue = "";
  try {
    secretValue = String(HOTMART_HOTTOK_SECRET.value() || "").trim();
  } catch (error) {
    secretValue = "";
  }
  const envValue = String(process.env.HOTMART_HOTTOK || "").trim();
  return secretValue || envValue;
}

function hotmartHottokLooksMisconfigured(value) {
  const token = String(value || "");
  if (!token) return false;
  if (token.length > 240) return true;
  if (/[\r\n]/.test(token)) return true;
  return /printf|pbpaste|functions\/\.env|HOTMART_HOTTOK=|firebase\s+deploy|firebase\s+functions/i.test(token);
}

function cleanSignupText(value, max = 180) {
  return String(value || "").trim().slice(0, max);
}

function cleanCountryCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return ["ES", "PT", "BR", "FR", "IT", "DE", "GB", "US", "OTHER"].includes(code) ? code : "";
}

function cleanLanguageCode(value) {
  const code = String(value || "").trim();
  return ["pt-BR", "pt-PT", "es-ES", "en", "fr"].includes(code) ? code : "pt-BR";
}

function cleanSignupList(value, maxItems = 10) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map((item) => cleanSignupText(item, 120)).filter(Boolean);
}

function cleanCommunicationPreferences(value) {
  const prefs = value && typeof value === "object" ? value : {};
  return {
    commercialCampaigns: prefs.commercialCampaigns === true,
    growthTips: prefs.growthTips === true,
    upgradeOffers: prefs.upgradeOffers === true
  };
}

function pendingHotmartIsActive(data) {
  const status = String(data.status || "").toLowerCase();
  const internalStatus = String(data.internalStatus || data.billingStatus || "").toLowerCase();
  const purchaseStatus = String(data.purchaseStatus || "").toLowerCase();
  const subscriptionStatus = String(data.subscriptionStatus || "").toLowerCase();
  return internalStatus === "active" ||
    purchaseStatus === "approved" ||
    subscriptionStatus === "active" ||
    (status === "pending" && internalStatus !== "pending_payment");
}

async function findActivePendingHotmartByEmail(email) {
  const snap = await db.collection("pending_hotmart_access").where("buyerEmail", "==", email).limit(10).get();
  const items = [];
  snap.forEach((doc) => {
    const data = doc.data() || {};
    if (pendingHotmartIsActive(data)) items.push({ id: doc.id, data });
  });
  items.sort((a, b) => String(b.data.updatedAt || b.data.createdAt || "").localeCompare(String(a.data.updatedAt || a.data.createdAt || "")));
  return items[0] || null;
}

function signupBillingFromPending(pending) {
  if (!pending) return {};
  const data = pending.data || {};
  const billing = {
    provider: "hotmart",
    status: "active",
    planSlug: data.planSlug || "",
    billingCycle: data.billingCycle || "",
    activatedAt: data.activatedAt || data.createdAt || nowIso(),
    hotmartSubscriberCode: data.hotmartSubscriberCode || "",
    hotmartTransaction: data.hotmartTransaction || "",
    hotmartProductId: data.hotmartProductId || "",
    hotmartOfferCode: data.hotmartOfferCode || data.offerCode || "",
    purchaseStatus: data.purchaseStatus || "",
    subscriptionStatus: data.subscriptionStatus || "active",
    lastHotmartEventAt: data.lastHotmartEventAt || data.updatedAt || ""
  };
  if (data.trialEndsAt) billing.trialEndsAt = data.trialEndsAt;
  return billing;
}

async function recordSignupLog({ tenantUid, email, action, summary, metadata = {}, severity = "info" }) {
  const safe = {};
  Object.keys(metadata || {}).slice(0, 12).forEach((key) => {
    if (/password|senha|token|secret|credential|authorization|payload|html|image|customer|cliente/i.test(key)) return;
    const value = metadata[key];
    const text = typeof value === "object" ? JSON.stringify(value) : String(value == null ? "" : value);
    safe[key] = text.length > 180 ? text.slice(0, 180) : text;
  });
  await db.collection("system_access_logs").doc().set({
    tenantUid,
    uid: tenantUid,
    email,
    action,
    module: "signup",
    entityType: "tenant",
    entityId: tenantUid,
    summary,
    message: summary,
    source: "signup",
    severity,
    metadata: safe,
    details: safe,
    createdAt: nowIso()
  });
}

exports.completeSignupOnboarding = onCall({ region: REGION }, async (request) => {
  const auth = request.auth;
  if (!auth || !auth.uid) {
    throw new HttpsError("unauthenticated", "É preciso estar autenticada para concluir o cadastro.");
  }

  const data = request.data || {};
  const uid = auth.uid;
  const authEmail = normalizeEmail(auth.token && auth.token.email);
  const submittedEmail = normalizeEmail(data.email);
  if (!authEmail || (submittedEmail && submittedEmail !== authEmail)) {
    throw new HttpsError("permission-denied", "Use o mesmo e-mail autenticado para concluir o cadastro.");
  }

  const stage = cleanSignupText(data.stage || "completed", 40);
  const pending = await findActivePendingHotmartByEmail(authEmail);
  const now = nowIso();
  const tenantRef = db.collection("system_tenants").doc(uid);

  if (stage === "legal_acceptance") {
    const acceptedTerms = data.acceptedTerms === true;
    const acceptedPrivacy = data.acceptedPrivacy === true;
    if (!acceptedTerms || !acceptedPrivacy) {
      throw new HttpsError("invalid-argument", "Aceite os Termos de uso e a Política de privacidade para continuar.");
    }
    const tenantSnap = await tenantRef.get();
    const tenantData = tenantSnap.exists ? (tenantSnap.data() || {}) : {};
    const billing = tenantData.billing || {};
    const activeAccount = tenantData.accountStatus === "active" || tenantData.status === "active" || billing.status === "active";
    if (!activeAccount) {
      throw new HttpsError("failed-precondition", "Assinatura de termos disponível apenas para contas com acesso liberado.");
    }
    const termsUrl = cleanSignupText(data.termsUrl || "https://bocafood.app/termosdeuso", 240);
    const privacyUrl = cleanSignupText(data.privacyUrl || "https://bocafood.app/politicadeprivacidade", 240);
    const acceptance = {
      termsAccepted: true,
      privacyAccepted: true,
      termsUrl,
      privacyUrl,
      acceptedAt: now,
      acceptedByUid: uid,
      acceptedByEmail: authEmail,
      source: "signup_onboarding"
    };
    const communicationPreferences = {
      ...cleanCommunicationPreferences(data.communicationPreferences),
      source: "signup_onboarding",
      updatedAt: now
    };
    await tenantRef.set({
      legalAcceptance: acceptance,
      communicationPreferences,
      updatedAt: serverTimestamp()
    }, { merge: true });
    await db.collection("system_legal_acceptances").doc(`${uid}_${Date.now()}`).set({
      tenantUid: uid,
      email: authEmail,
      ...acceptance,
      createdAt: serverTimestamp()
    }, { merge: true });
    await recordSignupLog({
      tenantUid: uid,
      email: authEmail,
      action: "signup_legal_terms_accepted",
      summary: "Termos de uso e política de privacidade aceitos no onboarding.",
      metadata: {
        termsUrl,
        privacyUrl,
        communicationCommercialCampaigns: communicationPreferences.commercialCampaigns,
        communicationGrowthTips: communicationPreferences.growthTips,
        communicationUpgradeOffers: communicationPreferences.upgradeOffers
      }
    });
    const store = tenantData.store || {};
    const planSlug = billing.planSlug || tenantData.plan || "";
    await sendEmailFromTemplateViaSmtp({
      to: authEmail,
      templateKey: "welcome_access_created",
      source: "signup",
      eventId: `signup_completed_${uid}`,
      tenantUid: uid,
      variables: {
        buyerName: tenantData.ownerName || tenantData.fullName || authEmail,
        buyerEmail: authEmail,
        planName: planDisplayName(planSlug),
        productName: "BocaFood",
        storeName: store.name || tenantData.storeName || ""
      }
    });
    return { ok: true, legalAccepted: true, redirectUrl: "/admin.html#dashboard" };
  }

  if (stage === "account_created") {
    await recordSignupLog({ tenantUid: uid, email: authEmail, action: "signup_started", summary: "Cadastro BocaFood iniciado.", metadata: { purchaseFound: !!pending } });
    await recordSignupLog({ tenantUid: uid, email: authEmail, action: "signup_account_created", summary: "Conta Firebase criada pelo onboarding.", metadata: { purchaseFound: !!pending } });
    await tenantRef.set({
      email: authEmail,
      accountStatus: pending ? "active" : "pending",
      status: pending ? "active" : "pending",
      origin: pending ? "hotmart" : "signup",
      role: "admin",
      auth: {
        uid,
        emailVerified: !!(auth.token && auth.token.email_verified)
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { ok: true, purchaseFound: !!pending, accountStatus: pending ? "active" : "pending" };
  }

  const ownerName = cleanSignupText(data.ownerName, 120);
  const storeName = cleanSignupText(data.storeName, 120);
  const storeCity = cleanSignupText(data.storeCity || data.serviceCity, 120);
  const fiscalCountry = cleanCountryCode(data.fiscalCountry || data.countryFiscal || data.accountFiscalCountry) || "ES";
  const businessType = cleanSignupText(data.businessType || data.storeKind, 120);
  const businessStage = cleanSignupText(data.businessStage, 120);
  const language = cleanLanguageCode(data.language);
  if (!ownerName || !storeName || !storeCity || !businessType || !businessStage) {
    throw new HttpsError("invalid-argument", "Preencha os dados obrigatórios do cadastro.");
  }

  const whatsappCountryCode = cleanSignupText(data.whatsappCountryCode, 8);
  const whatsappNumber = cleanSignupText(data.whatsappNumber, 32).replace(/[^\d\s().-]/g, "").trim();
  const whatsappFull = cleanSignupText(data.whatsappFull || `${whatsappCountryCode}${whatsappNumber}`.replace(/\s+/g, ""), 48);
  const billing = signupBillingFromPending(pending);
  const patch = {
    email: authEmail,
    ownerName,
    whatsappCountryCode,
    whatsappNumber,
    whatsappFull,
    language,
    fiscalCountry,
    accountAddress: {
      city: storeCity,
      fiscalCountry,
      source: "signup_onboarding",
      updatedAt: now
    },
    accountStatus: pending ? "active" : "pending",
    status: pending ? "active" : "pending",
    origin: pending ? "hotmart" : "signup",
    role: "admin",
    store: {
      name: storeName,
      city: storeCity,
      fiscalCountry,
      status: "draft",
      updatedAt: now
    },
    businessProfile: {
      businessType,
      salesMode: cleanSignupText(data.salesMode, 120),
      serviceCity: storeCity,
      fiscalCountry,
      sellingFrequency: cleanSignupText(data.sellingFrequency, 120),
      salesChannels: cleanSignupList(data.salesChannels),
      menuStatus: cleanSignupText(data.menuStatus, 120),
      orderControl: cleanSignupText(data.orderControl, 120),
      productionPlace: cleanSignupText(data.productionPlace, 120),
      dailyCapacity: cleanSignupText(data.dailyCapacity, 120),
      teamStructure: cleanSignupText(data.teamStructure, 120),
      costKnowledge: cleanSignupText(data.costKnowledge, 120),
      mainChallenge: cleanSignupText(data.mainChallenge, 120),
      mainGoal: cleanSignupText(data.mainGoal, 120),
      businessStage,
      weeklyTimeAvailable: cleanSignupText(data.weeklyTimeAvailable, 120),
      source: "signup_onboarding",
      updatedAt: now
    },
    auth: {
      uid,
      emailVerified: !!(auth.token && auth.token.email_verified)
    },
    updatedAt: serverTimestamp()
  };
  if (pending) {
    patch.billing = billing;
    patch.plan = billing.planSlug || "";
    patch.billingStatus = "active";
    patch.billingCycle = billing.billingCycle || "";
    patch.activatedAt = billing.activatedAt || now;
    if (billing.trialEndsAt) patch.trialEndsAt = billing.trialEndsAt;
  }

  await tenantRef.set(patch, { merge: true });
  await recordSignupLog({ tenantUid: uid, email: authEmail, action: "signup_business_profile_saved", summary: "Diagnóstico inicial do negócio salvo.", metadata: { businessType, businessStage, salesMode: patch.businessProfile.salesMode } });

  if (pending) {
    await db.collection("pending_hotmart_access").doc(pending.id).set({
      status: "linked",
      linkedTenantUid: uid,
      linkedEmail: authEmail,
      linkedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    await recordSignupLog({ tenantUid: uid, email: authEmail, action: "signup_hotmart_linked", summary: "Compra Hotmart vinculada ao cadastro.", metadata: { pendingId: pending.id, planSlug: billing.planSlug, billingCycle: billing.billingCycle } });
    await recordSignupLog({ tenantUid: uid, email: authEmail, action: "signup_completed", summary: "Cadastro BocaFood concluído com compra ativa.", metadata: { origin: "hotmart" } });
    return { ok: true, purchaseFound: true, accountStatus: "active", redirectUrl: "/admin.html#dashboard" };
  }

  await recordSignupLog({ tenantUid: uid, email: authEmail, action: "signup_without_purchase", summary: "Cadastro concluído sem compra ativa localizada.", severity: "warning", metadata: { origin: "signup" } });
  return {
    ok: false,
    code: "NO_ACTIVE_PURCHASE",
    purchaseFound: false,
    accountStatus: "pending",
    message: "Não encontramos uma compra ativa para este e-mail. Use o mesmo e-mail da compra ou fale com o suporte: teajudo@bocafood.app."
  };
});

exports.hotmartWebhook = onRequest(
  { region: REGION, secrets: [HOTMART_HOTTOK_SECRET] },
  async (req, res) => {
    try {
      if (req.method === "GET") {
        return res.status(200).send("Hotmart webhook endpoint ativo");
      }

      if (req.method !== "POST") {
        return res.status(405).send("Method not allowed");
      }

      const expectedHottok = readHotmartHottok();
      const receivedHottok = String(req.get("X-HOTMART-HOTTOK") || "").trim();

      if (!expectedHottok) {
        console.error("HOTMART_HOTTOK não configurado para o webhook.");
        return res.status(500).send("Webhook token not configured");
      }

      if (hotmartHottokLooksMisconfigured(expectedHottok)) {
        console.error("HOTMART_HOTTOK parece estar mal configurado.");
        return res.status(500).send("Webhook token misconfigured");
      }

      if (!expectedHottok || receivedHottok !== expectedHottok) {
        return res.status(401).send("Unauthorized");
      }

      const payload = req.body || {};
      const eventId = payload.id || `hotmart-${Date.now()}`;
      const eventRef = db.collection("hotmart_events").doc(eventId);
      const existingEvent = await eventRef.get();
      const existingEventData = existingEvent.exists ? existingEvent.data() || {} : {};

      if (existingEvent.exists && existingEventData.processedAt) {
        return res.status(200).json({
          ok: true,
          duplicate: true,
          event: payload.event || null
        });
      }

      await eventRef.set(
        {
          event: payload.event || null,
          payload,
          receivedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      const eventName = payload.event || payload.event_name || payload.type;
      const status = hotmartBillingStatus(eventName, payload);
      let linkedCount = 0;
      let processingStatus = status ? "processed" : "ignored_unsupported";
      let processingReason = status ? "" : "unmapped_event";
      let buyerSummary = {};
      if (status) {
        const buyer = extractHotmartBuyer(payload);
        buyerSummary = {
          buyerEmail: buyer.buyerEmail || "",
          hotmartSubscriberCode: buyer.hotmartSubscriberCode || "",
          hotmartTransaction: buyer.hotmartTransaction || "",
          hotmartOfferCode: buyer.hotmartOfferCode || "",
          planSlug: buyer.planSlug || "",
          billingCycle: buyer.billingCycle || ""
        };
        if (buyer.buyerEmail || buyer.hotmartSubscriberCode || buyer.hotmartTransaction) {
          const eventAt = eventDateIso(payload);
          const linkedResult = await applyHotmartBillingToTenants({ buyer, status, eventName, eventAt });
          linkedCount = linkedResult.count || 0;
          if (!linkedCount) {
            processingStatus = "pending_manual";
            processingReason = "tenant_not_found";
          }
          const pendingAccess = {
            eventId,
            buyerName: buyer.buyerName,
            buyerEmail: buyer.buyerEmail,
            buyerPhone: buyer.buyerPhone,
            buyerCountry: buyer.buyerCountry,
            buyerAddress: buyer.buyerAddress,
            planName: buyer.planName,
            productName: buyer.productName,
            planSlug: buyer.planSlug,
            billingCycle: buyer.billingCycle,
            trialDays: buyer.trialDays || 0,
            activatedAt: status === "active" ? eventAt : "",
            canceledAt: ["canceled", "refunded", "chargeback"].includes(status) ? eventAt : "",
            purchaseStatus: buyer.purchaseStatus || "",
            subscriptionStatus: buyer.subscriptionStatus || status,
            hotmartSubscriberCode: buyer.hotmartSubscriberCode || "",
            hotmartTransaction: buyer.hotmartTransaction || "",
            hotmartProductId: buyer.hotmartProductId || "",
            hotmartOfferCode: buyer.hotmartOfferCode || "",
            offerCode: buyer.hotmartOfferCode || "",
            lastHotmartEventAt: eventAt,
            status: linkedCount ? "linked" : "pending",
            internalStatus: status,
            pendingReason: linkedCount ? "linked_to_tenant" : "tenant_not_found",
            eventType: eventName || "",
            source: "hotmart",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          if (buyer.trialEndsAt) pendingAccess.trialEndsAt = buyer.trialEndsAt;
          else pendingAccess.trialEndsAt = admin.firestore.FieldValue.delete();
          await db.collection("pending_hotmart_access").doc(eventId).set(pendingAccess, { merge: true });
          await recordSystemAccessLog({
            email: buyer.buyerEmail,
            action: linkedCount ? "hotmart_linked_to_tenant" : hotmartLogAction(status),
            summary: linkedCount ? "Evento Hotmart vinculado ao tenant." : "Evento Hotmart recebido sem tenant vinculado.",
            severity: buyer.billingCycleFallback ? "warning" : "info",
            metadata: {
              eventId,
              eventType: eventName,
              billingStatus: status,
              planSlug: buyer.planSlug,
              billingCycle: buyer.billingCycle,
              linkedCount
            }
          });
          const templateKey = hotmartEmailTemplateForStatus({ status, linkedCount });
          if (buyer.buyerEmail && templateKey) {
            const settingsSnap = await db.collection("system_email_settings").doc("default").get();
            const settings = settingsSnap.exists ? settingsSnap.data() : {};
            const tenantUid = (linkedResult.tenantUids || [])[0] || "";
            const variables = hotmartEmailVariables({ buyer, settings, status, eventAt });
            const smtpResult = await sendEmailFromTemplateViaSmtp({
              to: buyer.buyerEmail,
              templateKey,
              source: "hotmart",
              eventId,
              tenantUid,
              variables
            });
            if (!smtpResult.ok) {
              console.warn("Hotmart email SMTP not sent", {
                eventId,
                templateKey,
                to: buyer.buyerEmail,
                reason: smtpResult.reason || smtpResult.error || "send_failed"
              });
            }
            if (!smtpResult.ok && !smtpResult.skipped && templateKey === "welcome_hotmart") {
              await createEmailFromTemplate({
                to: buyer.buyerEmail,
                templateKey,
                origin: "hotmart_fallback",
                metadata: { eventId, fallback: true },
                variables
              });
            }
          }
        } else {
          const eventAt = eventDateIso(payload);
          processingStatus = "pending_manual";
          processingReason = "incomplete_hotmart_payload";
          await db.collection("pending_hotmart_access").doc(eventId).set({
            eventId,
            buyerName: buyer.buyerName || "",
            buyerEmail: "",
            planName: buyer.planName || "",
            productName: buyer.productName || "",
            planSlug: buyer.planSlug || "",
            billingCycle: buyer.billingCycle || "",
            purchaseStatus: buyer.purchaseStatus || "",
            subscriptionStatus: buyer.subscriptionStatus || status,
            hotmartSubscriberCode: "",
            hotmartTransaction: "",
            hotmartProductId: buyer.hotmartProductId || "",
            hotmartOfferCode: buyer.hotmartOfferCode || "",
            lastHotmartEventAt: eventAt,
            status: "pending",
            internalStatus: status,
            pendingReason: "incomplete_hotmart_payload",
            eventType: eventName || "",
            source: "hotmart",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
          await recordSystemAccessLog({
            action: "hotmart_event_incomplete",
            summary: "Evento Hotmart recebido com dados insuficientes para vincular ao tenant.",
            severity: "warning",
            metadata: {
              eventId,
              eventType: eventName,
              billingStatus: status,
              pendingReason: "incomplete_hotmart_payload"
            }
          });
        }
      }

      await eventRef.set(
        {
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          processingStatus,
          processingReason,
          billingStatus: status || "",
          linkedCount,
          buyerEmail: buyerSummary.buyerEmail || "",
          hotmartSubscriberCode: buyerSummary.hotmartSubscriberCode || "",
          hotmartTransaction: buyerSummary.hotmartTransaction || "",
          hotmartOfferCode: buyerSummary.hotmartOfferCode || "",
          planSlug: buyerSummary.planSlug || "",
          billingCycle: buyerSummary.billingCycle || ""
        },
        { merge: true }
      );

      return res.status(200).json({
        ok: true,
        event: payload.event || null
      });
    } catch (error) {
      console.error("Erro no hotmartWebhook:", error);
      return res.status(500).send("Internal error");
    }
  }
);

exports.dailyTenantTagCheck = onSchedule(
  { region: REGION, schedule: "0 9 * * *", timeZone: "Europe/Madrid" },
  async () => {
    const snap = await db.collection("system_tenants").limit(500).get();
    const jobs = [];
    snap.forEach((doc) => {
      const tenant = doc.data() || {};
      const uid = doc.id;
      const billing = tenant.billing || {};
      const store = tenant.store || {};
      const billingStatus = String(billing.status || tenant.billingStatus || "").toLowerCase();
      const trialEndsAt = billing.trialEndsAt || tenant.trialEndsAt || "";
      const days = daysUntilMadrid(trialEndsAt);

      if (days === 3) jobs.push(applyTenantTag(uid, "trial_ending", { source: "dailyTenantTagCheck", reason: "trial_ends_in_3_days", metadata: { trialEndsAt } }));
      else jobs.push(removeTenantTag(uid, "trial_ending", { source: "dailyTenantTagCheck", reason: "trial_not_ending" }));

      if (days === 0) jobs.push(applyTenantTag(uid, "trial_ends_today", { source: "dailyTenantTagCheck", reason: "trial_ends_today", metadata: { trialEndsAt } }));
      else jobs.push(removeTenantTag(uid, "trial_ends_today", { source: "dailyTenantTagCheck", reason: "trial_not_today" }));

      if (days != null && days < 0 && billingStatus !== "active") jobs.push(applyTenantTag(uid, "trial_expired", { source: "dailyTenantTagCheck", reason: "trial_expired_without_active_subscription", metadata: { trialEndsAt, billingStatus } }));
      else jobs.push(removeTenantTag(uid, "trial_expired", { source: "dailyTenantTagCheck", reason: "trial_not_expired" }));

      if (String(store.status || "") !== "published") jobs.push(applyTenantTag(uid, "store_not_published", { source: "dailyTenantTagCheck", reason: "store_not_published", metadata: { storeStatus: store.status || "" } }));
      else jobs.push(removeTenantTag(uid, "store_not_published", { source: "dailyTenantTagCheck", reason: "store_published" }));

      if (String(store.status || "") !== "published" && tenantMeetsStoreReady(tenant)) jobs.push(applyTenantTag(uid, "store_ready_to_publish", { source: "dailyTenantTagCheck", reason: "minimum_store_fields_present" }));
      else jobs.push(removeTenantTag(uid, "store_ready_to_publish", { source: "dailyTenantTagCheck", reason: "store_not_ready_or_published" }));

      if (billingStatus === "pending_payment") jobs.push(applyTenantTag(uid, "payment_pending", { source: "dailyTenantTagCheck", reason: "billing_pending_payment" }));
      else jobs.push(removeTenantTag(uid, "payment_pending", { source: "dailyTenantTagCheck", reason: "billing_not_pending" }));

      if (["canceled", "refunded", "chargeback"].includes(billingStatus)) jobs.push(applyTenantTag(uid, "subscription_canceled", { source: "dailyTenantTagCheck", reason: "billing_canceled", metadata: { billingStatus } }));
      else jobs.push(removeTenantTag(uid, "subscription_canceled", { source: "dailyTenantTagCheck", reason: "billing_not_canceled" }));

      if (billingStatus === "active") jobs.push(applyTenantTag(uid, "subscription_active", { source: "dailyTenantTagCheck", reason: "billing_active" }));
      else jobs.push(removeTenantTag(uid, "subscription_active", { source: "dailyTenantTagCheck", reason: "billing_not_active" }));
    });
    await Promise.all(jobs);
    console.info("dailyTenantTagCheck completed", { tenants: snap.size, writes: jobs.length });
  }
);

exports.dailyFirestoreBackup = onSchedule(
  { region: REGION, schedule: "0 3 * * *", timeZone: "Europe/Madrid", serviceAccount: FIREBASE_ADMIN_SERVICE_ACCOUNT, timeoutSeconds: 540, memory: "512MiB" },
  async () => {
    const result = await runFirestoreExport({ source: "schedule", requestedBy: "dailyFirestoreBackup" });
    if (!result.ok && !result.skipped) console.error("dailyFirestoreBackup failed", { error: result.error || "backup_failed" });
  }
);

exports.dailyCrmTagRuleCheck = onSchedule(
  { region: REGION, schedule: "40 9 * * *", timeZone: "Europe/Madrid" },
  async () => {
    await ensureCrmTagDefaults();
    await ensureCrmTagRuleDefaults();
    const rulesSnap = await db.collection("system_crm_tag_rules").where("enabled", "==", true).limit(50).get();
    const tenantsSnap = await db.collection("system_tenants").limit(500).get();
    const jobs = [];
    rulesSnap.forEach((ruleDoc) => {
      const rule = ruleDoc.data() || {};
      if (String(rule.audience || "tenants") !== "tenants") return;
      const actions = Array.isArray(rule.actions) ? rule.actions : [];
      if (!actions.length) return;
      tenantsSnap.forEach((tenantDoc) => {
        const tenantUid = tenantDoc.id;
        const tenant = {
          ...(tenantDoc.data() || {}),
          id: tenantUid,
          uid: tenantUid,
          tenantUid
        };
        const matched = tenantMatchesCrmRule(tenant, rule);
        if (!matched) {
          jobs.push(writeCrmTagLog({
            ruleId: ruleDoc.id,
            tenantUid,
            action: "skipped",
            matched: false,
            reason: "conditions_not_matched"
          }));
          return;
        }
        actions.forEach((action) => {
          const type = String(action.type || "").trim();
          const tagKey = cleanCrmTagKey(action.tagKey);
          if (!tagKey) {
            jobs.push(writeCrmTagLog({
              ruleId: ruleDoc.id,
              tenantUid,
              action: "error",
              matched: true,
              reason: "tagKey_missing"
            }));
            return;
          }
          if (type === "add_tag") {
            jobs.push(applyCrmTagToTenant(tenantUid, tagKey, {
              addedBy: "dailyCrmTagRuleCheck",
              source: "rule"
            }).then(() => writeCrmTagLog({
              ruleId: ruleDoc.id,
              tenantUid,
              action: "add_tag",
              tagKey,
              matched: true,
              reason: "rule_matched"
            })).catch((error) => writeCrmTagLog({
              ruleId: ruleDoc.id,
              tenantUid,
              action: "error",
              tagKey,
              matched: true,
              reason: error && error.message ? error.message : "add_tag_failed"
            })));
          } else if (type === "remove_tag") {
            jobs.push(removeCrmTagFromTenant(tenantUid, tagKey).then(() => writeCrmTagLog({
              ruleId: ruleDoc.id,
              tenantUid,
              action: "remove_tag",
              tagKey,
              matched: true,
              reason: "rule_matched"
            })).catch((error) => writeCrmTagLog({
              ruleId: ruleDoc.id,
              tenantUid,
              action: "error",
              tagKey,
              matched: true,
              reason: error && error.message ? error.message : "remove_tag_failed"
            })));
          }
        });
      });
    });
    await Promise.all(jobs);
    console.info("dailyCrmTagRuleCheck completed", { rules: rulesSnap.size, tenants: tenantsSnap.size, writes: jobs.length });
  }
);

exports.dailyEmailTriggerCheck = onSchedule(
  { region: REGION, schedule: "20 9 * * *", timeZone: "Europe/Madrid" },
  async () => {
    await ensureEmailDefaults();
    await ensureEmailTriggerDefaults();
    const triggersSnap = await db.collection("system_email_triggers").where("enabled", "==", true).limit(50).get();
    const triggerJobs = [];
    triggersSnap.forEach((triggerDoc) => {
      const trigger = triggerDoc.data() || {};
      const tagKey = String(trigger.tagKey || "").trim();
      if (!TENANT_TAG_KEYS.includes(tagKey)) return;
      triggerJobs.push((async () => {
        const tenantsSnap = await db.collection("system_tenants").where(`tags.${tagKey}.active`, "==", true).limit(200).get();
        const sendJobs = [];
        tenantsSnap.forEach((tenantDoc) => {
          const tenant = tenantDoc.data() || {};
          sendJobs.push((async () => {
            const email = normalizeEmail(tenant.email || (tenant.auth && tenant.auth.email));
            if (!email) return;
            const tag = tenant.tags && tenant.tags[tagKey] ? tenant.tags[tagKey] : {};
            const added = tag.addedAt ? Date.parse(tag.addedAt) : 0;
            if (Number(trigger.delayHours || 0) > 0 && added && Date.now() - added < Number(trigger.delayHours || 0) * 3600000) return;
            const deduped = await tenantEmailRecentlySent({
              tenantUid: tenantDoc.id,
              triggerKey: trigger.triggerKey || triggerDoc.id,
              dedupeWindowDays: trigger.dedupeWindowDays || 30
            });
            if (deduped) return;
            const eventId = `tag_${trigger.triggerKey || triggerDoc.id}_${tenantDoc.id}_${dateOnlyMadrid(new Date())}`;
            await sendEmailFromTemplateViaSmtp({
              to: email,
              templateKey: trigger.templateKey,
              source: "tag_trigger",
              eventId,
              tenantUid: tenantDoc.id,
              variables: tenantEmailVariables(tenant, tagKey),
              triggerKey: trigger.triggerKey || triggerDoc.id,
              tagKey
            });
          })());
        });
        await Promise.all(sendJobs);
      })());
    });
    await Promise.all(triggerJobs);
    console.info("dailyEmailTriggerCheck completed", { triggers: triggersSnap.size });
  }
);
