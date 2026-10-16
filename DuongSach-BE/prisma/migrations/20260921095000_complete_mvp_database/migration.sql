-- Complete MVP database: Booth Visit reward flow, activity QR attendance,
-- request aggregates for change/cancellation, and integrity constraints.
-- This migration is additive and preserves legacy data.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'withdrawn';

-- 1. QR belongs to the Activity / BoothAssignment, not a personal registration.
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS qr_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS qr_revoked_at timestamptz;
UPDATE activities SET qr_token = gen_random_uuid() WHERE qr_token IS NULL;
ALTER TABLE activities ALTER COLUMN qr_token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_activities_qr_token ON activities(qr_token);

ALTER TABLE booth_assignments
  ADD COLUMN IF NOT EXISTS source_hold_id uuid,
  ADD COLUMN IF NOT EXISTS qr_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS qr_revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS period tstzrange;
UPDATE booth_assignments a
SET period = tstzrange(e.start_at, e.end_at, '[)')
FROM events e
WHERE a.event_id = e.id AND a.period IS NULL;
UPDATE booth_assignments SET qr_token = gen_random_uuid() WHERE qr_token IS NULL;
ALTER TABLE booth_assignments ALTER COLUMN qr_token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_booth_assignments_qr_token ON booth_assignments(qr_token);

ALTER TABLE booth_holds
  ADD COLUMN IF NOT EXISTS status booth_req_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS period tstzrange;
UPDATE booth_holds h
SET period = tstzrange(e.start_at, e.end_at, '[)')
FROM events e
WHERE h.event_id = e.id AND h.period IS NULL;

-- One physical booth cannot have conflicting active holds or assignments.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booth_holds_active_no_overlap') THEN
    ALTER TABLE booth_holds ADD CONSTRAINT booth_holds_active_no_overlap
      EXCLUDE USING gist (booth_id WITH =, period WITH &&)
      WHERE (released_at IS NULL AND status = 'pending');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booth_assignments_active_no_overlap_v2') THEN
    ALTER TABLE booth_assignments ADD CONSTRAINT booth_assignments_active_no_overlap_v2
      EXCLUDE USING gist (booth_id WITH =, period WITH &&)
      WHERE (status = 'active');
  END IF;
END $$;

