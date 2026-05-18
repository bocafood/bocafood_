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
    ctaUrl: "{{appBaseUrl}}/admin.html#inicio",
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
  if (!MASTER_EMAILS.has(normalizeEmail(decoded.email))) throw new Error("forbidden");
  return decoded;
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
    return { ok: true, legalAccepted: true, redirectUrl: "/admin.html#inicio" };
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
    accountStatus: pending ? "active" : "pending",
    status: pending ? "active" : "pending",
    origin: pending ? "hotmart" : "signup",
    role: "admin",
    store: {
      name: storeName,
      city: storeCity,
      status: "draft",
      updatedAt: now
    },
    businessProfile: {
      businessType,
      salesMode: cleanSignupText(data.salesMode, 120),
      serviceCity: storeCity,
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
    return { ok: true, purchaseFound: true, accountStatus: "active", redirectUrl: "/admin.html#inicio" };
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
