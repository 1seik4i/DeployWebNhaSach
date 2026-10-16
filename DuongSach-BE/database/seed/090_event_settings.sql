-- 090_event_settings.sql
-- Cấu hình thời hạn, sức chứa, min attendance cho sự kiện

INSERT INTO event_settings (event_id, partner_apply_deadline, booth_request_deadline, proposal_deadline, participant_reg_deadline, min_attendance_minutes, points_per_attendance) VALUES
  ('daa1f312-395e-43a2-a91c-00f3a3d50bbb', NOW() + INTERVAL '10 days', NOW() + INTERVAL '12 days', NOW() + INTERVAL '14 days', NOW() + INTERVAL '20 days', 20, 30),
  ('7e579f11-c470-4788-a0ef-3cc29525e16e', NOW() + INTERVAL '8 days', NOW() + INTERVAL '9 days', NOW() + INTERVAL '10 days', NOW() + INTERVAL '15 days', 20, 10)
ON CONFLICT (event_id) DO NOTHING;
