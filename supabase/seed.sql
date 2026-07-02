-- UniWai CRM — seed data for local development
-- Runs after migrations on `supabase db reset`.

-- Bootstrap plans catalog (global, not tenant-scoped).
CREATE TABLE IF NOT EXISTS public.plans (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text NOT NULL UNIQUE,
  name                  text NOT NULL,
  price_usd_monthly     numeric(10, 2),
  price_label           text,
  limits                jsonb NOT NULL DEFAULT '{}'::jsonb,
  marketing_enabled     boolean NOT NULL DEFAULT false,
  is_active             boolean NOT NULL DEFAULT true,
  sort_order            int NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.plans IS 'SaaS plan tiers; limits enforced by api-core middleware.';

INSERT INTO public.plans (
  slug,
  name,
  price_usd_monthly,
  price_label,
  marketing_enabled,
  sort_order,
  limits
) VALUES
  (
    'basico',
    'Básico',
    9.99,
    NULL,
    false,
    10,
    '{
      "maxBots": 1,
      "maxFlows": 5,
      "marketingEnabled": false,
      "marketingMaxPerCampaign": {},
      "maxVendedores": 0
    }'::jsonb
  ),
  (
    'lite',
    'Lite',
    14.99,
    NULL,
    true,
    20,
    '{
      "maxBots": 2,
      "maxFlows": 10,
      "marketingEnabled": true,
      "marketingMaxPerCampaign": {
        "BAILEYS_QR": 499,
        "META_CLOUD_API": 1000
      },
      "maxVendedores": 0
    }'::jsonb
  ),
  (
    'pro',
    'Pro',
    24.99,
    NULL,
    true,
    30,
    '{
      "maxBots": 5,
      "maxFlows": 20,
      "marketingEnabled": true,
      "marketingMaxPerCampaign": {
        "BAILEYS_QR": 499,
        "META_CLOUD_API": 2000
      },
      "maxVendedores": 0
    }'::jsonb
  ),
  (
    'enterprise',
    'Enterprise',
    39.99,
    NULL,
    true,
    40,
    '{
      "maxBots": 10,
      "maxFlows": 40,
      "marketingEnabled": true,
      "marketingMaxPerCampaign": {
        "BAILEYS_QR": 499,
        "META_CLOUD_API": 3000
      },
      "maxVendedores": 0
    }'::jsonb
  ),
  (
    'custom',
    'Custom',
    NULL,
    'Contact us',
    true,
    50,
    '{
      "maxBots": null,
      "maxFlows": null,
      "marketingEnabled": true,
      "marketingMaxPerCampaign": {
        "BAILEYS_QR": 499,
        "META_CLOUD_API": 1000
      },
      "maxVendedores": null,
      "negotiable": true
    }'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_usd_monthly = EXCLUDED.price_usd_monthly,
  price_label = EXCLUDED.price_label,
  marketing_enabled = EXCLUDED.marketing_enabled,
  sort_order = EXCLUDED.sort_order,
  limits = EXCLUDED.limits,
  updated_at = now();
