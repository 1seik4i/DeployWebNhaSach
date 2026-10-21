CREATE TABLE "guest_submission_sessions" (
  "id" UUID NOT NULL,
  "feedback_count" INTEGER NOT NULL DEFAULT 0,
  "proposal_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "guest_submission_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "guest_feedback_count_range" CHECK ("feedback_count" BETWEEN 0 AND 3),
  CONSTRAINT "guest_proposal_count_range" CHECK ("proposal_count" BETWEEN 0 AND 3)
);
