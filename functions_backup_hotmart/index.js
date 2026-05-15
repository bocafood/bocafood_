'use strict';

const crypto = require('crypto');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions');
const { onRequest } = require('firebase-functions/v2/https');

admin.initializeApp();

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const DEFAULT_HOTMART_MAPPING = {
  offers: {
    ID_DA_OFERTA_MENSAL: {
      planSlug: 'essencial_mensal',
      billingCycle: 'monthly',
      trialDays: 15
    },
    ID_DA_OFERTA_ANUAL: {
      planSlug: 'compromisso_anual',
      billingCycle: 'annual',
      trialDays: 15
    },
    ID_DA_OFERTA_FUNDADORAS: {
      planSlug: 'fundadoras',
      billingCycle: 'monthly',
      trialDays: 15
    }
  }
};

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function safeDocId(value) {
  return String(value || 'unknown')
    .trim()
    .toLowerCase()
    .replace(/[/?#[\].]/g, '_')
    .slice(0, 900) || 'unknown';
}

function compact(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function pick() {
  for (let i = 0; i < arguments.length; i += 1) {
    const value = arguments[i];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
}

function lower(value) {
  return compact(value).toLowerCase();
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value) {
  if (!value) return new Date();
  if (typeof value === 'number') {
    const millis = value > 100000000000 ? value : value * 1000;
    const dateFromNumber = new Date(millis);
    return Number.isNaN(dateFromNumber.getTime()) ? new Date() : dateFromNumber;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function normalizedStatusText(value) {
  return lower(value).replace(/[\s-]+/g, '_');
}

function getPayloadData(payload) {
  return payload && payload.data && typeof payload.data === 'object' ? payload.data : {};
}

function normalizeHotmartPayload(payload) {
  const data = getPayloadData(payload);
  const buyer = data.buyer || data.customer || payload.buyer || payload.customer || {};
  const product = data.product || payload.product || {};
  const purchase = data.purchase || payload.purchase || {};
  const subscription = data.subscription || payload.subscription || {};
  const offer = data.offer || purchase.offer || subscription.offer || payload.offer || {};
  const price = purchase.price || purchase.full_price || purchase.approved_price || data.price || payload.price || {};
  const eventType = compact(payload.event || payload.event_type || payload.eventType || payload.type || payload.hotmart_event || '');

  const buyerEmail = normalizeEmail(pick(
    buyer.email,
    buyer.email_address,
    purchase.buyer_email,
    data.buyer_email,
    payload.buyer_email,
    payload.email
  ));

  const buyerName = compact(pick(
    buyer.name,
    buyer.full_name,
    buyer.first_name && buyer.last_name ? buyer.first_name + ' ' + buyer.last_name : '',
    purchase.buyer_name,
    payload.buyer_name
  ));

  const transaction = compact(pick(
    purchase.transaction,
    purchase.transaction_id,
    data.transaction,
    payload.transaction,
    payload.transaction_id
  ));

  const subscriberCode = compact(pick(
    subscription.subscriber_code,
    subscription.subscriberCode,
    subscription.code,
    data.subscriber_code,
    payload.subscriber_code,
    payload.subscriberCode
  ));

  const productId = compact(pick(product.id, product.ucode, product.code, product.name, payload.product_id));
  const offerId = compact(pick(offer.id, offer.code, offer.ucode, purchase.offer_code, payload.offer_id, payload.offer_code));
  const purchaseStatus = normalizedStatusText(pick(purchase.status, data.purchase_status, payload.purchase_status, payload.status));
  const subscriptionStatus = normalizedStatusText(pick(subscription.status, data.subscription_status, payload.subscription_status));
  const rawEventDate = pick(payload.creation_date, payload.event_date, payload.eventDate, data.event_date, purchase.approved_date, purchase.order_date, subscription.date_next_charge);
  const explicitEventId = compact(pick(payload.id, payload.event_id, payload.eventId, payload.webhook_event_id, payload.webhookEventId, data.id));
  const eventDate = parseDate(rawEventDate);
  const amount = num(pick(price.value, price.amount, purchase.price && purchase.price.value, purchase.full_price && purchase.full_price.value, purchase.approved_price && purchase.approved_price.value, payload.value, payload.amount));
  const currency = compact(pick(price.currency_value, price.currency, purchase.currency, data.currency, payload.currency));

  const status = mapBillingStatus({
    eventType,
    purchaseStatus,
    subscriptionStatus
  });

  const eventKey = explicitEventId || [
    'hotmart',
    eventType || 'event',
    transaction || subscriberCode || buyerEmail || 'no-id',
    purchaseStatus || subscriptionStatus || status,
    rawEventDate ? compact(rawEventDate) : 'no-event-date'
  ].join(':');

  return {
    eventType,
    eventId: crypto.createHash('sha256').update(eventKey).digest('hex'),
    buyerEmail,
    buyerName,
    productId,
    offerId,
    transaction,
    subscriberCode,
    purchaseStatus,
    subscriptionStatus,
    status,
    eventDate: eventDate.toISOString(),
    amount,
    currency,
    rawPayload: payload || {}
  };
}

function mapBillingStatus(input) {
  const eventType = lower(input.eventType);
  const purchaseStatus = normalizedStatusText(input.purchaseStatus);
  const subscriptionStatus = normalizedStatusText(input.subscriptionStatus);
  const combined = [eventType, purchaseStatus, subscriptionStatus].join(' ');

  if (/chargeback/.test(combined)) return 'chargeback';
  if (/refund|refunded|reembolso/.test(combined)) return 'refunded';
  if (/cancel|cancelled|canceled|cancellation|expired|inactive|assinatura_cancelada/.test(combined)) return 'canceled';
  if (/past_due|late|delayed|delay|overdue|atras/.test(combined)) return 'past_due';
  if (/approved|complete|completed|active|compra_aprovada|assinatura_ativa/.test(combined)) return 'active';
  return 'inactive';
}

function isAccessActive(status) {
  return status === 'active';
}

function isAccessRisk(status) {
  return status === 'past_due';
}

function buildBilling(normalized, plan) {
  return {
    provider: 'hotmart',
    status: normalized.status,
    planSlug: plan.planSlug || null,
    billingCycle: plan.billingCycle || null,
    hotmartSubscriberCode: normalized.subscriberCode || null,
    hotmartTransaction: normalized.transaction || null,
    hotmartProductId: normalized.productId || null,
    hotmartOfferId: normalized.offerId || null,
    buyerEmail: normalized.buyerEmail || null,
    trialDays: typeof plan.trialDays === 'number' ? plan.trialDays : null,
    updatedAt: FieldValue.serverTimestamp()
  };
}

function buildSubscription(normalized, plan, exists) {
  const data = {
    buyerEmail: normalized.buyerEmail || null,
    buyerName: normalized.buyerName || null,
    productId: normalized.productId || null,
    offerId: normalized.offerId || null,
    transaction: normalized.transaction || null,
    planSlug: plan.planSlug || null,
    billingCycle: plan.billingCycle || null,
    trialDays: typeof plan.trialDays === 'number' ? plan.trialDays : null,
    status: normalized.status,
    subscriptionStatus: normalized.subscriptionStatus || null,
    provider: 'hotmart',
    updatedAt: FieldValue.serverTimestamp()
  };
  if (!exists) data.createdAt = FieldValue.serverTimestamp();
  return data;
}

function buildEventDoc(normalized, rawBodyText, plan, tenantFound) {
  return {
    provider: 'hotmart',
    eventType: normalized.eventType || null,
    buyerEmail: normalized.buyerEmail || null,
    buyerName: normalized.buyerName || null,
    productId: normalized.productId || null,
    offerId: normalized.offerId || null,
    transaction: normalized.transaction || null,
    subscriberCode: normalized.subscriberCode || null,
    purchaseStatus: normalized.purchaseStatus || null,
    subscriptionStatus: normalized.subscriptionStatus || null,
    status: normalized.status,
    eventDate: normalized.eventDate,
    amount: normalized.amount,
    currency: normalized.currency || null,
    planSlug: plan.planSlug || null,
    billingCycle: plan.billingCycle || null,
    tenantFound: !!tenantFound,
    rawBodyText: rawBodyText || '',
    rawPayload: normalized.rawPayload,
    createdAt: FieldValue.serverTimestamp()
  };
}

async function findTenantByEmail(transaction, email) {
  if (!email) return null;
  const candidates = [
    ['emailNormalized', email],
    ['emailLower', email],
    ['email', email],
    ['buyerEmail', email]
  ];

  for (const pair of candidates) {
    const snap = await transaction.get(
      db.collection('system_tenants').where(pair[0], '==', pair[1]).limit(1)
    );
    if (!snap.empty) return snap.docs[0];
  }
  return null;
}

function resolvePlan(mapping, offerId) {
  const offers = mapping && mapping.offers && typeof mapping.offers === 'object' ? mapping.offers : {};
  if (offerId && offers[offerId]) return offers[offerId] || {};
  return {};
}

function missingHotmartToken() {
  return !process.env.HOTMART_HOTTOK;
}

exports.hotmartWebhook = onRequest({ region: 'us-central1' }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const receivedHottok = compact(req.get('X-HOTMART-HOTTOK'));
  const expectedHottok = compact(process.env.HOTMART_HOTTOK);

  if (!expectedHottok || receivedHottok !== expectedHottok) {
    logger.warn('Hotmart webhook rejected: invalid hottok', {
      hasExpectedHottok: !!expectedHottok,
      hasReceivedHottok: !!receivedHottok
    });
    res.status(401).json({ ok: false, error: missingHotmartToken() ? 'hottok_not_configured' : 'invalid_hottok' });
    return;
  }

  const payload = req.body && typeof req.body === 'object' ? req.body : {};
  const rawBodyText = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(payload);
  const normalized = normalizeHotmartPayload(payload);

  logger.info('Hotmart event received', {
    eventType: normalized.eventType,
    eventId: normalized.eventId,
    buyerEmail: normalized.buyerEmail,
    transaction: normalized.transaction,
    subscriberCode: normalized.subscriberCode,
    offerId: normalized.offerId,
    status: normalized.status
  });

  try {
    const result = await db.runTransaction(async (transaction) => {
      const eventRef = db.collection('hotmart_events').doc(normalized.eventId);
      const mappingRef = db.collection('billing_plan_mappings').doc('hotmart');
      const eventSnap = await transaction.get(eventRef);
      const mappingSnap = await transaction.get(mappingRef);

      if (eventSnap.exists) {
        logger.info('Hotmart duplicated event ignored', {
          eventId: normalized.eventId,
          transaction: normalized.transaction,
          subscriberCode: normalized.subscriberCode
        });
        return { duplicate: true, eventId: normalized.eventId };
      }

      if (!mappingSnap.exists) {
        transaction.set(mappingRef, Object.assign({
          provider: 'hotmart',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        }, DEFAULT_HOTMART_MAPPING), { merge: true });
      }

      const mapping = mappingSnap.exists ? (mappingSnap.data() || {}) : DEFAULT_HOTMART_MAPPING;
      const plan = resolvePlan(mapping, normalized.offerId);
      if (!plan.planSlug) {
        logger.warn('Hotmart plan not mapped', {
          offerId: normalized.offerId,
          productId: normalized.productId,
          eventId: normalized.eventId
        });
      }

      const subscriptionId = safeDocId(normalized.subscriberCode || normalized.transaction || normalized.buyerEmail || normalized.eventId);
      const subscriptionRef = db.collection('hotmart_subscriptions').doc(subscriptionId);
      const subscriptionSnap = await transaction.get(subscriptionRef);
      const tenantSnap = await findTenantByEmail(transaction, normalized.buyerEmail);
      const tenantFound = !!tenantSnap;

      transaction.set(eventRef, buildEventDoc(normalized, rawBodyText, plan, tenantFound));
      transaction.set(subscriptionRef, buildSubscription(normalized, plan, subscriptionSnap.exists), { merge: true });

      if (tenantSnap) {
        logger.info('Hotmart tenant found', {
          uid: tenantSnap.id,
          buyerEmail: normalized.buyerEmail,
          status: normalized.status,
          planSlug: plan.planSlug || null
        });
        transaction.set(tenantSnap.ref, {
          billing: buildBilling(normalized, plan),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      } else if (normalized.buyerEmail) {
        logger.info('Hotmart tenant not found, creating pending access', {
          buyerEmail: normalized.buyerEmail,
          status: normalized.status,
          planSlug: plan.planSlug || null
        });
        transaction.set(db.collection('pending_hotmart_access').doc(safeDocId(normalized.buyerEmail)), {
          buyerEmail: normalized.buyerEmail,
          buyerName: normalized.buyerName || null,
          provider: 'hotmart',
          billing: buildBilling(normalized, plan),
          status: isAccessActive(normalized.status) ? 'pending_active_access' : (isAccessRisk(normalized.status) ? 'pending_risk_access' : 'pending_inactive_access'),
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp()
        }, { merge: true });
      } else {
        logger.warn('Hotmart event without buyer email', {
          eventId: normalized.eventId,
          transaction: normalized.transaction,
          subscriberCode: normalized.subscriberCode
        });
      }

      return {
        duplicate: false,
        eventId: normalized.eventId,
        tenantFound,
        status: normalized.status,
        planSlug: plan.planSlug || null
      };
    });

    res.status(200).json({ ok: true, received: true, duplicate: !!result.duplicate, eventId: result.eventId });
  } catch (err) {
    logger.error('Hotmart webhook failed', {
      error: err && err.message ? err.message : err,
      eventId: normalized.eventId,
      transaction: normalized.transaction,
      subscriberCode: normalized.subscriberCode
    });
    res.status(500).json({ ok: false, error: 'internal_error' });
  }
});