-- 2. Separate Booth Change and Booth Cancellation aggregates.
CREATE TABLE IF NOT EXISTS booth_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_assignment_id uuid NOT NULL REFERENCES booth_assignments(id),
  target_booth_id uuid NOT NULL REFERENCES booths(id),
  replacement_hold_id uuid UNIQUE REFERENCES booth_holds(id),
  result_assignment_id uuid UNIQUE REFERENCES booth_assignments(id),
  requested_by uuid NOT NULL REFERENCES users(id),
  reviewed_by uuid REFERENCES users(id),
  reason text NOT NULL,
  status booth_req_status NOT NULL DEFAULT 'pending',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE booth_assignments
  ADD CONSTRAINT fk_booth_assignment_source_hold
  FOREIGN KEY (source_hold_id) REFERENCES booth_holds(id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_booth_change_per_assignment
  ON booth_change_requests(current_assignment_id)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS booth_cancellation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES booth_assignments(id),
  requested_by uuid NOT NULL REFERENCES users(id),
  reviewed_by uuid REFERENCES users(id),
  reason text NOT NULL,
  is_late boolean NOT NULL DEFAULT false,
  status request_status NOT NULL DEFAULT 'pending',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Link every ActivityRegistration to the EventRegistration that owns it.
ALTER TABLE activity_registrations ADD COLUMN IF NOT EXISTS event_registration_id uuid;
INSERT INTO event_registrations (id, event_id, user_id, joined_at, auto_created)
SELECT gen_random_uuid(), a.event_id, ar.user_id, ar.registered_at, true
FROM activity_registrations ar
JOIN activities a ON a.id = ar.activity_id
LEFT JOIN event_registrations er ON er.event_id = a.event_id AND er.user_id = ar.user_id
WHERE er.id IS NULL
ON CONFLICT (event_id, user_id) DO NOTHING;
UPDATE activity_registrations ar
SET event_registration_id = er.id
FROM activities a, event_registrations er
WHERE ar.activity_id = a.id
  AND er.event_id = a.event_id
  AND er.user_id = ar.user_id
  AND ar.event_registration_id IS NULL;
ALTER TABLE activity_registrations
  ADD CONSTRAINT fk_activity_registration_event_registration
  FOREIGN KEY (event_registration_id) REFERENCES event_registrations(id);
CREATE INDEX IF NOT EXISTS idx_activity_registration_event_registration
  ON activity_registrations(event_registration_id);

-- 4. Correct attendance record for the self-scan Activity QR flow.
CREATE TABLE IF NOT EXISTS attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL UNIQUE REFERENCES activity_registrations(id),
  activity_id uuid NOT NULL REFERENCES activities(id),
  user_id uuid NOT NULL REFERENCES users(id),
  attended_at timestamptz NOT NULL DEFAULT now(),
  is_override boolean NOT NULL DEFAULT false,
  overridden_by uuid REFERENCES users(id),
  override_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_override_reason_check CHECK (
    (is_override = false) OR (overridden_by IS NOT NULL AND override_reason IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_attendances_activity_user ON attendances(activity_id, user_id);

-- Preserve completed legacy attendance as the initial migration source.
INSERT INTO attendances (registration_id, activity_id, user_id, attended_at, is_override, overridden_by, override_reason)
SELECT s.registration_id, s.activity_id, s.user_id, COALESCE(s.check_out_at, s.check_in_at), s.is_override, s.override_by, s.override_reason
FROM attendance_sessions s
WHERE s.state = 'checked_out'
ON CONFLICT (registration_id) DO NOTHING;

-- 5. Booth QR visit is the only source of PointTransaction in the MVP.
CREATE TABLE IF NOT EXISTS booth_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_registration_id uuid NOT NULL REFERENCES event_registrations(id),
  booth_assignment_id uuid NOT NULL REFERENCES booth_assignments(id),
  user_id uuid NOT NULL REFERENCES users(id),
  visited_at timestamptz NOT NULL DEFAULT now(),
  scan_token_hash text,
  CONSTRAINT uq_booth_visit_per_registration_assignment UNIQUE(event_registration_id, booth_assignment_id)
);
CREATE INDEX IF NOT EXISTS idx_booth_visits_assignment ON booth_visits(booth_assignment_id, visited_at DESC);

ALTER TABLE point_transactions ADD COLUMN IF NOT EXISTS booth_visit_id uuid;
ALTER TABLE point_transactions
  ADD CONSTRAINT fk_point_transaction_booth_visit
  FOREIGN KEY (booth_visit_id) REFERENCES booth_visits(id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_point_transaction_per_booth_visit
  ON point_transactions(booth_visit_id) WHERE booth_visit_id IS NOT NULL;

-- 6. Certificates must be traceable to a valid Attendance.
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS attendance_id uuid;
ALTER TABLE certificates
  ADD CONSTRAINT fk_certificate_attendance
  FOREIGN KEY (attendance_id) REFERENCES attendances(id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_certificate_attendance
  ON certificates(attendance_id) WHERE attendance_id IS NOT NULL;
UPDATE certificates c SET attendance_id = a.id
FROM attendances a
WHERE c.registration_id = a.registration_id AND c.attendance_id IS NULL;

-- 7. Complete audit attributes and FKs on partner/activity change workflows.
ALTER TABLE partner_withdrawals
  ADD COLUMN IF NOT EXISTS application_id uuid,
  ADD COLUMN IF NOT EXISTS requested_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS review_note text;
UPDATE partner_withdrawals w SET application_id = pa.id
FROM partner_applications pa
WHERE pa.event_id = w.event_id AND pa.organization_id = w.organization_id AND w.application_id IS NULL;
ALTER TABLE partner_withdrawals
  ADD CONSTRAINT fk_partner_withdrawal_application FOREIGN KEY (application_id) REFERENCES partner_applications(id),
  ADD CONSTRAINT fk_partner_withdrawal_requested_by FOREIGN KEY (requested_by) REFERENCES users(id),
  ADD CONSTRAINT fk_partner_withdrawal_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_change_requests' AND column_name='target_location')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_change_requests' AND column_name='target_location_id') THEN
    ALTER TABLE activity_change_requests RENAME COLUMN target_location TO target_location_id;
  END IF;
END $$;
ALTER TABLE activity_change_requests
  ADD COLUMN IF NOT EXISTS requested_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE activity_change_requests
  ADD CONSTRAINT fk_activity_change_target_location FOREIGN KEY (target_location_id) REFERENCES locations(id),
  ADD CONSTRAINT fk_activity_change_requested_by FOREIGN KEY (requested_by) REFERENCES users(id),
  ADD CONSTRAINT fk_activity_change_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id);

ALTER TABLE activity_cancellation_requests
  ADD COLUMN IF NOT EXISTS requested_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE activity_cancellation_requests
  ADD CONSTRAINT fk_activity_cancel_requested_by FOREIGN KEY (requested_by) REFERENCES users(id),
  ADD CONSTRAINT fk_activity_cancel_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id);

ALTER TABLE activity_reviews
  ADD CONSTRAINT fk_activity_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id);

-- Database-level checks shared by all writers.
ALTER TABLE activities ADD CONSTRAINT activities_valid_time CHECK (start_at < end_at);
ALTER TABLE activity_proposals ADD CONSTRAINT proposals_valid_time CHECK (start_at < end_at);
ALTER TABLE activity_ratings ADD CONSTRAINT activity_rating_range CHECK (rating BETWEEN 1 AND 5);
