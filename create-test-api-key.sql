-- Insert test API key if it doesn't exist
INSERT INTO api_keys (id, key, name, organization_id, user_id, permissions, rate_limit, is_active, created_at) 
VALUES (
  'test-key-id',
  'test-key-validation',
  'Test Validation Key',
  null,
  '42571909', 
  '{}',
  1000,
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;
