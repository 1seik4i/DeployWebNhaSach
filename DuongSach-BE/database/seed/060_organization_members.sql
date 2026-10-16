-- 060_organization_members.sql
-- Gắn kết User Partner vào Organization

INSERT INTO organization_members (id, organization_id, user_id, role_in_org) VALUES
  ('672ecf8d-7b28-48d2-a485-4270de113b21', '099484c0-25dc-40ab-a189-91d8ab2005bd', 'a1997704-8ccd-4838-ab09-31be558bf632', 'owner'),
  ('763b90d3-bb82-48cd-a250-bee0724c5bc0', 'f4b638e5-2712-46b6-a6eb-ae50077cb0e3', 'bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb', 'owner')
ON CONFLICT (organization_id, user_id) DO NOTHING;
