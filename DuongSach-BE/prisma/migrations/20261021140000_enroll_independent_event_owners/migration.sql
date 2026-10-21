-- Restore participation for independent partner events approved before automatic enrollment.
DO $$
DECLARE
  proposal RECORD;
  metadata JSONB;
BEGIN
  FOR proposal IN
    SELECT p.*, r.reviewer_id, r.created_at AS reviewed_at
    FROM activity_proposals p
    LEFT JOIN LATERAL (
      SELECT reviewer_id, created_at FROM activity_reviews
      WHERE proposal_id = p.id AND action = 'approve'
      ORDER BY created_at DESC LIMIT 1
    ) r ON TRUE
    WHERE p.status = 'approved'
  LOOP
    BEGIN
      metadata := proposal.management_notes::jsonb;
    EXCEPTION WHEN invalid_text_representation THEN
      CONTINUE;
    END;
    IF metadata->>'standaloneEvent' = 'true' THEN
      INSERT INTO partner_applications
        (event_id, organization_id, status, submitted_at, reviewed_at, reviewed_by)
      VALUES
        (proposal.event_id, proposal.organization_id, 'approved', proposal.submitted_at,
         COALESCE(proposal.reviewed_at, proposal.updated_at), proposal.reviewer_id)
      ON CONFLICT (event_id, organization_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;
