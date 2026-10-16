-- 110_booth_assignments.sql
-- Phân bổ gian hàng cho các đơn vị đối tác

INSERT INTO booth_assignments (id, booth_id, event_id, organization_id, status, assigned_at) VALUES
  ('e673369b-21b5-41c2-a023-3cd40ccc51be', 'c5966a62-03fe-4093-ae26-4faa7a102a8b', 'daa1f312-395e-43a2-a91c-00f3a3d50bbb', 'f4b638e5-2712-46b6-a6eb-ae50077cb0e3', 'active'::assignment_status, NOW() - INTERVAL '3 days'),
  ('cc8770d2-a9ae-4b1f-a9c1-a97f4f8c9b16', 'cff5ef63-f6a2-48a9-ae8e-e805566ea654', 'daa1f312-395e-43a2-a91c-00f3a3d50bbb', '099484c0-25dc-40ab-a189-91d8ab2005bd', 'active'::assignment_status, NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;
