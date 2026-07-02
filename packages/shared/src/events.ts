/**
 * Nombres de eventos del Event Bus (Redis Streams / BullMQ).
 * Stub para desacoplamiento CQRS — payloads tipados en fases posteriores.
 */

export const DomainEvent = {
  // Mensajería / chat
  MessageReceived: "MessageReceived",
  MessageSent: "MessageSent",
  MessageDelivered: "MessageDelivered",
  MessageRead: "MessageRead",

  // Órdenes / e-commerce
  OrderCreated: "OrderCreated",
  OrderUpdated: "OrderUpdated",
  OrderConfirmed: "OrderConfirmed",
  OrderPaid: "OrderPaid",
  OrderCancelled: "OrderCancelled",

  // CRM / prospectos
  ContactCreated: "ContactCreated",
  ContactUpdated: "ContactUpdated",
  ProspectStageChanged: "ProspectStageChanged",
  HumanHandoffRequested: "HumanHandoffRequested",
  BotToggledForContact: "BotToggledForContact",

  // Bots y flujos
  FlowStarted: "FlowStarted",
  FlowNodeExecuted: "FlowNodeExecuted",
  FlowCompleted: "FlowCompleted",
  FlowPaused: "FlowPaused",

  // WhatsApp / instancias
  WhatsAppInstanceConnected: "WhatsAppInstanceConnected",
  WhatsAppInstanceDisconnected: "WhatsAppInstanceDisconnected",
  WhatsAppInstanceBanned: "WhatsAppInstanceBanned",
  WhatsAppQrGenerated: "WhatsAppQrGenerated",

  // Marketing
  CampaignCreated: "CampaignCreated",
  CampaignStarted: "CampaignStarted",
  CampaignCompleted: "CampaignCompleted",
  CampaignFailed: "CampaignFailed",

  // Billing / tenant
  SubscriptionCreated: "SubscriptionCreated",
  SubscriptionRenewed: "SubscriptionRenewed",
  SubscriptionCancelled: "SubscriptionCancelled",
  TenantSuspended: "TenantSuspended",
  TenantBanned: "TenantBanned",

  // Alertas OWNER
  PurchaseAlert: "PurchaseAlert",
  HotProspectAlert: "HotProspectAlert",
  WhatsAppInstanceErrorAlert: "WhatsAppInstanceErrorAlert",

  // Warmup P2P
  WarmupMessageScheduled: "WarmupMessageScheduled",
  WarmupMessageSent: "WarmupMessageSent",
} as const;

export type DomainEventName = (typeof DomainEvent)[keyof typeof DomainEvent];

/** Colas BullMQ conocidas (workers). */
export const BullQueue = {
  MESSAGES: "messages",
  CAMPAIGNS: "campaigns",
  WARMUP: "warmup",
  EVENTS: "events",
  REPORTS: "reports",
} as const;

export type BullQueueName = (typeof BullQueue)[keyof typeof BullQueue];
