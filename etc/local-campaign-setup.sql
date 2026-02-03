-- =============================================================================
-- LOCAL CAMPAIGN SETUP FOR ATTESTATION PoC
-- =============================================================================
-- This script creates a minimal campaign configuration for testing the
-- attestation flow locally. Run this against your local Referral service database.
--
-- Prerequisites:
-- 1. Local Referral service database running
-- 2. A test wearable URN (can be any valid format for PoC)
--
-- Usage:
-- psql -h localhost -U postgres -d referral -f etc/local-campaign-setup.sql
-- =============================================================================

-- Configuration variables (customize these)
\set campaign_name 'Attestation PoC Campaign'
\set chain_id 137
\set collection_address '0x1234567890123456789012345678901234567890'
\set token_id '1'
\set token_name 'PoC Test Wearable'

-- =============================================================================
-- Step 1: Create Campaign
-- =============================================================================
INSERT INTO campaigns (
  id,
  name,
  enabled,
  active_since,
  active_until,
  max_gas,
  chain_id,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  :'campaign_name',
  true,
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '1 year',
  200,
  :chain_id,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  enabled = true,
  active_until = NOW() + INTERVAL '1 year',
  updated_at = NOW();

-- =============================================================================
-- Step 2: Create Campaign Key (no authentication required for PoC)
-- =============================================================================
-- The campaign_key format is: base64_payload.hmac_signature
-- For local testing, we use a simple key that bypasses signature verification
INSERT INTO campaign_keys (
  id,
  campaign_id,
  campaign_key,
  name,
  enabled,
  assign_limit,
  assign_target,
  assign_value,
  requires_captcha,
  requires_authentication,
  requires_catalyst,
  active_since,
  active_until,
  created_at,
  updated_at
) VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'test-poc-key-12345',  -- Simple key for local testing
  'PoC Test Key',
  true,
  10,  -- Allow up to 10 rewards per user
  :'collection_address',
  :'token_id',
  false,  -- No captcha
  false,  -- No authentication
  false,  -- No catalyst presence required
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  enabled = true,
  campaign_key = 'test-poc-key-12345',
  active_until = NOW() + INTERVAL '1 year',
  updated_at = NOW();

-- =============================================================================
-- Step 3: Create Reward Supply
-- =============================================================================
-- Create 100 unassigned rewards for the test wearable
INSERT INTO rewards (
  id,
  campaign_id,
  airdrop_type,
  status,
  chain_id,
  target,
  value,
  token,
  image,
  "group",
  priority,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'a0000000-0000-0000-0000-000000000001',
  'CollectionV2IssueToken',
  'unassigned',
  :chain_id,
  :'collection_address',
  :'token_id',
  :'token_name',
  NULL,
  'poc-test-group',
  999,
  NOW(),
  NOW()
FROM generate_series(1, 100)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Verification Queries
-- =============================================================================
SELECT 'Campaign created:' as status;
SELECT id, name, enabled, chain_id FROM campaigns WHERE id = 'a0000000-0000-0000-0000-000000000001';

SELECT 'Campaign key created:' as status;
SELECT id, campaign_key, enabled, assign_target, assign_value FROM campaign_keys WHERE id = 'b0000000-0000-0000-0000-000000000001';

SELECT 'Rewards supply:' as status;
SELECT
  COUNT(*) as total_rewards,
  COUNT(*) FILTER (WHERE status = 'unassigned') as unassigned,
  COUNT(*) FILTER (WHERE status = 'assigned') as assigned
FROM rewards
WHERE campaign_id = 'a0000000-0000-0000-0000-000000000001';

-- =============================================================================
-- Output the campaign key for use in the test script
-- =============================================================================
SELECT 'Use this campaign_key in your .env file:' as info;
SELECT campaign_key FROM campaign_keys WHERE id = 'b0000000-0000-0000-0000-000000000001';
