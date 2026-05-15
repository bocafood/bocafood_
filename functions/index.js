const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const net = require("net");
const tls = require("tls");

admin.initializeApp();

const db = admin.firestore();
const REGION = "us-central1";
const MASTER_EMAILS = new Set([
  "bocadobrasil.es@gmail.com",
  "pcruz.digital@gmail.com"
]);

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
  password_reset: {
    key: "password_reset",
    name: "Esqueci minha senha",
    description: "Base preparada para envio futuro de link gerado pelo Firebase Admin.",
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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function replaceVariables(text, variables) {
  return String(text || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = variables && variables[key] != null ? variables[key] : "";
    return String(value);
  });
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

function extractHotmartBuyer(payload) {
  const data = payload.data || payload;
  const buyer = data.buyer || data.buyer_info || {};
  const purchase = data.purchase || {};
  const subscription = data.subscription || {};
  const product = data.product || {};
  const fullName = buyer.name || buyer.full_name || data.buyerName || "";
  return {
    buyerName: fullName || "Cliente",
    buyerEmail: normalizeEmail(buyer.email || data.buyerEmail || data.email),
    planName: subscription.plan && subscription.plan.name ? subscription.plan.name : (subscription.plan_name || purchase.plan || data.planName || "Plano BocaFood"),
    productName: product.name || data.productName || "BocaFood"
  };
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
      appBaseUrl: "https://app.bocafood.com",
      brandName: "BocaFood",
      brandLogoUrl: "https://bocafood.app/assets/boca-food-logo.png",
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

function buildEmailLayout(settings, template, variables) {
  const brandName = variables.brandName || settings.brandName || "BocaFood";
  const supportEmail = variables.supportEmail || settings.supportEmail || settings.replyTo || "";
  const logoUrl = variables.brandLogoUrl || settings.brandLogoUrl || "https://bocafood.app/assets/boca-food-logo.png";
  const preheader = replaceVariables(template.preheader || "", variables);
  const body = replaceVariables(template.body || template.html || "", variables);
  const ctaLabel = replaceVariables(template.ctaLabel || "", variables);
  const ctaUrl = replaceVariables(template.ctaUrl || "", variables);
  const title = replaceVariables(template.subject || template.name || brandName, variables);
  const ctaHtml = ctaLabel && ctaUrl
    ? `<a href="${ctaUrl}" style="display:inline-block;background:#B42318;color:#ffffff;text-decoration:none;border-radius:14px;padding:14px 22px;font-size:14px;font-weight:700;line-height:1.2;min-width:190px;text-align:center;box-shadow:0 12px 24px rgba(180,35,24,.18);">${ctaLabel}</a>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;padding:0;background:#FFF7F6;font-family:Arial,Helvetica,sans-serif;color:#1F1F1F;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFF7F6;padding:26px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border-radius:24px;box-shadow:0 18px 46px rgba(31,31,31,.08);overflow:hidden;border:1px solid #F2EDED;"><tr><td style="height:5px;background:#B42318;font-size:1px;line-height:1px;">&nbsp;</td></tr><tr><td style="padding:26px 30px 10px;text-align:left;background:linear-gradient(135deg,#FFFFFF 0%,#FFF8F6 100%);"><img src="${logoUrl}" alt="${brandName}" width="132" style="display:block;width:132px;max-width:46%;height:auto;border:0;outline:none;text-decoration:none;"><div style="margin-top:20px;font-size:11px;line-height:1.3;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#B42318;">SaaS ${brandName}</div><div style="margin-top:8px;font-size:26px;line-height:1.16;font-weight:700;color:#1F1F1F;">${title}</div>${preheader ? `<div style="margin-top:9px;font-size:14px;line-height:1.55;color:#6F6860;">${preheader}</div>` : ""}</td></tr><tr><td style="padding:14px 30px 4px;background:#ffffff;"><div style="border:1px solid #E7DDD1;border-radius:20px;padding:20px;background:linear-gradient(135deg,#FFFFFF 0%,#FAF8F4 100%);font-size:15px;line-height:1.68;color:#3B3533;">${body}${ctaHtml ? `<div style="margin-top:24px;text-align:left;">${ctaHtml}</div>` : ""}</div></td></tr><tr><td style="padding:16px 30px 0;background:#ffffff;"><div style="font-size:12px;line-height:1.5;color:#8A7E7C;background:#FFF8EC;border:1px solid #F5E3BC;border-radius:16px;padding:12px 14px;">Por seguranca, nunca compartilhe sua senha. O BocaFood nao solicita senhas por e-mail.</div></td></tr><tr><td style="padding:20px 30px 30px;background:#ffffff;font-size:12px;line-height:1.5;color:#8A7E7C;">Precisa de ajuda? Escreva para <a href="mailto:${supportEmail}" style="color:#B42318;text-decoration:none;font-weight:700;">${supportEmail}</a>.<br>${brandName}</td></tr></table></td></tr></table></body></html>`;
}

async function loadEmailTemplate(templateKey) {
  await ensureEmailDefaults();
  const snap = await db.collection("system_email_templates").doc(templateKey).get();
  if (!snap.exists) throw new Error(`Template ${templateKey} não encontrado`);
  return snap.data();
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
    appBaseUrl: settings.appBaseUrl || "https://app.bocafood.com",
    brandName: settings.brandName || settings.fromName || "BocaFood",
    brandLogoUrl: settings.brandLogoUrl || "https://bocafood.app/assets/boca-food-logo.png",
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

function smtpSocketVerify(config) {
  return new Promise((resolve, reject) => {
    const host = String(config.smtpHost || "").trim();
    const port = Number(config.smtpPort || 587);
    const secure = String(config.smtpSecure || "tls").toLowerCase();
    if (!host || !port) return reject(new Error("smtp_host_port_required"));
    const timeout = setTimeout(() => reject(new Error("smtp_connection_timeout")), 9000);
    const done = (fn, socket, value) => {
      clearTimeout(timeout);
      try { socket.end(); } catch (e) {}
      fn(value);
    };
    const options = { host, port, servername: host, rejectUnauthorized: false };
    const socket = secure === "ssl" ? tls.connect(options) : net.connect({ host, port });
    socket.once(secure === "ssl" ? "secureConnect" : "connect", () => done(resolve, socket, true));
    socket.once("error", (error) => done(reject, socket, error));
  });
}

exports.saveEmailSettings = onRequest({ region: REGION }, async (req, res) => {
  try {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    await requireMaster(req);
    const body = req.body || {};
    const password = String(body.smtpPassword || "");
    const data = {
      fromName: String(body.fromName || "").trim(),
      fromEmail: normalizeEmail(body.fromEmail),
      replyTo: normalizeEmail(body.replyTo),
      supportEmail: normalizeEmail(body.supportEmail || body.replyTo),
      appBaseUrl: String(body.appBaseUrl || "").trim(),
      brandName: String(body.brandName || "BocaFood").trim(),
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
    const result = await createEmailFromTemplate({
      to,
      templateKey,
      origin: "teste",
      variables: {
        buyerName: "Patrícia",
        buyerEmail: to,
        signupUrl: "https://app.bocafood.com/cadastro",
        supportEmail: DEFAULT_SUPPORT_EMAIL,
        planName: "Plano Essencial",
        productName: "BocaFood",
        resetPasswordUrl: "https://app.bocafood.com/redefinir-senha",
        appBaseUrl: "https://app.bocafood.com",
        brandName: "BocaFood",
        brandLogoUrl: "https://bocafood.app/assets/boca-food-logo.png",
        ...(body.variables || {})
      }
    });
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || "send_test_error" });
  }
});

exports.hotmartWebhook = onRequest(
  { region: REGION },
  async (req, res) => {
    try {
      if (req.method === "GET") {
        return res.status(200).send("Hotmart webhook endpoint ativo");
      }

      if (req.method !== "POST") {
        return res.status(405).send("Method not allowed");
      }

      const expectedHottok = process.env.HOTMART_HOTTOK;
      const receivedHottok = req.get("X-HOTMART-HOTTOK");

      if (!expectedHottok || receivedHottok !== expectedHottok) {
        return res.status(401).send("Unauthorized");
      }

      const payload = req.body || {};
      const eventId = payload.id || `hotmart-${Date.now()}`;
      const eventRef = db.collection("hotmart_events").doc(eventId);
      const existingEvent = await eventRef.get();

      if (existingEvent.exists) {
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
      if (isApprovedHotmartEvent(eventName)) {
        const buyer = extractHotmartBuyer(payload);
        if (buyer.buyerEmail) {
          const settingsSnap = await db.collection("system_email_settings").doc("default").get();
          const settings = settingsSnap.exists ? settingsSnap.data() : {};
          const appBaseUrl = settings.appBaseUrl || "https://app.bocafood.com";
          await db.collection("pending_hotmart_access").doc(eventId).set({
            eventId,
            buyerName: buyer.buyerName,
            buyerEmail: buyer.buyerEmail,
            planName: buyer.planName,
            productName: buyer.productName,
            status: "pending",
            source: "hotmart",
            createdAt: serverTimestamp(),
            payload
          }, { merge: true });
          await createEmailFromTemplate({
            to: buyer.buyerEmail,
            templateKey: "welcome_hotmart",
            origin: "hotmart",
            metadata: { eventId },
            variables: {
              ...buyer,
              signupUrl: `${appBaseUrl.replace(/\/$/, "")}/cadastro`,
              supportEmail: settings.supportEmail || settings.replyTo || "",
              appBaseUrl,
              brandName: settings.brandName || settings.fromName || "BocaFood",
              brandLogoUrl: settings.brandLogoUrl || "https://bocafood.app/assets/boca-food-logo.png"
            }
          });
        }
      }

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
