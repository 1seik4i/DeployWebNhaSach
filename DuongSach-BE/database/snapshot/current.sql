--
-- PostgreSQL database dump
--

\restrict h6TZnf1Ia2ocs5tr0HP666EZDBMrw8ST0mhuWYrNclHYDl8PjQBMZmh02MDhVap

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: account_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.account_status AS ENUM (
    'active',
    'locked',
    'pending_verification'
);


--
-- Name: activity_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activity_kind AS ENUM (
    'talkshow',
    'workshop',
    'launch',
    'exhibition',
    'minigame',
    'signing'
);


--
-- Name: activity_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activity_status AS ENUM (
    'draft',
    'approved',
    'published',
    'ongoing',
    'completed',
    'cancelled'
);


--
-- Name: assignment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.assignment_status AS ENUM (
    'active',
    'released'
);


--
-- Name: attendance_state; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendance_state AS ENUM (
    'checked_in',
    'checked_out',
    'invalidated'
);


--
-- Name: booth_op_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booth_op_status AS ENUM (
    'operational',
    'unavailable'
);


--
-- Name: booth_req_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booth_req_kind AS ENUM (
    'new',
    'change',
    'cancellation'
);


--
-- Name: booth_req_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booth_req_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'withdrawn',
    'expired',
    'cancelled'
);


--
-- Name: event_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_priority AS ENUM (
    'high',
    'medium',
    'regular'
);


--
-- Name: event_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_status AS ENUM (
    'draft',
    'published',
    'ongoing',
    'completed',
    'cancelled'
);


--
-- Name: feedback_scope; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.feedback_scope AS ENUM (
    'entire',
    'heritage',
    'booth',
    'facility'
);


--
-- Name: feedback_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.feedback_source AS ENUM (
    'qr_general',
    'qr_heritage',
    'web_landing'
);


--
-- Name: feedback_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.feedback_status AS ENUM (
    'new',
    'in_progress',
    'responded',
    'closed'
);


--
-- Name: heritage_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.heritage_status AS ENUM (
    'published',
    'draft',
    'hidden'
);


--
-- Name: location_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.location_kind AS ENUM (
    'booth',
    'main_stage',
    'workshop_area',
    'reading_area',
    'other'
);


--
-- Name: notification_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_kind AS ENUM (
    'event',
    'activity',
    'booth',
    'system',
    'reminder',
    'security',
    'account',
    'role'
);


--
-- Name: partner_app_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.partner_app_status AS ENUM (
    'draft',
    'submitted',
    'approved',
    'rejected',
    'need_changes',
    'withdrawn'
);


--
-- Name: proposal_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.proposal_status AS ENUM (
    'pending',
    'approved',
    'need_revision',
    'rejected',
    'withdrawn'
);


--
-- Name: qr_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.qr_status AS ENUM (
    'active',
    'generating',
    'inactive'
);


--
-- Name: registration_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.registration_status AS ENUM (
    'registered',
    'cancelled',
    'attended',
    'no_show'
);


--
-- Name: request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.request_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled',
    'withdrawn'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'partner',
    'admin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    proposal_id uuid,
    organization_id uuid,
    title character varying(200) NOT NULL,
    title_en character varying(200),
    kind public.activity_kind NOT NULL,
    location_id uuid NOT NULL,
    start_at timestamp(6) with time zone NOT NULL,
    end_at timestamp(6) with time zone NOT NULL,
    capacity integer NOT NULL,
    registered_count integer DEFAULT 0 NOT NULL,
    status public.activity_status DEFAULT 'approved'::public.activity_status NOT NULL,
    has_certificate boolean DEFAULT false NOT NULL,
    published_at timestamp(6) with time zone,
    cancelled_at timestamp(6) with time zone,
    cancel_reason text,
    description text,
    speaker character varying(160),
    image_url text,
    qr_token uuid DEFAULT gen_random_uuid(),
    qr_revoked_at timestamp(6) with time zone,
    created_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: activity_cancellation_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_cancellation_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    reason text NOT NULL,
    is_late boolean DEFAULT false NOT NULL,
    status public.request_status DEFAULT 'pending'::public.request_status NOT NULL,
    review_note text,
    requested_by uuid,
    reviewed_by uuid,
    reviewed_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: activity_change_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_change_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    target_location_id uuid,
    new_start_at timestamp(6) with time zone,
    new_end_at timestamp(6) with time zone,
    reason text NOT NULL,
    status public.request_status DEFAULT 'pending'::public.request_status NOT NULL,
    review_note text,
    requested_by uuid,
    reviewed_by uuid,
    reviewed_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: activity_proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    title_en character varying(200),
    kind public.activity_kind NOT NULL,
    location_id uuid NOT NULL,
    start_at timestamp(6) with time zone NOT NULL,
    end_at timestamp(6) with time zone NOT NULL,
    capacity integer NOT NULL,
    priority_level public.event_priority DEFAULT 'regular'::public.event_priority NOT NULL,
    target_audience text,
    description text,
    speaker character varying(160),
    contact_person character varying(160),
    contact_phone character varying(20),
    status public.proposal_status DEFAULT 'pending'::public.proposal_status NOT NULL,
    management_notes text,
    published_activity_id uuid,
    submitted_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: activity_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    user_id uuid NOT NULL,
    registration_id uuid NOT NULL,
    rating smallint NOT NULL,
    comment text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: activity_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    user_id uuid NOT NULL,
    event_registration_id uuid,
    status public.registration_status DEFAULT 'registered'::public.registration_status NOT NULL,
    registration_code character varying(24) NOT NULL,
    qr_token uuid DEFAULT gen_random_uuid() NOT NULL,
    qr_revoked_at timestamp(6) with time zone,
    registered_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cancelled_at timestamp(6) with time zone,
    cancel_reason text,
    is_late boolean DEFAULT false NOT NULL,
    points_awarded boolean DEFAULT false NOT NULL,
    certificate_issued boolean DEFAULT false NOT NULL
);


--
-- Name: activity_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    proposal_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    action character varying(50) NOT NULL,
    note text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(120) NOT NULL,
    total_quantity integer DEFAULT 0 NOT NULL,
    description text,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp(6) with time zone,
    deleted_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: attendance_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registration_id uuid NOT NULL,
    user_id uuid NOT NULL,
    activity_id uuid NOT NULL,
    check_in_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    check_out_at timestamp(6) with time zone,
    duration_minutes integer,
    state public.attendance_state DEFAULT 'checked_in'::public.attendance_state NOT NULL,
    scanned_by uuid,
    is_override boolean DEFAULT false NOT NULL,
    override_by uuid,
    override_reason text
);


--
-- Name: attendances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registration_id uuid NOT NULL,
    activity_id uuid NOT NULL,
    user_id uuid NOT NULL,
    attended_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_override boolean DEFAULT false NOT NULL,
    overridden_by uuid,
    override_reason text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_id uuid,
    actor_role public.user_role,
    action character varying(60) NOT NULL,
    target_type character varying(60) NOT NULL,
    target_id uuid,
    target_title text,
    before_data jsonb,
    after_data jsonb,
    reason text,
    ip_address text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: badge_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badge_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    title character varying(120) NOT NULL,
    description text,
    icon_name character varying(50) NOT NULL,
    min_points integer NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: book_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_categories (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    name_en text,
    status text DEFAULT 'active'::text NOT NULL,
    CONSTRAINT book_categories_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])))
);


--
-- Name: book_label_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_label_assignments (
    book_id uuid NOT NULL,
    label_id uuid NOT NULL
);


--
-- Name: book_labels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_labels (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    CONSTRAINT book_labels_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])))
);


--
-- Name: book_rankings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_rankings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    book_id uuid NOT NULL,
    ranking_type character varying(32) NOT NULL,
    rank integer NOT NULL,
    updated_by uuid,
    updated_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    CONSTRAINT book_rankings_rank_check CHECK (((rank >= 1) AND (rank <= 100))),
    CONSTRAINT book_rankings_type_check CHECK (((ranking_type)::text = ANY ((ARRAY['bestseller'::character varying, 'weekly_hot'::character varying])::text[])))
);


--
-- Name: book_sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_sales (
    id uuid NOT NULL,
    book_id uuid NOT NULL,
    booth_id uuid NOT NULL,
    quantity integer NOT NULL,
    sold_date date NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT book_sales_quantity_check CHECK ((quantity >= 0))
);


--
-- Name: book_stalls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_stalls (
    id uuid NOT NULL,
    book_id uuid NOT NULL,
    stall_id uuid NOT NULL,
    inventory_quantity integer DEFAULT 0 NOT NULL,
    sold_quantity integer,
    version integer DEFAULT 1 NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT book_stalls_quantity_check CHECK (((inventory_quantity >= 0) AND ((sold_quantity IS NULL) OR (sold_quantity >= 0)))),
    CONSTRAINT book_stalls_version_check CHECK ((version > 0))
);


--
-- Name: book_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.book_submissions (
    id uuid NOT NULL,
    book_id uuid,
    stall_id uuid NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    submitted_by uuid NOT NULL,
    submitted_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp(6) with time zone,
    rejection_reason text,
    proposed_data jsonb NOT NULL,
    current_approved_data jsonb,
    book_version integer,
    inventory_quantity integer DEFAULT 0 NOT NULL,
    sold_quantity integer,
    CONSTRAINT book_submissions_quantity_check CHECK (((inventory_quantity >= 0) AND ((sold_quantity IS NULL) OR (sold_quantity >= 0)))),
    CONSTRAINT book_submissions_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text]))),
    CONSTRAINT book_submissions_type_check CHECK ((type = ANY (ARRAY['CREATE'::text, 'UPDATE'::text])))
);


--
-- Name: books; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.books (
    id uuid NOT NULL,
    isbn character varying(32) NOT NULL,
    title character varying(200) NOT NULL,
    title_en text,
    author character varying(200) NOT NULL,
    publisher text,
    cover_url text NOT NULL,
    description text,
    publication_year integer,
    category_id uuid,
    status text DEFAULT 'active'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT books_status_check CHECK ((status = ANY (ARRAY['active'::text, 'draft'::text, 'archived'::text]))),
    CONSTRAINT books_version_check CHECK ((version > 0))
);


--
-- Name: booth_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booth_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booth_id uuid NOT NULL,
    event_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    status public.assignment_status DEFAULT 'active'::public.assignment_status NOT NULL,
    assigned_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by uuid,
    released_at timestamp(6) with time zone,
    release_reason text,
    source_hold_id uuid,
    qr_token uuid DEFAULT gen_random_uuid(),
    qr_revoked_at timestamp(6) with time zone,
    period tstzrange
);


--
-- Name: booth_cancellation_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booth_cancellation_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    requested_by uuid NOT NULL,
    reviewed_by uuid,
    reason text NOT NULL,
    is_late boolean DEFAULT false NOT NULL,
    status public.request_status DEFAULT 'pending'::public.request_status NOT NULL,
    submitted_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_at timestamp(6) with time zone,
    review_note text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: booth_change_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booth_change_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    current_assignment_id uuid NOT NULL,
    target_booth_id uuid NOT NULL,
    replacement_hold_id uuid,
    result_assignment_id uuid,
    requested_by uuid NOT NULL,
    reviewed_by uuid,
    reason text NOT NULL,
    status public.booth_req_status DEFAULT 'pending'::public.booth_req_status NOT NULL,
    submitted_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_at timestamp(6) with time zone,
    review_note text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: booth_holds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booth_holds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booth_id uuid NOT NULL,
    event_id uuid NOT NULL,
    request_id uuid,
    status public.booth_req_status DEFAULT 'pending'::public.booth_req_status NOT NULL,
    period tstzrange,
    expires_at timestamp(6) with time zone NOT NULL,
    released_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: booth_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booth_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    booth_id uuid NOT NULL,
    kind public.booth_req_kind DEFAULT 'new'::public.booth_req_kind NOT NULL,
    replaces_assignment_id uuid,
    status public.booth_req_status DEFAULT 'pending'::public.booth_req_status NOT NULL,
    hold_id uuid,
    note text,
    is_late boolean DEFAULT false NOT NULL,
    submitted_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_at timestamp(6) with time zone,
    reviewed_by uuid,
    review_note text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: booth_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booth_visits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_registration_id uuid NOT NULL,
    booth_assignment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    visited_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    scan_token_hash text
);


--
-- Name: booths; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booths (
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    location_id uuid NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(160) NOT NULL,
    name_en character varying(160),
    publisher character varying(160),
    category character varying(40),
    area_name character varying(80),
    dimensions character varying(40),
    open_hours character varying(60),
    description text,
    description_en text,
    image_url text,
    image_alt text,
    image_source text,
    image_license text,
    op_status public.booth_op_status DEFAULT 'operational'::public.booth_op_status NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp(6) with time zone,
    deleted_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registration_id uuid NOT NULL,
    attendance_id uuid,
    user_id uuid NOT NULL,
    certificate_code character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    issued_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    preview_url text
);


--
-- Name: content_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_entries (
    id uuid NOT NULL,
    slug text NOT NULL,
    kind text NOT NULL,
    title text NOT NULL,
    data jsonb NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT content_entries_kind_check CHECK ((kind = ANY (ARRAY['journey'::text, 'organization'::text, 'news'::text, 'footer'::text]))),
    CONSTRAINT content_entries_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'hidden'::text])))
);


--
-- Name: event_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_locations (
    event_id uuid NOT NULL,
    location_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    left_at timestamp(6) with time zone,
    auto_created boolean DEFAULT false NOT NULL
);


--
-- Name: event_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_settings (
    event_id uuid NOT NULL,
    partner_apply_deadline timestamp(6) with time zone,
    booth_request_deadline timestamp(6) with time zone,
    booth_cancel_cutoff timestamp(6) with time zone,
    proposal_deadline timestamp(6) with time zone,
    participant_reg_deadline timestamp(6) with time zone,
    activity_cancel_cutoff timestamp(6) with time zone,
    max_booths_per_partner integer DEFAULT 1 NOT NULL,
    max_activities_per_partner integer DEFAULT 3 NOT NULL,
    booth_hold_minutes integer DEFAULT 60 NOT NULL,
    min_attendance_minutes integer DEFAULT 20 NOT NULL,
    points_per_attendance integer DEFAULT 10 NOT NULL
);


--
-- Name: event_suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_suggestions (
    id uuid NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    internal_note text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT event_suggestions_status_check CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'approved'::text, 'rejected'::text, 'closed'::text])))
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    visibility character varying(20) DEFAULT 'public'::character varying NOT NULL,
    public_until timestamp(6) with time zone,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(200) NOT NULL,
    title_en character varying(200),
    slug character varying(200) NOT NULL,
    theme character varying(200),
    venue_id uuid,
    start_at timestamp(6) with time zone NOT NULL,
    end_at timestamp(6) with time zone NOT NULL,
    status public.event_status DEFAULT 'draft'::public.event_status NOT NULL,
    priority_level public.event_priority DEFAULT 'regular'::public.event_priority NOT NULL,
    description text,
    summary text,
    summary_en text,
    cover_image_url text,
    published_at timestamp(6) with time zone,
    cancelled_at timestamp(6) with time zone,
    cancel_reason text,
    created_by uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT events_visibility_check CHECK (((visibility)::text = ANY ((ARRAY['public'::character varying, 'internal'::character varying])::text[])))
);


--
-- Name: feedbacks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedbacks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    target_scope public.feedback_scope DEFAULT 'entire'::public.feedback_scope NOT NULL,
    heritage_id uuid,
    booth_id uuid,
    target_name character varying(200),
    rating smallint NOT NULL,
    comments text,
    contact_email public.citext,
    source public.feedback_source DEFAULT 'web_landing'::public.feedback_source NOT NULL,
    status public.feedback_status DEFAULT 'new'::public.feedback_status NOT NULL,
    assigned_to uuid,
    internal_note text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    event_id uuid,
    full_name character varying(160)
);


--
-- Name: heritage_qr_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.heritage_qr_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    heritage_id uuid NOT NULL,
    qr_data text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: heritages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.heritages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(20),
    slug character varying(200) NOT NULL,
    name character varying(200) NOT NULL,
    name_en character varying(200),
    province character varying(120),
    province_en character varying(120),
    category character varying(120),
    category_en character varying(120),
    period character varying(120),
    period_en character varying(120),
    address text,
    address_en text,
    brief_desc text,
    brief_desc_en text,
    story text,
    story_en text,
    highlights jsonb DEFAULT '[]'::jsonb NOT NULL,
    highlights_en jsonb DEFAULT '[]'::jsonb NOT NULL,
    reference_source text,
    status public.heritage_status DEFAULT 'draft'::public.heritage_status NOT NULL,
    qr_status public.qr_status DEFAULT 'inactive'::public.qr_status NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    qr_scan_count integer DEFAULT 0 NOT NULL,
    image_url text,
    image_alt text,
    image_source text,
    image_license text,
    map_x numeric(6,2),
    map_y numeric(6,2),
    map_area_name character varying(120),
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp(6) with time zone,
    deleted_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venue_id uuid NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(160) NOT NULL,
    name_en character varying(160),
    kind public.location_kind NOT NULL,
    capacity integer DEFAULT 0 NOT NULL,
    zone character varying(40),
    map_x numeric(6,2),
    map_y numeric(6,2),
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: map_hotspots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.map_hotspots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(20) NOT NULL,
    title character varying(160) NOT NULL,
    title_en character varying(160),
    category character varying(40) NOT NULL,
    x numeric(6,2) NOT NULL,
    y numeric(6,2) NOT NULL,
    short_desc text,
    short_desc_en text,
    booth_id uuid,
    icon_type character varying(40),
    area character varying(80),
    dimensions character varying(40),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: news_article_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_article_reads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_entry_id uuid NOT NULL,
    article_id character varying(200) NOT NULL,
    session_id uuid NOT NULL,
    day date NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    kind public.notification_kind DEFAULT 'system'::public.notification_kind NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    link text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: organization_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role_in_org character varying(50) DEFAULT 'member'::character varying NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    short_desc text,
    logo_url text,
    representative_name character varying(160) NOT NULL,
    email public.citext NOT NULL,
    phone character varying(20) NOT NULL,
    address text,
    website text,
    categories text[] DEFAULT ARRAY[]::text[],
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL
);


--
-- Name: partner_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    status public.partner_app_status DEFAULT 'draft'::public.partner_app_status NOT NULL,
    step integer DEFAULT 1 NOT NULL,
    submitted_at timestamp(6) with time zone,
    reviewed_at timestamp(6) with time zone,
    reviewed_by uuid,
    review_note text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: partner_withdrawals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_withdrawals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    application_id uuid,
    requested_by uuid,
    reviewed_by uuid,
    reason text NOT NULL,
    status public.request_status DEFAULT 'pending'::public.request_status NOT NULL,
    reviewed_at timestamp(6) with time zone,
    review_note text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_resets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    used_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(80) NOT NULL,
    name character varying(120) NOT NULL,
    module character varying(50) NOT NULL,
    description text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: point_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.point_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    registration_id uuid,
    booth_visit_id uuid,
    points integer NOT NULL,
    reason character varying(120) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: proposal_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposal_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    proposal_id uuid NOT NULL,
    asset_id uuid,
    name character varying(120) NOT NULL,
    quantity integer NOT NULL
);


--
-- Name: public_event_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.public_event_registrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    attendees_count integer DEFAULT 1 NOT NULL,
    registration_code text NOT NULL,
    notes text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT public_event_registrations_attendees_count_check CHECK ((attendees_count > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    revoked_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(80) NOT NULL,
    value jsonb NOT NULL,
    description text,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: site_visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_visits (
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    day date NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_seen_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    rule_id uuid NOT NULL,
    earned_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_stall_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_stall_assignments (
    user_id uuid NOT NULL,
    stall_id uuid NOT NULL,
    version integer DEFAULT 1 NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    password_changed_at timestamp(6) with time zone,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(20),
    full_name character varying(160) NOT NULL,
    email public.citext NOT NULL,
    phone character varying(20),
    password_hash text NOT NULL,
    primary_role public.user_role DEFAULT 'partner'::public.user_role NOT NULL,
    status public.account_status DEFAULT 'pending_verification'::public.account_status NOT NULL,
    lock_reason text,
    avatar_url text,
    total_points integer DEFAULT 0 NOT NULL,
    email_notifications boolean DEFAULT true NOT NULL,
    last_active_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp(6) with time zone,
    deleted_by uuid
);


--
-- Name: venues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.venues (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(160) NOT NULL,
    facility character varying(160) NOT NULL,
    capacity integer NOT NULL,
    address text,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp(6) with time zone,
    deleted_by uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users ("password_changed_at", "id", "code", "full_name", "email", "phone", "password_hash", "primary_role", "status", "lock_reason", "avatar_url", "total_points", "email_notifications", "last_active_at", "created_at", "updated_at", "is_deleted", "deleted_at", "deleted_by") FROM stdin;
\N	129ee2fd-b27f-4a3a-9e56-55e535c62c16	STALL-B-09	Tài khoản Đinh Tị Books	b-09@stall.duongsach.vn	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80	0	t	\N	2026-10-10 10:54:37.88+00	2026-10-10 15:59:25.912+00	f	\N	\N
\N	180526ad-0f27-4d92-b773-a23eafdb5351	\N	Lâm Minh Khải	Khai262005@gmail.com	0961795758	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	\N	0	t	2026-10-11 10:22:12.666+00	2026-10-11 10:21:49.29+00	2026-10-11 10:22:12.667+00	f	\N	\N
\N	1d646476-a477-4895-ab3b-319e24ce7115	U005	Hoàng Anh E	hoanganhe@gmail.com	0977 889 900	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=200&q=80	100	t	\N	2026-10-10 02:52:53.541405+00	2026-10-10 16:02:57.685+00	f	\N	\N
\N	28b86971-83f1-47de-a8dc-7bf083bfffe8	U006	Nguyễn Thành F	thanhf.nguyen@gmail.com	0918 112 233	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	admin	active	\N	https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80	100	t	\N	2026-10-10 02:52:53.541405+00	2026-10-10 15:59:38.368+00	f	\N	\N
\N	33c2a21d-4a71-4820-a171-97df600f78ce	U003	Lê Minh C	leminhc@gmail.com	0903 456 789	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	admin	active	\N	https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80	100	t	\N	2026-10-10 02:52:53.541405+00	2026-10-10 15:59:38.364+00	f	\N	\N
\N	38e0e59f-cd48-4af5-b715-fbbba143a1de	STALL-B-11	Tài khoản Gian hàng Nhà Xuất Bản Phụ Nữ	b-11@stall.duongsach.vn	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1491841573634-28140fc7ced7?auto=format&fit=crop&w=800&q=80	0	t	\N	2026-10-10 10:54:37.896+00	2026-10-10 15:59:25.916+00	f	\N	\N
\N	45484fe1-aedd-4dd4-82bb-ce2108ae7551	STALL-B-05	Tài khoản Thái Hà Books	b-05@stall.duongsach.vn	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80	0	t	\N	2026-10-10 10:54:37.847+00	2026-10-10 15:59:25.904+00	f	\N	\N
\N	4a6ffe36-5759-4daa-b3bf-211c726c828e	\N	guest-2c14ff52-3a94-4976-ae2d-4a13886836a1	partner-guest-2c14ff52-3a94-4976-ae2d-4a13886836a1@example.test	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	\N	0	t	\N	2026-10-12 13:13:09.066+00	2026-10-12 13:13:09.066+00	f	\N	\N
\N	518a7ba0-302a-4463-a113-f0ca5eb94dd7	USR-USER-01	Nguyễn Văn A	nguyenvana@gmail.com	0909876543	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80	60	t	2026-10-10 03:56:38.463+00	2026-10-10 02:52:53.541405+00	2026-10-10 16:02:57.677+00	f	\N	\N
\N	5fbd98d8-008f-43a5-be13-662db889602e	\N	Lâm minh khải	Khai2023@gmail.com	09123342342	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	locked	hjkhkh	\N	0	t	2026-10-11 13:51:02.651+00	2026-10-11 13:50:32.737+00	2026-10-11 13:52:09.592+00	f	\N	\N
\N	6e7e64dc-0aa6-4bba-b597-161177545e12	STALL-B-02	Tài khoản Gian hàng Nhà Xuất Bản Kim Đồng	b-02@stall.duongsach.vn	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80	0	t	2026-10-10 10:57:13.062+00	2026-10-10 10:54:37.81+00	2026-10-10 15:59:25.926+00	f	\N	\N
\N	7025101e-b82c-4def-8629-b18a2121c1ad	STALL-B-03	Tài khoản Hiệu sách Nhã Nam	b-03@stall.duongsach.vn	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80	0	t	\N	2026-10-10 10:54:37.825+00	2026-10-10 15:59:25.928+00	f	\N	\N
\N	782f71b1-5350-491a-aaa9-16d54998964f	U002	Trần Thị B	tranthib@gmail.com	0988 234 567	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80	100	t	\N	2026-10-10 02:52:53.541405+00	2026-10-10 16:02:57.681+00	f	\N	\N
\N	7b927425-34c8-480f-ae43-c5b44e602026	U004	Phạm Thu D	phamthud@gmail.com	0934 567 890	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	locked	\N	https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80	100	t	\N	2026-10-10 02:52:53.541405+00	2026-10-10 16:02:57.683+00	f	\N	\N
\N	7d1be1fc-f868-4402-a1b9-dc90260860dc	U010	Phan K J	phankj@gmail.com	0908 990 011	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	admin	active	\N	https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80	100	t	\N	2026-10-10 02:52:53.541405+00	2026-10-10 15:59:38.372+00	f	\N	\N
\N	87427bb9-732b-44b3-aed9-18938ae98fe9	USR-ORG-01	Ban Quản Lý Đường Sách	bql@duongsach.example.vn	0902345678	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	admin	active	\N	https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80	300	t	2026-10-10 03:56:38.636+00	2026-10-10 02:52:53.541405+00	2026-10-10 15:59:38.375+00	f	\N	\N
\N	8f97cf46-eff2-4c9c-b30b-e197e17430d4	STALL-B-10	Tài khoản Alpha Books & Omega Plus	b-10@stall.duongsach.vn	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1532012164546-f432f2e3edd3?auto=format&fit=crop&w=800&q=80	0	t	\N	2026-10-10 10:54:37.889+00	2026-10-10 15:59:25.914+00	f	\N	\N
\N	92b29826-5af0-4ae3-b24c-729f74ce6f9a	STALL-B-04	Tài khoản Phương Nam Book Store	b-04@stall.duongsach.vn	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80	0	t	\N	2026-10-10 10:54:37.837+00	2026-10-10 15:59:25.899+00	f	\N	\N
\N	a1997704-8ccd-4838-ab09-31be558bf632	USR-PARTNER-02	Đại diện Nhà Sách Bình Minh	binhminh@books.com	0909123456	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=800&q=80	120	t	2026-10-10 15:17:19.05+00	2026-10-10 02:52:53.541405+00	2026-10-10 15:59:25.933+00	f	\N	\N
\N	a7b263a9-8578-447a-857b-ef4f1a885cbf	\N	guest-2c14ff52-3a94-4976-ae2d-4a13886836a1	admin-guest-2c14ff52-3a94-4976-ae2d-4a13886836a1@example.test	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	admin	active	\N	\N	0	t	\N	2026-10-12 13:13:09.055+00	2026-10-12 13:13:09.055+00	f	\N	\N
\N	ac24ce99-3fd9-47f7-a852-09262fe07c7b	U009	Lê Ngọc I	lengoci@gmail.com	0919 778 899	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80	100	t	\N	2026-10-10 02:52:53.541405+00	2026-10-10 16:02:57.692+00	f	\N	\N
\N	b682e52c-019f-4bf7-a1ef-0d11356f3c82	STALL-B-07	Tài khoản Gian hàng NXB Tổng Hợp TP.HCM	b-07@stall.duongsach.vn	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80	0	t	\N	2026-10-10 10:54:37.863+00	2026-10-10 15:59:25.908+00	f	\N	\N
\N	b743530b-b7f4-498a-8085-238a235af472	STALL-B-12	Tài khoản Không Gian Lưu Niệm & Tranh Cổ	b-12@stall.duongsach.vn	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80	0	t	\N	2026-10-10 10:54:37.906+00	2026-10-10 15:59:25.919+00	f	\N	\N
\N	b7e60b7b-fd9b-4c53-a7d6-f2e435c399ac	U007	Đỗ Thị G	dothig@gmail.com	0945 667 788	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80	100	t	\N	2026-10-10 02:52:53.541405+00	2026-10-10 16:02:57.687+00	f	\N	\N
\N	b961f086-82ff-45b4-a76d-3ec4a626a0b0	STALL-B-08	Tài khoản First News - Trí Việt	b-08@stall.duongsach.vn	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80	0	t	\N	2026-10-10 10:54:37.872+00	2026-10-10 15:59:25.911+00	f	\N	\N
\N	b9d37b50-942d-430a-a45f-0e303739b400	USR-ADMIN-01	Quản Trị Viên Hệ Thống	admin@duongsach.example.vn	0961795758	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	admin	active	\N	data:image/jpeg;base64,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	500	t	2026-10-13 02:39:56.82+00	2026-10-10 02:52:53.541405+00	2026-10-13 02:39:56.821+00	f	\N	\N
\N	bb9a1b3a-d697-4f19-af16-81075497b198	STALL-TD03	Tài khoản Cà Phê Sách Hoa Sen Thủ Đức	td03@stall.duongsach.vn		$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80	0	t	\N	2026-10-10 10:54:37.967+00	2026-10-11 10:19:09.787+00	f	\N	\N
\N	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	USR-PARTNER-01	Đại diện NXB Trẻ	nxbtre@partner.duongsach.vn	0903456789	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80	150	t	2026-10-13 02:36:25.235+00	2026-10-10 02:52:53.541405+00	2026-10-13 02:36:25.237+00	f	\N	\N
\N	e5396e24-6c7b-45c1-a24e-ef63aad57c0f	U008	Trần Văn H	tranvanh@gmail.com	0966 334 455	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80	100	t	\N	2026-10-10 02:52:53.541405+00	2026-10-10 16:02:57.69+00	f	\N	\N
\N	eee679c3-fe3f-4035-ba62-e8e38ff0296a	STALL-TD01	Tài khoản Gian hàng Sách Trẻ Thủ Đức	td01@stall.duongsach.vn	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80	0	t	\N	2026-10-10 10:54:37.946+00	2026-10-10 15:59:25.921+00	f	\N	\N
\N	f89013a9-f11e-44bb-81e5-9e2b4d66fe96	STALL-B-06	Tài khoản Cà Phê Sách Bằng Lăng Tím	b-06@stall.duongsach.vn	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80	0	t	\N	2026-10-10 10:54:37.854+00	2026-10-10 15:59:25.906+00	f	\N	\N
\N	fd18932e-cc91-45cf-832e-fcd4ae7cb93e	STALL-TD02	Tài khoản Gian hàng Tri thức Khoa học Thủ Đức	td02@stall.duongsach.vn	\N	$2b$10$MNFofxJ6JMrjOhfmanz5H.IhO4/zfrhUkDY0bXPsjpDIpaoy60eJe	partner	active	\N	https://images.unsplash.com/photo-1532012164546-f432f2e3edd3?auto=format&fit=crop&w=800&q=80	0	t	\N	2026-10-10 10:54:37.956+00	2026-10-10 15:59:25.923+00	f	\N	\N
\.

COPY public.activities (id, event_id, proposal_id, organization_id, title, title_en, kind, location_id, start_at, end_at, capacity, registered_count, status, has_certificate, published_at, cancelled_at, cancel_reason, description, speaker, image_url, qr_token, qr_revoked_at, created_by, created_at, updated_at) FROM stdin;
99a34c18-fceb-4eb8-a8e0-e74ba2d14099	daa1f312-395e-43a2-a91c-00f3a3d50bbb	\N	f4b638e5-2712-46b6-a6eb-ae50077cb0e3	Tọa đàm: Hành trình 10 năm Đường Sách TP.HCM & Xu hướng Sách Tương lai	Talkshow: 10 Years Journey of HCMC Book Street & Future of Books	talkshow	e98d0808-ceb7-4734-a471-c8d1e37dab61	2026-10-10 04:48:11.031968+00	2026-10-10 08:48:11.031968+00	200	142	published	t	\N	\N	\N	Tọa đàm trực tiếp đang diễn ra tại Sân khấu chính A với sự tham gia của các chuyên gia văn hóa, đại diện NXB Trẻ và đông đảo độc giả.	TS. Quách Thu Nguyệt & Nhà báo Lê Hoàng	https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80	f629aad8-5839-4f54-9fb8-ebe4293e636a	\N	\N	2026-10-10 04:12:50.615117+00	2026-10-10 04:12:50.615117+00
71a34c18-fceb-4eb8-a8e0-e74ba2d1408e	daa1f312-395e-43a2-a91c-00f3a3d50bbb	\N	f4b638e5-2712-46b6-a6eb-ae50077cb0e3	Tọa đàm: Ký ức văn học Sài Gòn - Chợ Lớn	Talkshow: Literary Memories of Saigon - Cho Lon	talkshow	e98d0808-ceb7-4734-a471-c8d1e37dab61	2026-10-09 03:48:11.031968+00	2026-10-09 05:48:11.031968+00	150	45	completed	t	\N	\N	\N	Cuộc trò chuyện cùng các nhà văn lão thành về dòng chảy văn học phương Nam.	Nhà văn Nguyễn Nhật Ánh & Nhà nghiên cứu Nguyễn Đình Tư	https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80	d98f57eb-fa35-4a85-be74-dd640010cf23	\N	\N	2026-10-10 02:52:57.30919+00	2026-10-10 02:52:57.30919+00
5a25267d-92b3-44a7-ad5d-bd925829cfe6	daa1f312-395e-43a2-a91c-00f3a3d50bbb	\N	099484c0-25dc-40ab-a189-91d8ab2005bd	Workshop: Bé sáng tạo bìa sách thiếu nhi	Workshop: Kids Creative Book Cover Art	workshop	70568dc7-f50b-4499-ade5-e3fcfd19e8b1	2026-10-13 05:48:11.031968+00	2026-10-13 08:48:11.031968+00	50	28	published	f	\N	\N	\N	Hoạt động vẽ tranh và cắt dán sáng tạo dành cho các bé từ 6-12 tuổi.	Họa sĩ minh họa Phan Triều Hải	https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80	2f6fbe7d-b165-4974-973b-1867b922c9a5	\N	\N	2026-10-10 02:52:57.30919+00	2026-10-10 02:52:57.30919+00
3b83c180-2a8e-49b8-bfe2-f67b41981123	daa1f312-395e-43a2-a91c-00f3a3d50bbb	\N	b85174ff-d92a-4e43-af7a-abd64e0ac3d6	Giao lưu tác giả: Hành Trình Lan Tỏa Văn Hóa Đọc	Author Meetup: Spreading Reading Culture	talkshow	e98d0808-ceb7-4734-a471-c8d1e37dab61	2026-10-09 00:48:11.031968+00	2026-10-09 02:48:11.031968+00	120	85	completed	t	\N	\N	\N	Chia sẻ kinh nghiệm rèn luyện thói quen đọc sách mỗi ngày từ các tác giả và chuyên gia giáo dục.	Diễn giả Trần Đăng Khoa & Nhà văn Hoàng Nam	https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80	08029386-fce7-434b-a6ed-f8f4adcfce13	\N	\N	2026-10-10 02:52:57.30919+00	2026-10-10 02:52:57.30919+00
8f22031a-e7c5-4d2b-8a89-aa81f2679d40	daa1f312-395e-43a2-a91c-00f3a3d50bbb	\N	a0d31fd8-f849-4040-a088-fa919189f072	Workshop: Nghệ thuật Khâu Sách Cổ & In Mộc Bản	Workshop: Traditional Bookbinding & Woodblock	workshop	70568dc7-f50b-4499-ade5-e3fcfd19e8b1	2026-10-14 05:48:11.031968+00	2026-10-14 08:48:11.031968+00	40	39	published	t	\N	\N	\N	Thực hành kỹ thuật đóng gáy sách cổ truyền thống Đông Á và in ấn khắc gỗ trên giấy dó thủ công.	Nghệ nhân Mộc bản Trần Văn Hưng	https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80	19b7b62c-5440-4c34-a257-4aea7a2bfd6c	\N	\N	2026-10-10 02:52:57.30919+00	2026-10-10 02:52:57.30919+00
\.


--
-- Data for Name: activity_cancellation_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_cancellation_requests (id, activity_id, reason, is_late, status, review_note, requested_by, reviewed_by, reviewed_at, created_at) FROM stdin;
\.


--
-- Data for Name: activity_change_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_change_requests (id, activity_id, target_location_id, new_start_at, new_end_at, reason, status, review_note, requested_by, reviewed_by, reviewed_at, created_at) FROM stdin;
\.


--
-- Data for Name: activity_proposals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_proposals (id, event_id, organization_id, title, title_en, kind, location_id, start_at, end_at, capacity, priority_level, target_audience, description, speaker, contact_person, contact_phone, status, management_notes, published_activity_id, submitted_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: activity_ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_ratings (id, activity_id, user_id, registration_id, rating, comment, created_at) FROM stdin;
60e8ffbf-a225-4201-9ff0-f873a68f14b7	71a34c18-fceb-4eb8-a8e0-e74ba2d1408e	518a7ba0-302a-4463-a113-f0ca5eb94dd7	9d3a2d20-d390-4498-af87-83017eab53fd	5	Hoạt động tổ chức rất chuyên nghiệp và bổ ích!	2026-10-10 12:38:51.546+00
f9d6ba41-0eb8-4b90-8f74-7c720028b7dd	3b83c180-2a8e-49b8-bfe2-f67b41981123	518a7ba0-302a-4463-a113-f0ca5eb94dd7	8b2c1d10-d390-4498-af87-83017eab53fe	5	Hoạt động tổ chức rất chuyên nghiệp và bổ ích!	2026-10-10 12:38:51.553+00
b429de73-7910-46ef-a56c-0a5bf3c490cd	8f22031a-e7c5-4d2b-8a89-aa81f2679d40	b7e60b7b-fd9b-4c53-a7d6-f2e435c399ac	6f0a9b98-d390-4498-af87-83017eab53fa	4	Hoạt động tổ chức rất chuyên nghiệp và bổ ích!	2026-10-10 12:38:51.556+00
\.


--
-- Data for Name: activity_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_registrations (id, activity_id, user_id, event_registration_id, status, registration_code, qr_token, qr_revoked_at, registered_at, cancelled_at, cancel_reason, is_late, points_awarded, certificate_issued) FROM stdin;
9d3a2d20-d390-4498-af87-83017eab53fd	71a34c18-fceb-4eb8-a8e0-e74ba2d1408e	518a7ba0-302a-4463-a113-f0ca5eb94dd7	\N	attended	ACT-REG-001	c289aa54-e9fb-4317-ade3-c79a5203b937	\N	2026-10-10 02:52:58.167192+00	\N	\N	f	t	t
8b2c1d10-d390-4498-af87-83017eab53fe	3b83c180-2a8e-49b8-bfe2-f67b41981123	518a7ba0-302a-4463-a113-f0ca5eb94dd7	\N	attended	ACT-REG-002	d39a1122-e9fb-4317-ade3-c79a5203b938	\N	2026-10-10 02:52:58.167192+00	\N	\N	f	t	t
7a1b0c09-d390-4498-af87-83017eab53ff	5a25267d-92b3-44a7-ad5d-bd925829cfe6	1d646476-a477-4895-ab3b-319e24ce7115	\N	registered	ACT-REG-003	e40b2233-e9fb-4317-ade3-c79a5203b939	\N	2026-10-10 02:52:58.167192+00	\N	\N	f	f	f
6f0a9b98-d390-4498-af87-83017eab53fa	8f22031a-e7c5-4d2b-8a89-aa81f2679d40	b7e60b7b-fd9b-4c53-a7d6-f2e435c399ac	\N	attended	ACT-REG-004	f51c3344-e9fb-4317-ade3-c79a5203b940	\N	2026-10-10 02:52:58.167192+00	\N	\N	f	t	t
\.


--
-- Data for Name: activity_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_reviews (id, proposal_id, reviewer_id, action, note, created_at) FROM stdin;
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assets (id, name, total_quantity, description, is_deleted, deleted_at, deleted_by, created_at, updated_at) FROM stdin;
12026f0c-6ad2-4fc5-a2ac-a6d3675da8f8	Hệ thống loa di động	4	Thiết bị sự kiện: Hệ thống loa di động (bộ)	f	\N	\N	2026-10-10 02:52:39.390711+00	2026-10-10 02:52:39.390711+00
e3d17f73-d44c-428e-ad88-4f548dba7d8f	Ghế ngồi khán giả	150	Thiết bị sự kiện: Ghế ngồi khán giả (ghế)	f	\N	\N	2026-10-10 02:52:39.390711+00	2026-10-10 02:52:39.390711+00
2e6f21a3-f539-4820-a66a-996f97c04472	Bàn đại biểu có khăn phủ	6	Thiết bị sự kiện: Bàn đại biểu có khăn phủ (bàn)	f	\N	\N	2026-10-10 02:52:39.390711+00	2026-10-10 02:52:39.390711+00
74949de4-f359-4679-a3bd-e4adf5098a35	Máy chiếu & Màn chiếu	2	Thiết bị sự kiện: Máy chiếu & Màn chiếu (bộ)	f	\N	\N	2026-10-10 02:52:39.390711+00	2026-10-10 02:52:39.390711+00
48e501d5-35c6-4e81-a970-b58b71886191	Khung Backdrop sân khấu	2	Thiết bị sự kiện: Khung Backdrop sân khấu (khung)	f	\N	\N	2026-10-10 02:52:39.390711+00	2026-10-10 02:52:39.390711+00
2ffbb187-8359-4065-a376-7683d861d7cc	Khung Standee chỉ dẫn	6	Thiết bị sự kiện: Khung Standee chỉ dẫn (chân)	f	\N	\N	2026-10-10 02:52:39.390711+00	2026-10-10 02:52:39.390711+00
2360f2f8-a524-4f81-ad25-1638175f62b9	Micro	12	Thiết bị sự kiện: Micro không dây (chiếc)	t	2026-10-11 14:25:01.556+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:39.390711+00	2026-10-11 14:25:01.557+00
\.


--
-- Data for Name: attendance_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_sessions (id, registration_id, user_id, activity_id, check_in_at, check_out_at, duration_minutes, state, scanned_by, is_override, override_by, override_reason) FROM stdin;
fafe39b8-26b6-4ec1-af0c-e7b44dea363e	9d3a2d20-d390-4498-af87-83017eab53fd	518a7ba0-302a-4463-a113-f0ca5eb94dd7	71a34c18-fceb-4eb8-a8e0-e74ba2d1408e	2026-10-09 00:52:58.170361+00	2026-10-09 02:52:58.170361+00	120	checked_out	\N	f	\N	\N
dafe39b8-26b6-4ec1-af0c-e7b44dea363d	8b2c1d10-d390-4498-af87-83017eab53fe	518a7ba0-302a-4463-a113-f0ca5eb94dd7	3b83c180-2a8e-49b8-bfe2-f67b41981123	2026-10-08 21:52:58.170361+00	2026-10-08 23:52:58.170361+00	120	checked_out	\N	f	\N	\N
ebed28a7-26b6-4ec1-af0c-e7b44dea363f	6f0a9b98-d390-4498-af87-83017eab53fa	b7e60b7b-fd9b-4c53-a7d6-f2e435c399ac	8f22031a-e7c5-4d2b-8a89-aa81f2679d40	2026-10-09 23:52:58.170361+00	2026-10-10 01:22:58.170361+00	90	checked_out	\N	f	\N	\N
\.


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendances (id, registration_id, activity_id, user_id, attended_at, is_override, overridden_by, override_reason, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, actor_id, actor_role, action, target_type, target_id, target_title, before_data, after_data, reason, ip_address, created_at) FROM stdin;
587f8da9-b4de-421d-84fd-376fe6223b24	b9d37b50-942d-430a-a45f-0e303739b400	admin	unpublish	Event	7e579f11-c470-4788-a0ef-3cc29525e16e	\N	\N	\N	\N	\N	2026-10-10 04:34:53.597+00
e8d9e9b1-d099-4f45-98b7-f003c93276c4	b9d37b50-942d-430a-a45f-0e303739b400	admin	publish	Event	7e579f11-c470-4788-a0ef-3cc29525e16e	\N	\N	\N	\N	\N	2026-10-10 04:34:53.895+00
d2676622-7a27-4829-98c5-0e31ad971b0f	b9d37b50-942d-430a-a45f-0e303739b400	admin	publish	Event	e9116a88-5b1b-47e0-aaa4-f8ab4f32d6b7	\N	\N	\N	\N	\N	2026-10-10 04:34:55.946+00
cc393f61-9d9c-4407-a054-81d889a58296	b9d37b50-942d-430a-a45f-0e303739b400	admin	unpublish	Event	e9116a88-5b1b-47e0-aaa4-f8ab4f32d6b7	\N	\N	\N	\N	\N	2026-10-10 04:34:56.304+00
8214ed3b-dcca-4819-9469-b9f7848c7c8b	b9d37b50-942d-430a-a45f-0e303739b400	admin	publish	Event	e9116a88-5b1b-47e0-aaa4-f8ab4f32d6b7	\N	\N	\N	\N	\N	2026-10-10 04:34:57.015+00
df89786f-234a-4c48-9415-da4ffac0ddbb	b9d37b50-942d-430a-a45f-0e303739b400	admin	unpublish	Event	e9116a88-5b1b-47e0-aaa4-f8ab4f32d6b7	\N	\N	\N	\N	\N	2026-10-10 04:34:58.815+00
303518b5-40e5-40d3-a934-addef7620be4	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Map	\N	\N	\N	{"pointCount": 35}	\N	\N	2026-10-10 04:36:35.496+00
e59e1d44-cdb0-4d85-89fb-61a7b66cb590	\N	\N	event_registration	Event	daa1f312-395e-43a2-a91c-00f3a3d50bbb	Lễ hội Đường Sách Mùa Thu 2026	\N	{"email": "thinhgia.test@gmail.com", "notes": "Đăng ký tham gia trải nghiệm", "phone": "0912345678", "fullName": "Nguyễn Thính Giả Test", "attendeesCount": 2, "registrationCode": "EVT-H5QZX5"}	\N	\N	2026-10-10 05:22:17.869+00
a99cf9a0-1da4-4053-a99f-a58fcdc089eb	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	ContentEntry	d4000001-0000-4000-8000-000000000000	\N	\N	\N	\N	\N	2026-10-10 05:42:47.622+00
f2b7e563-891b-46e9-869a-b5177cd906a2	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	ContentEntry	d4000001-0000-4000-8000-000000000000	\N	\N	\N	\N	\N	2026-10-10 05:53:56.615+00
3e59c414-f0db-4048-a80d-fdf612bdead9	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	ContentEntry	d4000001-0000-4000-8000-000000000000	\N	\N	\N	\N	\N	2026-10-10 05:54:28.37+00
0feec701-da30-4f4c-a057-6d8086304def	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Booth	c5966a62-03fe-4093-ae26-4faa7a102a8b	\N	\N	{"x": 60.8, "y": 66.8}	\N	\N	2026-10-10 06:00:55.615+00
83db9c1e-0b1e-4c39-9ec9-d0d571ded3a9	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Map	\N	\N	\N	{"pointCount": 11, "updatedCount": 11}	\N	\N	2026-10-10 06:00:55.673+00
ae269286-7c28-4707-a989-2bd5099e8839	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Map	\N	\N	\N	{"pointCount": 20, "updatedCount": 20}	\N	\N	2026-10-10 06:04:43.163+00
9597aede-f44f-4a09-aac7-d6fb590ae6be	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Map	\N	\N	\N	{"pointCount": 20, "updatedCount": 20}	\N	\N	2026-10-10 06:35:19.609+00
1f9777c6-ecb8-41ae-ad20-3611a189e910	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Map	\N	\N	\N	{"pointCount": 20, "updatedCount": 20}	\N	\N	2026-10-10 06:35:36.16+00
c0cdd47f-22d7-496e-b049-5cbbdf3e34ad	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Map	\N	\N	\N	{"pointCount": 20, "updatedCount": 20}	\N	\N	2026-10-10 09:19:22.413+00
465b3bda-f561-4eca-a49d-1d57f1162643	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Map	\N	\N	\N	{"pointCount": 25, "updatedCount": 25}	\N	\N	2026-10-10 10:25:30.04+00
f9d5a67a-8fa0-42cf-a50b-1eedc46d39cb	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Map	\N	\N	\N	{"pointCount": 21, "updatedCount": 21}	\N	\N	2026-10-10 10:40:03.65+00
72c2c5e7-ac84-4fa1-88fd-75c4bf8d73ba	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Map	\N	\N	\N	{"pointCount": 20, "updatedCount": 20}	\N	\N	2026-10-10 12:08:12.154+00
5a66806a-0dbc-4d50-96e3-5c4eff1df5e2	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	ContentEntry	d4000001-0000-4000-8000-000000000000	\N	\N	\N	\N	\N	2026-10-10 15:17:19.019+00
04786b12-8ac9-434e-b427-e7ebc8e9f599	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	ContentEntry	d4000001-0000-4000-8000-000000000000	\N	\N	\N	\N	\N	2026-10-10 15:17:19.585+00
a62897bf-6603-49de-8749-33b064591b57	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	ContentEntry	d4000001-0000-4000-8000-000000000000	\N	\N	\N	\N	\N	2026-10-10 16:11:41.19+00
1ac19101-f5a8-4944-b9dc-9ff0b7f177ef	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	ContentEntry	d4000001-0000-4000-8000-000000000000	\N	\N	\N	\N	\N	2026-10-10 16:20:56.803+00
a3748500-8dc9-4ab9-9960-917ef9902f7f	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	ContentEntry	d4000001-0000-4000-8000-000000000000	\N	\N	\N	\N	\N	2026-10-10 16:20:57.578+00
3312910d-3fa9-482c-9e6f-71fa8b3adf0c	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	ContentEntry	d4000001-0000-4000-8000-000000000000	\N	\N	\N	\N	\N	2026-10-10 16:35:19.564+00
3b0b8713-2b54-4044-b9ea-43531d570805	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	User	bb9a1b3a-d697-4f19-af16-81075497b198	\N	\N	{"role": "admin", "phone": "", "status": "active", "fullName": "Tài khoản Cà Phê Sách Hoa Sen Thủ Đức"}	\N	\N	2026-10-11 10:18:59.466+00
fcc07536-f690-4b50-9986-5797934323a3	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	User	bb9a1b3a-d697-4f19-af16-81075497b198	\N	\N	{"role": "partner", "phone": "", "status": "active", "fullName": "Tài khoản Cà Phê Sách Hoa Sen Thủ Đức"}	\N	\N	2026-10-11 10:19:09.804+00
9248b867-9a88-4158-aa4c-af3f830eb8a6	b9d37b50-942d-430a-a45f-0e303739b400	admin	create	User	180526ad-0f27-4d92-b773-a23eafdb5351	\N	\N	\N	\N	\N	2026-10-11 10:21:49.308+00
3cad5c1c-06e8-494a-b4c4-f67f8732d77e	180526ad-0f27-4d92-b773-a23eafdb5351	partner	create	PartnerApplication	5369dfca-a75f-4996-b558-da7477e1a583	\N	\N	\N	\N	\N	2026-10-11 10:22:42.487+00
591ca78b-fe30-4422-9fb5-535b517b8bb4	b9d37b50-942d-430a-a45f-0e303739b400	admin	unpublish	Event	daa1f312-395e-43a2-a91c-00f3a3d50bbb	\N	\N	\N	\N	\N	2026-10-11 10:28:05.265+00
2e4dd8d3-5140-4741-b407-8c49630ffee2	b9d37b50-942d-430a-a45f-0e303739b400	admin	publish	Event	daa1f312-395e-43a2-a91c-00f3a3d50bbb	\N	\N	\N	\N	\N	2026-10-11 10:28:12.846+00
998f46fa-daef-457f-a7c4-f70945fa5ccc	b9d37b50-942d-430a-a45f-0e303739b400	admin	create	User	5fbd98d8-008f-43a5-be13-662db889602e	\N	\N	\N	\N	\N	2026-10-11 13:50:32.755+00
cfc8f75b-8974-4d53-8683-72974f472e6e	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	User	5fbd98d8-008f-43a5-be13-662db889602e	\N	\N	{"reason": "", "status": "locked"}	\N	\N	2026-10-11 13:50:43.469+00
9f0fd53e-87e4-423f-9aad-f88fec3941df	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	User	5fbd98d8-008f-43a5-be13-662db889602e	\N	\N	{"reason": "", "status": "active"}	\N	\N	2026-10-11 13:50:45.264+00
484e3e67-bb7d-43e4-98f9-bd11edacba14	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	User	5fbd98d8-008f-43a5-be13-662db889602e	\N	\N	{"reason": "hjkhkh", "status": "locked"}	\N	\N	2026-10-11 13:52:09.597+00
663ea8bd-8891-48eb-af8c-6b77a2fc6ea1	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Map	\N	\N	\N	{"pointCount": 20, "updatedCount": 20}	\N	\N	2026-10-11 13:52:59.652+00
2187ff58-820a-4acc-ad45-3ec5a15abaec	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Map	\N	\N	\N	{"pointCount": 20, "updatedCount": 20}	\N	\N	2026-10-11 13:53:08.341+00
112cb469-949a-4cae-9db2-cc683fd2034d	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Book	a3000001-0000-4000-8000-000000000007	\N	\N	\N	\N	\N	2026-10-11 13:55:52.556+00
6b855eaf-1594-4b07-9b50-084a774fb9cc	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Book	a3000001-0000-4000-8000-000000000007	\N	\N	\N	\N	\N	2026-10-11 13:56:09.829+00
fce9e65e-f63f-4b9d-8bab-777abf2f3e48	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Book	a3000001-0000-4000-8000-000000000007	\N	\N	\N	\N	\N	2026-10-11 13:57:31.802+00
91f647f0-c223-4525-b879-9d2b5937384e	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Book	a3000001-0000-4000-8000-000000000007	\N	\N	\N	\N	\N	2026-10-11 13:57:35.796+00
7aad7195-e8fb-4110-8e86-e91b59efc603	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Book	a3000001-0000-4000-8000-000000000007	\N	\N	\N	\N	\N	2026-10-11 13:57:40.869+00
ffae49be-8ab0-4dbf-bdca-fb01e686e35e	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Book	a3000001-0000-4000-8000-000000000007	\N	\N	\N	\N	\N	2026-10-11 13:57:43.904+00
16ac33d3-0623-472d-9c20-c34a18694c7c	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Book	a3000001-0000-4000-8000-000000000010	\N	\N	\N	\N	\N	2026-10-11 13:57:52.141+00
fc31095f-c238-45ae-8959-1ce443659e5d	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Book	a3000001-0000-4000-8000-000000000007	\N	\N	\N	\N	\N	2026-10-11 13:57:56.226+00
d4a1ddf2-b3c2-462b-8dab-2ed7e5cd2d92	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Book	a3000001-0000-4000-8000-000000000007	\N	\N	\N	\N	\N	2026-10-11 13:58:10.765+00
9e456ef5-11b8-40e0-a6ba-10875abcc7a7	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	bookCategory	a1000001-0000-4000-8000-000000000004	\N	\N	\N	\N	\N	2026-10-11 14:00:36.965+00
7a2b2261-666d-4cd7-84d6-9b4381c300fc	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	bookCategory	a1000001-0000-4000-8000-000000000004	\N	\N	\N	\N	\N	2026-10-11 14:00:38.245+00
50e45be3-b922-4a2c-90fc-0fa41012494e	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	bookCategory	a1000001-0000-4000-8000-000000000004	\N	\N	\N	\N	\N	2026-10-11 14:00:49.326+00
f7b0d613-5679-470a-9b71-a8de3e2c4f6b	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	bookCategory	a1000001-0000-4000-8000-000000000003	\N	\N	\N	\N	\N	2026-10-11 14:00:51.377+00
5ce8aea7-64d3-4040-b66a-083bd8c9b9a2	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	bookCategory	a1000001-0000-4000-8000-000000000003	\N	\N	\N	\N	\N	2026-10-11 14:00:52.014+00
1b67599d-d7d1-44a3-868d-e38f4cb98963	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	bookLabel	a2000001-0000-4000-8000-000000000003	\N	\N	\N	\N	\N	2026-10-11 14:00:55.775+00
c3024d12-db6c-4615-8bcf-49816e613c8f	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	bookLabel	a2000001-0000-4000-8000-000000000001	\N	\N	\N	\N	\N	2026-10-11 14:00:57.701+00
b930de7d-b756-4f92-b36c-ec32ecf43aef	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	bookLabel	a2000001-0000-4000-8000-000000000001	\N	\N	\N	\N	\N	2026-10-11 14:00:58.514+00
2db94372-1728-47be-ac5b-73baed0c2cda	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	partner	update	BookStall	7fc7a050-457a-4d95-83c4-2d8471fd3d20	\N	\N	{"after": {"inventoryQuantity": 35}, "before": {"id": "7fc7a050-457a-4d95-83c4-2d8471fd3d20", "bookId": "a3000001-0000-4000-8000-000000000007", "stallId": "c5966a62-03fe-4093-ae26-4faa7a102a8b", "version": 1, "updatedAt": "2026-10-10T13:17:28.605Z", "soldQuantity": 22, "inventoryQuantity": 35}}	\N	\N	2026-10-11 14:08:59.199+00
101a3a1b-c335-4b20-b287-a4cad6c626f4	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	ContentEntry	d4000001-0000-4000-8000-000000000000	\N	\N	\N	\N	\N	2026-10-11 14:13:38.585+00
f06ad616-0f69-492d-9d2c-f1b27f364e75	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	partner	update	BookStall	7fc7a050-457a-4d95-83c4-2d8471fd3d20	\N	\N	{"after": {"soldQuantity": 40}, "before": {"id": "7fc7a050-457a-4d95-83c4-2d8471fd3d20", "bookId": "a3000001-0000-4000-8000-000000000007", "stallId": "c5966a62-03fe-4093-ae26-4faa7a102a8b", "version": 2, "updatedAt": "2026-10-11T14:08:59.194Z", "soldQuantity": 22, "inventoryQuantity": 35}}	\N	\N	2026-10-11 14:08:59.246+00
80f147d4-8af1-428b-8853-f137f844e88d	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	BookRanking	\N	\N	\N	{"bookIds": ["a3000001-0000-4000-8000-000000000009", "a3000001-0000-4000-8000-000000000013", "a3000001-0000-4000-8000-000000000001", "a3000001-0000-4000-8000-000000000004", "a3000001-0000-4000-8000-000000000014", "a3000001-0000-4000-8000-000000000008", "a3000001-0000-4000-8000-000000000003", "a3000001-0000-4000-8000-000000000005", "a3000001-0000-4000-8000-000000000012", "a3000001-0000-4000-8000-000000000002", "a3000001-0000-4000-8000-000000000011", "a3000001-0000-4000-8000-000000000006"], "rankingType": "bestseller"}	\N	\N	2026-10-11 14:09:55.98+00
25132424-964a-4886-abe7-ed18a1ffa579	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	partner	update	ActivityProposal	fe4ba9f9-bc28-453f-a469-b21ea2b2dbf5	\N	\N	\N	\N	\N	2026-10-12 07:58:05.085+00
71c7800e-cb84-427b-b20b-f134a3145512	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	c40053f1-d72f-45dd-a2f9-4be31a50dc89	\N	\N	{"title": "Đề xuất thử nghiệm invalid-from-rejected 1791812029487"}	\N	\N	2026-10-12 13:43:45.77+00
9a1160a6-4300-49d1-9d45-a9a357a14ef6	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	c4330705-89c1-4245-bbc3-0d8a258adb8f	\N	\N	{"title": "Đề xuất thử nghiệm reject-need-rev 1791812029441"}	\N	\N	2026-10-12 13:43:49.304+00
449b9cc0-b593-4f32-b9b4-a4526d69a2ac	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	7e37cef9-f774-4337-88b5-1af236adc7af	\N	\N	{"title": "Đề xuất thử nghiệm reject-empty-note 1791812029406"}	\N	\N	2026-10-12 13:43:59.164+00
92f46561-5d8f-4766-9b94-9e123a3255b2	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	65c2079a-e6de-4665-8a4b-4da259853162	\N	\N	{"title": "Đề xuất thử nghiệm req-supp-valid 1791812029374"}	\N	\N	2026-10-12 13:44:03.441+00
3b1719c3-3b7f-4845-880e-dfbc27e0386b	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	9603735e-b213-46a2-b7c8-0fbed8008e13	\N	\N	{"title": "Đề xuất thử nghiệm approve-no-note 1791812029343"}	\N	\N	2026-10-12 13:44:10.567+00
6d2da78a-b337-4db0-bd32-aab2f3d1de42	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	7b4e44ec-5a10-4445-8ea8-bba357f6e199	\N	\N	{"title": "Đề xuất thử nghiệm detail-test 1791812029248"}	\N	\N	2026-10-12 13:44:18.908+00
ff1da0dc-e667-4763-8ca4-49fe1c922551	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	f838d7fe-0cde-4309-bfdf-ab75df47e86a	\N	\N	{"title": "Đề xuất thử nghiệm invalid-from-withdrawn 1791811703514"}	\N	\N	2026-10-12 13:44:34.418+00
96938180-d74d-4190-9338-5764fcedd35e	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete_permanent	bookCategory	a1000001-0000-4000-8000-000000000003	\N	\N	\N	\N	\N	2026-10-12 13:51:39.299+00
80cf6a30-90d8-438b-8287-618f9f40a334	b9d37b50-942d-430a-a45f-0e303739b400	admin	create	bookCategory	a0588a73-2671-4407-9aca-b228e203baba	\N	\N	\N	\N	\N	2026-10-12 13:51:51.953+00
03045fab-8a00-4c84-97f2-95ab26d8195e	b9d37b50-942d-430a-a45f-0e303739b400	admin	publish	Event	c638df0a-af6d-4ba1-9f55-107e352cdcca	\N	\N	\N	\N	\N	2026-10-12 13:57:18.037+00
6ff2b50c-946d-43d4-af6f-92ffaa32242b	b9d37b50-942d-430a-a45f-0e303739b400	admin	publish	Event	c638df0a-af6d-4ba1-9f55-107e352cdcca	\N	\N	\N	\N	\N	2026-10-12 13:57:49.298+00
15b972fc-4ba9-4e64-a444-f5ac2b347a3c	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	ContentEntry	d4000001-0000-4000-8000-000000000000	\N	\N	\N	\N	\N	2026-10-11 14:13:54.66+00
888fa155-a237-4034-ad4f-bb6bab7f7eea	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	ContentEntry	d4000001-0000-4000-8000-000000000000	\N	\N	\N	\N	\N	2026-10-11 14:14:18.351+00
8104c5f2-ec9f-4eb4-9bcb-845c0094df1b	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	partner	create	ActivityProposal	6f841950-e525-45fd-b63b-44cf72b13739	\N	\N	\N	\N	\N	2026-10-11 14:17:21.903+00
df38b28d-ab21-4b7e-828e-7be43abcc9ca	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	partner	create	ActivityProposal	fe4ba9f9-bc28-453f-a469-b21ea2b2dbf5	\N	\N	\N	\N	\N	2026-10-11 14:19:57.241+00
e3381ef3-9946-494f-bb89-a311c8f339c8	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	bookCategory	a1000001-0000-4000-8000-000000000004	\N	\N	\N	\N	\N	2026-10-12 03:40:42.442+00
578c84cd-f1aa-4a50-85c2-b0bce592097e	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	bookCategory	a1000001-0000-4000-8000-000000000002	\N	\N	\N	\N	\N	2026-10-12 03:40:51.915+00
347027a5-95d0-435e-a426-c66fc9646ddf	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	bookCategory	a1000001-0000-4000-8000-000000000004	\N	\N	\N	\N	\N	2026-10-12 03:40:56.109+00
42a8c9ec-78ef-495b-bb4c-2c82d4b900b1	b9d37b50-942d-430a-a45f-0e303739b400	admin	create	bookCategory	dd9bb835-b27f-4d4a-9f0c-89637ffa8ded	\N	\N	\N	\N	\N	2026-10-12 03:41:12.235+00
2fabd8a9-f9df-401a-b15b-302788809428	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	bookCategory	dd9bb835-b27f-4d4a-9f0c-89637ffa8ded	\N	\N	\N	\N	\N	2026-10-12 03:41:14.464+00
d9b629c9-a377-4804-8f56-6c8daa746cc5	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	6f841950-e525-45fd-b63b-44cf72b13739	\N	\N	{"title": "ádasd"}	\N	\N	2026-10-12 03:44:46.76+00
136adddb-84ca-4f5a-a472-860a36e72811	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	partner	update	Booth	c5966a62-03fe-4093-ae26-4faa7a102a8b	\N	\N	\N	\N	\N	2026-10-12 04:10:18.116+00
46cc8e37-d06c-494f-86b5-2aa0f2aa28cb	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	partner	update	Booth	c5966a62-03fe-4093-ae26-4faa7a102a8b	\N	\N	\N	\N	\N	2026-10-12 04:10:28.176+00
7b7ba5c6-9b50-43cb-b339-3df6516ffacd	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	partner	update	Booth	c5966a62-03fe-4093-ae26-4faa7a102a8b	\N	\N	\N	\N	\N	2026-10-12 04:10:29.017+00
3d853b21-6561-4d83-95fa-6c1c6b36a93e	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	partner	update	Booth	c5966a62-03fe-4093-ae26-4faa7a102a8b	\N	\N	\N	\N	\N	2026-10-12 04:10:29.721+00
486f4cac-3349-422f-982e-18d484a653c0	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	partner	update	Booth	c5966a62-03fe-4093-ae26-4faa7a102a8b	\N	\N	\N	\N	\N	2026-10-12 04:10:29.956+00
bf2eadf1-b223-45ec-afc5-54d5d07cc9cc	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	partner	update	Booth	c5966a62-03fe-4093-ae26-4faa7a102a8b	\N	\N	\N	\N	\N	2026-10-12 04:10:30.119+00
e2b893dc-2bde-41c2-b7ab-019643b097be	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	partner	update	Booth	c5966a62-03fe-4093-ae26-4faa7a102a8b	\N	\N	\N	\N	\N	2026-10-12 04:11:40.515+00
6822d004-06d7-4102-a1cf-b385d8d42db1	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	partner	update	ActivityProposal	fe4ba9f9-bc28-453f-a469-b21ea2b2dbf5	\N	\N	\N	\N	\N	2026-10-12 07:58:06.867+00
85e019cf-5eba-436b-9cc2-5570760644df	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	b0158f32-5bbb-4556-b738-451921f0a726	\N	\N	{"title": "Đề xuất thử nghiệm invalid-from-withdrawn 1791812029502"}	\N	\N	2026-10-12 13:43:44.263+00
97b72dbf-8903-4024-95ea-bfb162ba8b77	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	82cd38ab-9f42-40f3-8a01-b1576bf4ae6b	\N	\N	{"title": "Đề xuất thử nghiệm invalid-from-approved 1791812029465"}	\N	\N	2026-10-12 13:43:47.46+00
9873aab5-4614-421c-842c-a2fb4a9dfda4	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	cbae4964-f448-4159-ae17-d15a0dec7a03	\N	\N	{"title": "Đề xuất thử nghiệm reject-pending 1791812029413"}	\N	\N	2026-10-12 13:43:51.583+00
10e21343-8d56-409c-9e01-e25759905f99	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	3ab3c33f-d2cb-45cf-805b-a5f7acb229f1	\N	\N	{"title": "Đề xuất thử nghiệm supp-not-pending 1791812029398"}	\N	\N	2026-10-12 13:44:01.511+00
cff3a0af-c078-420d-b725-9be5a1c173d4	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	e71832d9-ee55-47b3-abe0-6505b1cd7747	\N	\N	{"title": "Đề xuất thử nghiệm supp-empty-note 1791812029367"}	\N	\N	2026-10-12 13:44:08.52+00
800478c7-ec87-413b-8fb1-18268e3c808a	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	926ff88a-5c66-465a-b432-5dc4a74fb90f	\N	\N	{"title": "Đề xuất thử nghiệm approve-need-rev 1791812029322"}	\N	\N	2026-10-12 13:44:12.198+00
c6321d60-673c-407c-b767-8c29a69c8781	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete	ActivityProposal	3e77e181-c580-4eb8-8684-a8472350e9f8	\N	\N	{"title": "Đề xuất thử nghiệm approve-pending 1791812029292"}	\N	\N	2026-10-12 13:44:13.953+00
d0716a7e-702f-4191-bb2e-a3a51339a8c4	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete_permanent	bookCategory	a1000001-0000-4000-8000-000000000004	\N	\N	\N	\N	\N	2026-10-12 13:50:55.331+00
2a42c2aa-13c8-4e87-a2db-ab8ff9b96877	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete_permanent	bookCategory	a1000001-0000-4000-8000-000000000002	\N	\N	\N	\N	\N	2026-10-12 13:51:37.65+00
9d313ac0-73da-4a38-aa91-2fa127fc2886	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete_permanent	bookCategory	dd9bb835-b27f-4d4a-9f0c-89637ffa8ded	\N	\N	\N	\N	\N	2026-10-12 13:51:40.023+00
1d8ee7f1-316e-4c6e-9d44-4696c4a982ab	b9d37b50-942d-430a-a45f-0e303739b400	admin	delete_permanent	bookLabel	a2000001-0000-4000-8000-000000000001	\N	\N	\N	\N	\N	2026-10-12 13:51:41.616+00
7b7a4f7f-e0c6-4b0e-85e2-623356906de9	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Book	a3000001-0000-4000-8000-000000000013	\N	\N	\N	\N	\N	2026-10-12 13:52:01.679+00
a31203ed-1e38-47c2-a4d1-0b46b91a9ae3	b9d37b50-942d-430a-a45f-0e303739b400	admin	unpublish	Event	c638df0a-af6d-4ba1-9f55-107e352cdcca	\N	\N	\N	\N	\N	2026-10-12 13:57:48.851+00
68be1a64-fa06-4365-9371-96e3613348bc	b9d37b50-942d-430a-a45f-0e303739b400	admin	publish	Event	163029a5-844c-4953-be87-942f4f9b1a9e	\N	\N	\N	\N	\N	2026-10-12 13:58:02.174+00
5cedce55-a13a-4c2b-b754-e68915f2c1c1	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Map	\N	\N	\N	{"pointCount": 20, "updatedCount": 20}	\N	\N	2026-10-12 06:56:11.136+00
f71b9717-e0d3-4260-9608-28854061fc86	b9d37b50-942d-430a-a45f-0e303739b400	admin	update	Map	\N	\N	\N	{"pointCount": 20, "updatedCount": 20}	\N	\N	2026-10-12 06:56:13.236+00
18e33d28-2db6-4737-a4d4-b2863cd53626	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	partner	update	Booth	c5966a62-03fe-4093-ae26-4faa7a102a8b	\N	\N	\N	\N	\N	2026-10-13 02:37:43.043+00
\.


--
-- Data for Name: badge_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.badge_rules (id, code, title, description, icon_name, min_points, created_at) FROM stdin;
e909a516-4bac-4835-a8cd-ccc516be3f97	MAM_DOC	Mầm Đọc	Dành cho độc giả mới bắt đầu tham gia các hoạt động tại Đường Sách TP.HCM.	seedling	50	2026-10-10 02:52:59.065627+00
9bc33ab2-12ed-4546-a996-ed65b75dac97	BAN_DOC_THAN_THIET	Bạn Đọc Thân Thiết	Dành cho độc giả tham gia tích cực từ 3 hoạt động và check-in các điểm di sản.	book	150	2026-10-10 02:52:59.065627+00
fa35d64d-5194-4838-a885-f906d35d5c79	DAI_SU_VAN_HOA	Đại Sứ Văn Hóa	Dành cho cá nhân lan tỏa văn hóa đọc, có đóng góp phản hồi và đánh giá tích cực.	award	600	2026-10-10 02:52:59.065627+00
6930af74-b994-40ca-a284-e479a87aa3eb	HOC_GIA_TINH_HOA	Học Giả Tinh Hoa	Huy hiệu danh dự cao cấp nhất, ghi nhận quá trình đồng hành bền bỉ cùng Đường Sách.	crown	1200	2026-10-10 02:52:59.065627+00
\.


--
-- Data for Name: book_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.book_categories (id, name, name_en, status) FROM stdin;
a1000001-0000-4000-8000-000000000001	Văn học Việt Nam	Vietnamese literature	active
a0588a73-2671-4407-9aca-b228e203baba	Văn học hiện đại	\N	active
\.


--
-- Data for Name: book_label_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.book_label_assignments (book_id, label_id) FROM stdin;
a3000001-0000-4000-8000-000000000001	a2000001-0000-4000-8000-000000000004
a3000001-0000-4000-8000-000000000002	a2000001-0000-4000-8000-000000000002
a3000001-0000-4000-8000-000000000002	a2000001-0000-4000-8000-000000000003
a3000001-0000-4000-8000-000000000003	a2000001-0000-4000-8000-000000000004
a3000001-0000-4000-8000-000000000005	a2000001-0000-4000-8000-000000000003
a3000001-0000-4000-8000-000000000006	a2000001-0000-4000-8000-000000000002
\.


--
-- Data for Name: book_labels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.book_labels (id, name, status) FROM stdin;
a2000001-0000-4000-8000-000000000002	Được yêu thích	active
a2000001-0000-4000-8000-000000000004	Tác giả Việt	active
a2000001-0000-4000-8000-000000000003	Dành cho gia đình	active
\.


--
-- Data for Name: book_rankings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.book_rankings (id, book_id, ranking_type, rank, updated_by, updated_at) FROM stdin;
d315324a-6f6f-484d-b1c7-071f2e73e706	a3000001-0000-4000-8000-000000000009	bestseller	1	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-11 14:09:55.97+00
9485bb4d-026f-40b2-86d1-702e45ff7629	a3000001-0000-4000-8000-000000000013	bestseller	2	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-11 14:09:55.97+00
64d4b781-5f93-42a7-a2ed-8921ecb2d9f0	a3000001-0000-4000-8000-000000000001	bestseller	3	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-11 14:09:55.97+00
6546474d-674c-429f-bc3c-4c010d428ba1	a3000001-0000-4000-8000-000000000004	bestseller	4	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-11 14:09:55.97+00
c049094a-9f5c-49cd-828f-743ae3b53a79	a3000001-0000-4000-8000-000000000014	bestseller	5	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-11 14:09:55.97+00
b66c542e-1eb1-4d65-b71e-1e78d4bc29c3	a3000001-0000-4000-8000-000000000008	bestseller	6	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-11 14:09:55.97+00
7baf4104-7ca3-420d-adca-e3f788dce9c4	a3000001-0000-4000-8000-000000000003	bestseller	7	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-11 14:09:55.97+00
dd91ebdf-5338-4b83-8721-4752bc25bbca	a3000001-0000-4000-8000-000000000005	bestseller	8	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-11 14:09:55.97+00
c816fc02-63ac-4c9f-8ea3-e600db8facab	a3000001-0000-4000-8000-000000000012	bestseller	9	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-11 14:09:55.97+00
c2e8e3b3-4061-4694-821a-531681c370e5	a3000001-0000-4000-8000-000000000002	bestseller	10	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-11 14:09:55.97+00
80b35843-c864-453b-86b3-354e6faae371	a3000001-0000-4000-8000-000000000011	bestseller	11	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-11 14:09:55.97+00
008b712b-cea5-4fe4-a112-bd2c27f43834	a3000001-0000-4000-8000-000000000006	bestseller	12	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-11 14:09:55.97+00
\.


--
-- Data for Name: book_sales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.book_sales (id, book_id, booth_id, quantity, sold_date, created_at) FROM stdin;
d2000001-0000-4000-8000-000000000001	a3000001-0000-4000-8000-000000000001	c5966a62-03fe-4093-ae26-4faa7a102a8b	12	2026-10-07	2026-10-10 04:40:10.568856+00
d2000001-0000-4000-8000-000000000002	a3000001-0000-4000-8000-000000000001	c5966a62-03fe-4093-ae26-4faa7a102a8b	18	2026-10-08	2026-10-10 04:40:10.568856+00
d2000001-0000-4000-8000-000000000003	a3000001-0000-4000-8000-000000000001	c5966a62-03fe-4093-ae26-4faa7a102a8b	25	2026-10-09	2026-10-10 04:40:10.568856+00
d2000001-0000-4000-8000-000000000004	a3000001-0000-4000-8000-000000000001	c5966a62-03fe-4093-ae26-4faa7a102a8b	34	2026-10-10	2026-10-10 04:40:10.568856+00
d2000001-0000-4000-8000-000000000005	a3000001-0000-4000-8000-000000000003	c5966a62-03fe-4093-ae26-4faa7a102a8b	15	2026-10-09	2026-10-10 04:40:10.568856+00
d2000001-0000-4000-8000-000000000006	a3000001-0000-4000-8000-000000000004	cff5ef63-f6a2-48a9-ae8e-e805566ea654	20	2026-10-10	2026-10-10 04:40:10.568856+00
1aae2ec8-9328-44b9-8f68-b21895f7f102	a3000001-0000-4000-8000-000000000002	e757df4c-4212-4f50-af7f-bb2c38f6a9cf	15	2026-10-10	2026-10-10 10:54:37.986+00
d28c9736-60c9-4c7b-af18-0574f04cb19e	a3000001-0000-4000-8000-000000000003	6d2df04d-8992-4959-a787-6fdbf3c55804	5	2026-10-10	2026-10-10 10:54:37.992+00
73bfdc6c-e19e-4483-96d9-882d3b286d03	a3000001-0000-4000-8000-000000000004	2291365a-10b9-445c-a44b-ad5f0261d2d1	12	2026-10-10	2026-10-10 10:54:37.996+00
4061b0ad-f19b-4482-aca1-e930ab95d042	a3000001-0000-4000-8000-000000000005	e757df4c-4212-4f50-af7f-bb2c38f6a9cf	20	2026-10-10	2026-10-10 10:54:37.998+00
09f9af2e-0164-4329-9d08-0de017eafaf3	a3000001-0000-4000-8000-000000000006	6d2df04d-8992-4959-a787-6fdbf3c55804	3	2026-10-10	2026-10-10 10:54:38+00
88f53dbf-600a-4867-a009-b1756dce4b85	a3000001-0000-4000-8000-000000000009	88266c1a-e23b-4235-a1da-7652da4b4639	30	2026-10-09	2026-10-10 13:17:28.623+00
ca4274a0-bcf5-4e73-b867-d6397924f9bd	a3000001-0000-4000-8000-000000000009	88266c1a-e23b-4235-a1da-7652da4b4639	15	2026-10-07	2026-10-10 13:17:28.627+00
df00bfd3-0e18-49d6-98d4-0c42884fb1ed	a3000001-0000-4000-8000-000000000008	c5966a62-03fe-4093-ae26-4faa7a102a8b	20	2026-10-08	2026-10-10 13:17:28.628+00
8e45acd2-f8ac-4e4a-bc9d-8a15985f4ac4	a3000001-0000-4000-8000-000000000008	c5966a62-03fe-4093-ae26-4faa7a102a8b	8	2026-10-05	2026-10-10 13:17:28.63+00
40d2d454-38a7-4e02-ab26-32e97898257b	a3000001-0000-4000-8000-000000000010	2291365a-10b9-445c-a44b-ad5f0261d2d1	14	2026-10-09	2026-10-10 13:17:28.634+00
19169345-3f3f-43f2-bb28-9aace4fccdd0	a3000001-0000-4000-8000-000000000010	2291365a-10b9-445c-a44b-ad5f0261d2d1	4	2026-10-06	2026-10-10 13:17:28.644+00
917cbb53-9375-4ca2-b5e5-5778ab455d7a	a3000001-0000-4000-8000-000000000007	c5966a62-03fe-4093-ae26-4faa7a102a8b	15	2026-10-08	2026-10-10 13:17:28.647+00
9ed50668-b1ab-4e78-8d3e-93783894d0be	a3000001-0000-4000-8000-000000000007	c5966a62-03fe-4093-ae26-4faa7a102a8b	7	2026-10-04	2026-10-10 13:17:28.651+00
e23e131a-841e-48da-8c08-f7839ceae828	a3000001-0000-4000-8000-000000000012	7fc55ea4-e4c7-46f6-ac99-41aa8a149d42	10	2026-10-09	2026-10-10 13:17:28.659+00
ef8c6aac-52a0-4304-8ca7-44236c53eec9	a3000001-0000-4000-8000-000000000012	7fc55ea4-e4c7-46f6-ac99-41aa8a149d42	6	2026-10-07	2026-10-10 13:17:28.664+00
dd5f9f18-a78f-45f9-af7d-2970f1a38997	a3000001-0000-4000-8000-000000000013	e757df4c-4212-4f50-af7f-bb2c38f6a9cf	25	2026-10-10	2026-10-10 13:17:28.675+00
bf580577-8d5f-471c-864b-555e72a42a15	a3000001-0000-4000-8000-000000000013	e757df4c-4212-4f50-af7f-bb2c38f6a9cf	10	2026-10-06	2026-10-10 13:17:28.681+00
d1a66cd1-6007-40bc-bb65-dd56c9f5d68b	a3000001-0000-4000-8000-000000000014	88266c1a-e23b-4235-a1da-7652da4b4639	18	2026-10-08	2026-10-10 13:17:28.691+00
abc494fb-ce73-4024-a023-a3c16ac2cf04	a3000001-0000-4000-8000-000000000014	88266c1a-e23b-4235-a1da-7652da4b4639	12	2026-10-05	2026-10-10 13:17:28.699+00
b9cbd0ab-cf83-4ec0-a778-6b03c54f78fa	a3000001-0000-4000-8000-000000000011	6d2df04d-8992-4959-a787-6fdbf3c55804	7	2026-10-09	2026-10-10 13:17:28.704+00
1b9611e4-790d-43f0-9414-99926b36eac2	a3000001-0000-4000-8000-000000000011	6d2df04d-8992-4959-a787-6fdbf3c55804	3	2026-10-04	2026-10-10 13:17:28.709+00
\.


--
-- Data for Name: book_stalls; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.book_stalls (id, book_id, stall_id, inventory_quantity, sold_quantity, version, updated_at) FROM stdin;
d84102bc-f9ad-4fba-8003-db96d10457e9	a3000001-0000-4000-8000-000000000003	c5966a62-03fe-4093-ae26-4faa7a102a8b	0	15	1	2026-10-10 10:56:39.514+00
273a58a4-7727-4f42-b6cf-5ac0592ada15	a3000001-0000-4000-8000-000000000004	cff5ef63-f6a2-48a9-ae8e-e805566ea654	0	20	1	2026-10-10 10:56:39.525+00
a4000001-0000-4000-8000-000000000002	a3000001-0000-4000-8000-000000000002	e757df4c-4212-4f50-af7f-bb2c38f6a9cf	42	15	1	2026-10-10 03:55:26.13538+00
a4000001-0000-4000-8000-000000000003	a3000001-0000-4000-8000-000000000003	6d2df04d-8992-4959-a787-6fdbf3c55804	24	5	1	2026-10-10 03:55:26.13538+00
a4000001-0000-4000-8000-000000000004	a3000001-0000-4000-8000-000000000004	2291365a-10b9-445c-a44b-ad5f0261d2d1	30	12	1	2026-10-10 03:55:26.13538+00
a4000001-0000-4000-8000-000000000005	a3000001-0000-4000-8000-000000000005	e757df4c-4212-4f50-af7f-bb2c38f6a9cf	50	20	1	2026-10-10 03:55:26.13538+00
a4000001-0000-4000-8000-000000000006	a3000001-0000-4000-8000-000000000006	6d2df04d-8992-4959-a787-6fdbf3c55804	18	3	1	2026-10-10 03:55:26.13538+00
1ab55348-15b8-4657-8c44-6432a1be1777	a3000001-0000-4000-8000-000000000008	c5966a62-03fe-4093-ae26-4faa7a102a8b	40	28	1	2026-10-10 13:17:28.608+00
d3788643-e7cd-4656-99cb-ec92e61f4879	a3000001-0000-4000-8000-000000000009	88266c1a-e23b-4235-a1da-7652da4b4639	60	45	1	2026-10-10 13:17:28.611+00
d00442ad-086d-4f0c-ad61-50387b0903db	a3000001-0000-4000-8000-000000000010	2291365a-10b9-445c-a44b-ad5f0261d2d1	25	18	1	2026-10-10 13:17:28.613+00
b6b87f75-7290-435b-80cd-fcdc017f8b8c	a3000001-0000-4000-8000-000000000011	6d2df04d-8992-4959-a787-6fdbf3c55804	20	10	1	2026-10-10 13:17:28.615+00
ff525b2c-3251-4885-bb98-affa16ab23d8	a3000001-0000-4000-8000-000000000012	7fc55ea4-e4c7-46f6-ac99-41aa8a149d42	30	16	1	2026-10-10 13:17:28.617+00
9978ddff-82c3-40ca-ad93-6f342974b739	a3000001-0000-4000-8000-000000000014	88266c1a-e23b-4235-a1da-7652da4b4639	45	30	1	2026-10-10 13:17:28.621+00
a4000001-0000-4000-8000-000000000001	a3000001-0000-4000-8000-000000000001	c5966a62-03fe-4093-ae26-4faa7a102a8b	36	89	3	2026-10-10 14:56:40.233+00
7fc7a050-457a-4d95-83c4-2d8471fd3d20	a3000001-0000-4000-8000-000000000007	c5966a62-03fe-4093-ae26-4faa7a102a8b	35	40	3	2026-10-11 14:08:59.238+00
36a55b9a-850b-4b86-b253-37d4b8a84918	a3000001-0000-4000-8000-000000000013	e757df4c-4212-4f50-af7f-bb2c38f6a9cf	50	35	1	2026-10-12 13:52:01.67+00
\.


--
-- Data for Name: book_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.book_submissions (id, book_id, stall_id, type, status, submitted_by, submitted_at, reviewed_by, reviewed_at, rejection_reason, proposed_data, current_approved_data, book_version, inventory_quantity, sold_quantity) FROM stdin;
d3000001-0000-4000-8000-000000000001	a3000001-0000-4000-8000-000000000001	c5966a62-03fe-4093-ae26-4faa7a102a8b	UPDATE	APPROVED	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	2026-10-08 04:40:10.571751+00	\N	\N	\N	{"price": 110000, "title": "Mắt biếc", "author": "Nguyễn Nhật Ánh", "publisher": "NXB Trẻ"}	\N	\N	50	15
d3000001-0000-4000-8000-000000000002	\N	c5966a62-03fe-4093-ae26-4faa7a102a8b	CREATE	PENDING	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	2026-10-10 00:40:10.571751+00	\N	\N	\N	{"isbn": "9786041000009", "title": "Cây chuối non đi giày xanh", "author": "Nguyễn Nhật Ánh", "publisher": "NXB Trẻ", "description": "Tác phẩm truyện dài đậm chất trong trẻo và hoài niệm tuổi thơ của tác giả Nguyễn Nhật Ánh.", "categoryName": "Văn học Việt Nam", "publicationYear": 2024}	\N	\N	60	0
\.


--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.books (id, isbn, title, title_en, author, publisher, cover_url, description, publication_year, category_id, status, version, updated_at) FROM stdin;
a3000001-0000-4000-8000-000000000001	9786041000001	Mắt biếc	Blue Eyes	Nguyễn Nhật Ánh	NXB Trẻ	https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80	Tác phẩm văn học Việt Nam giàu cảm xúc về tuổi trẻ, tình bạn và những rung động đầu đời.	2019	a1000001-0000-4000-8000-000000000001	active	1	2026-10-10 03:55:26.130871+00
a3000001-0000-4000-8000-000000000002	9786041000002	Kính vạn hoa: Bí mật của một kho báu	Kaleidoscope: A Treasure Secret	Nguyễn Nhật Ánh	NXB Kim Đồng	https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80	Cuộc phiêu lưu trong trẻo và đầy bất ngờ của bộ ba Quý ròm, Tiểu Long và Hạnh.	2020	\N	active	1	2026-10-12 13:51:37.647+00
a3000001-0000-4000-8000-000000000005	9786041000005	Dế Mèn phiêu lưu ký	Adventures of a Cricket	Tô Hoài	NXB Kim Đồng	https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=600&q=80	Hành trình trưởng thành kinh điển của chú Dế Mèn, dành cho nhiều thế hệ độc giả.	2023	\N	active	1	2026-10-12 13:51:37.647+00
a3000001-0000-4000-8000-000000000010	9786041166547	Nhà Giả Kim	The Alchemist	Paulo Coelho	NXB Văn học	https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80	Hành trình của chàng chăn cừu đi tìm kho báu và ý nghĩa cuộc đời.	1988	a1000001-0000-4000-8000-000000000001	archived	2	2026-10-11 13:57:52.132+00
a3000001-0000-4000-8000-000000000007	9786040297938	Cho tôi xin một vé đi	Give Me a Ticket Back to Childhood	Nguyễn Nhật Ánh	NXB Trẻ	data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBw8PDw8NDQ8PDQ0NDw0NDQ0NDQ8NDQ8PFREWFhURExUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OFhAQFysdHR0rKysrKy0tLS0tKystKy0tLS0tLS0tLS0rLS0tLS0rKy0rLSstNzctKzctLTctLTcrLf/AABEIAcoCngMBIgACEQEDEQH/xAAcAAEBAAIDAQEAAAAAAAAAAAAAAQIDBAUGBwj/xABHEAACAgEBBQUFBgIIBAQHAAAAAQIDEQQFEiExQQYTUWFxByIygZEUQlKhscEjcjNigpKistHwJENT4WOjwvEVFiU0VHOD/8QAGQEBAQEBAQEAAAAAAAAAAAAAAAECAwQF/8QAJBEBAQACAgIDAAIDAQAAAAAAAAECEQMhEjETQVEEMhQiYUL/2gAMAwEAAhEDEQA/APoQSCKjAFASCqjImAgKAAAMkMARFGC4AxKUoEKkCoAVAAUAAAUYAIBIywBAVIAAAkABQBEUDAADAAAAABgYAAoAgAAAAAAABCgCEKMAQFAGIKGCIQoAJEMsEYEBcEAAACApAIC4I0AIUAYshkTAEIzLBMAYguABAAAZGUAYshlgjAhGVkYEYKQCoqREZIIIqIZIKAAAChICooABFCLgAgAAKhgAUAACkRkBC4IUCgFAAAAAAAQAFACAAAABgAAUgBA133wrTnZKMILnKclFJeOWeP2l7SNJW3GhS1Mo8MqW5B+jfFg09nkHzZe0+ef/ALWKXT+JI31e02P39K/7NpNtar6GQ8ZpvaNpZ4Tpui+qzGR2kO2Whf8AzJLPjXPgNxNV34OPotfTdHepsjZHxjJHJCICkKIwigAAAIQoAgAAMhQBAABGCjAEAAAAAYoFAEAAEIUAQjKAMQUAYgoAhGUMDEFZAIyGTIARkiIqCGCpABQFCQAyGCgQqCAFAKACQKAAAAAAVFIZIDEpGALkpEjIAMAoEKAAAAADAAMIACgEYA6DtD2v0mhzGyasuSeKK3mTfhLwR03tI7Y/Yox02nkvtVibm08uqOOC8pPifGb9TKcnJye/J8XP3pNvqyLI9D2j7T36+zetbVab7ulN7kV+51UcZScV6qJpqqb559Uv2NsHjinvR4Jrw8yNuVGqKW9B5X3o9UbFCDeVw558PocOV6g95cF95R5mi/VNPejhJ/h4xfhJJ/oNG3a91Hg4tp+fL5M5ek1rXr58meer12FvLGE17v3c+Hp+hJ61rO7xhNfNZ/7jRt6/Rdo3VNTh/Cm+aXCE0fRey/amvVvupe5cs4T+9jwPga1Upe5LmuXjnpj9zttm7WnTfXfBtSg4SXy5r9hrRe36LQOFsbaMNVRXqK37tkU2lnCfVcfM5ppzoAUCApABCkYAAAQFIAIUAQhQBAAAAAAhSAABgCDAAEaIZEAjIXAwBiGVogEBSACFJgCMFwQCpFSAAoJgqAqKiFAoQRkBBgoAYKAAAAAZAwABQAKgUCMhk0YgVGRijMACgCFGABBkuBgCFAAAAAcfaGthp6rNRa0oUwlZJvxXJfU5B819s21Zwro0UHhXb1tnHG8ovEYvyyFfMto6v7RfbdNtzunOyT5vMnnGfy+RhCiPNN58+KNNFaTWZbvi+pz9Jo4WP+HvN5xmWVl+RLdNztxrLpRknVwfHeT4xkbHFyxOCxJJKSxjPzPYbI7D2WYlYt3PJdWey0XYyiEcSjl9TleWOs4v18fnpp2NPdb4YfDib6Ni2ShjdfisrkfY6ey9EXlR/I51eyaorCivoYvNW5xR8Rl2al3e9FNNNxlH9GddqNk21xw4vB99eyqln3VxODqtjVSWJRT+RJzU+GPz84tPimmsI5UZcfXH6n0fb/Y6uSbr4P6Hg9dsm2mbc4vEePA648kyccuO4vp/se2g5Qv0zeVDdth5Z4M+kI+Sexaubs1N2H3e5GDfnvZPrUXk6OVVkMiFQAAEAAEBQBAUgEAwABCgCEKRgAAAAAEBSAAABAwGBAwGBGQoaAxAaIBSAACMMgGQBQLgAuABUhgqAoCKAAAAAAAAAKAAKgEBQgAKY4MiAEjIhQKAAAAAAAAAAAAAM+Le1/M9pJN+5RTp4pPlvWSzj8j7Sz5D7WdJJap38XFvTRXD3c7jWfXoFj55Tp+9sUVl9PQ+v9jezNddUL7FvWT44ayoroeS7F7HUmrZLOWseiPq2iju1xj4LB5uXP6enixcumCisJY+RuSNVRyIHGO1Y7pqnLBznjBwr2i2JK1SkabHwM5Giww6adbrpczzG29KrYSjycuuD1Gqr8To9Yi43syk0+X2WajR2SjXZZUlLPuScYy8G0fduwupnboNPdZxlZHey5OTfFrj58D5V2s0SklNLj1PqHs1T/8AhGiz1hY//Nlg9uF3Hg5MdV6UpEU25owABAUgAAoEAAEIZADEIACDBSAQFAEAAAhQBAUgEBSACFAEIyhgYsjRkRgYgrRAAwABQiGSAIyAAoAApQAAAAAACoAACkKgBQAKAABCgAUxMkBQAAAAAAAAAAAAA6LtrsuGp0N8ZLMq4O+D679fvL9/qd6cfaMM03LxrmvyJVjxuwNGq4RXglnh1xxPRUrCOu0q6dDk3znhqHxPgn0R4su69+Ppyb9oVVYVk0n4LizKnbOm63Qh4b8sHQ17BlOebJ7zl8Tz+5y9T2d06iks8nmMppxNSYzuleihZGSzGcJJ8U4yUjROKPJabQqmTVcnFPpvOS+R3Wi1E1wly6MzlZ9NTGx2Lh48EcTU6qmvO/OMceLMdZrMLHijy2p0i1M3D3pt+eEkSaXVc7Xdo9JF43970Opt2nTdwrfHwawc+HZXT1r34pyfhJHTbQ2HGHvVZjJcscUzWsWf9nH10N5YaysH0HsHw2bpYr7kbYfS2aPDaZOUIykve+GR9B7K1qOjqS4LNsses5P9zvxvLzO2IUHZwCMpACBSAACAAAwAAAxYMiAQFMWAAAEBTECgAAAAICkAgAAEZWAMQVkAjIZGLQAAgFwZJEKgKVBFQAAuAAyAAyMgAACgACgMFIUABgoApCgAAAKkMABkZAAZGQAGRkABkZAAZGQAB162hCzvYQ97d365L7yeH0OfJ8Dq6tnxTdi92b3pb3LLfRnHlys9PRwYY5b26vSdM80l9TsaYN8jiyxly/Fx4cs8v2Odo2eWvXJp1+0q9ZJOOn3KfG6z3v7sTxnaDZW2IKTr1Hf5lHdnGxRdaS4rcxxyfT7ocOB1duhi3l5TfmbmXizryeV2bXqU4wtbsTjF97jDUscUz1ezdE8LfeMo36XRwWXnLS6nIhLjwMtb606Hb9TjiMeb4I6XUVaqDsp0ixOurvJ2yTana1lVQ8z0PaSL92S5qWcnL0Tdtaw2uXJ8WMdTLsy7xfOYaLbNts5zX2enGY99KO9/awdloYaprFsVJrg51/C/PiewnsiLeZucknnDk8GV1CUcJYS6IueW/pMcdfe3i+7lCe61iLzjJ7fY2qpro09UrIRsnBOMXJbzy97l05nlNqvE147ywePuulBvdb3+8jFy5tLPBJnTjz1GM+Lzr7kDCl+5Bvm4Qz/dRmemPBfYACgRlIwBCgCAoAgKAIQoAgZSAQAAQmCgCZGQAGQAAIUgEBSAGBgAQjKyMAQpAI0QyIBkikRkAKiFAoAAAAAAACKQAZIAAEUBAUAAEUgApQACAIgKAAAAAAIAC4IALgAAGjrtTN7jS8Wv9DsTg3ww2/NNrx4nDmnT0/xstWul7nu4wrbzhZz6tv8Ac7TR4wdfq4++lnPB4fzb/c5enng8r1120mt3J0+p1ai+ODDW6/di8vCSydRs6uWstUnlUx6/iLbv0Y46m67/AENrnHPJPgjlaWK3uL/M4O0NFdGH/CyhGSWN2fL1R09dG0Ks2XThbFc4wi4yXpxLIdX7dtt1pxkvLmcHYutjSlGTzGXDjwaZ5Dbe3NRPEK67N7jlyi1FcTXs6OttlX3sVCEZxm3x3nh5xgtn2snWn1VaiElwOu1lmMnE+1YWeRxNZquBm3Zjhp0W2rPfWOjX6nmtK1KVia+Gbb9VyO611uZ/M6jZ2lffSjHjK+zdjHwy0bx9G+32mh5hW/GEH/hRsMaobsYx/DGMPojI9kfLvsABUCFDAgAAApAAAAgAAEKAIQpABCkAgBQIAABCgCEKQAGAwIwABGAwBDEyMQNiRUCpAAEUAAAAQCYFZAMAAMBAZIuAigABgABgAUAoAAAAAAAAAAAUEKAAyMgATJQBrvq3lhPD6SxnBsBLNrLZ3HR6/Tzi4ynu4eUt3oyROw2vH+E3+Bxl8uv6o66p5XM8fLj43p7+HPyx7dXtujeUIZ/pLIQ+TfE7Fa6nSw95xhGPBLlgzsp3sZ6NNep13ajsrXroJylOE4J43ZNRl14rkYwnbre+kXa6ueXD34rCzFOSN8u0UFHMq5Yj8TcX7vDqZ7LjXpqY0worjuRgnnhvve4yT6/M52p2r7tmKISUstRcknLCx4G0vX/l47Wbe4tuKw8uOYfM40O11ccKahh9fhPR7W2upbqWgi8RnFtzrW77rSx8zw+2dgy1061OMNPCKgnGGJy4L3uQmtundn9XpI7VhdH+G3x5I5utoarg3zlHLNfZ/YVVKjXBZzxlOTy/zOx2/dFcF04IxlIzK8ZdHi3/AFkj0Hs/2RvSlrLI8K/cpTjhOfWfyR1VFXe3U0r79sN70zxf0Pp6ikt2KUUsYSSSx6Hfhx328vPn49RQAel4wAAACAUAAAQoEBSACFIwAAAgAAhDIgEAJkAAAAIAKQACBlIwBGUjAjBQBCFIBmVEKAKEAAAAFCAAFIAKkTBkARQAAQKAAGAKgAAAAAAAAABQEAICjAAhQAAAAqIUDC2tSi4vlJOL9H/7I8q7XVOVUucX9V4nrTy/bOr+jsj8WJZxzeDjzY7m3fgy1lpzNLapdTsODWDwmz9s7st2XA9XoddGeMNZ9TyTp7LNtk6JRb3eH7nX6yGob4bqx5HoqJKTGrrTeTrJuJOSyvHz2fOXGxtvwXIlei3XnGF4npL8LwOp1+rjGLy1yOddPK1hXeoJyzyTSPNbU2lvN8TVtPbGfdjyMuyeylrL8Wt7lce8kl95Z5GscLaxllMZt3vYTZkpSetsXurMaV4t8HI9qY1QjGKhBKMIrdjFckjI9mOPjNPn55+V2AA0yAAIAAAgAAAAAAAQAAQAAQFIAIUgEIVkyAAAAAgAAARgAARlAEIUjAAADMAIAikAFARQCKQoAhQAKQqAoAAFIUAikAAoAAAAAAAACQFAAAAAACgQoAAEKBDpe0kMqtfzHdnU7bWXWv5jny/1rrw/3jwuv0PvPh80cWN9tLzF5S5HrdTo8o6u/ZjfA8O3vTS9r8Y7xNNc2jfZ2xr48WzodbsiazhHU26aS4OJuaHo9X2ui17qbZ0Ot2tZa8t4RwZwxzRgyyQ3WW9k9v7Npfxrl/4P/qR4eJ33ZXblOhtnqNS5Knu3Gbgt5rLXHHgjrh/aOPJ/WvrbIcbZm0adVVG/TWRtqlylF9fBrozknpeEAAAAAAAAAAAAAAABCFAEYAAgKAIQpAIQyIBAVmIFIAAAAEAAAAARkZSMAAAMwABQAACBQBSFAAFAhQUAUAAEAgKQoAAYAAAAAAAKiACgJEYGQZAABUAAYONqdfRU8W3VVvwnZGL+gHJQOn2r2n0Omr723UVtfdjXJTnJ+EUj5f2m9pWq1DcNE3o6M4TSX2iXm5fd+RdD6h2l7SabZ9Ts1E07MPutPFrvrZdEl0XmdPszad+qhXfqIV1ua3oVVZcYQfLL6s+H6q9ym5zbnKXGU5ScpS823xPuOxku4oa5Oqtr+6ef+R1JHo/jyW12uOHHj4+Rx5NR58UcqKOPfA8r1NV0YSXM6nU6GL4+pz7a5c0dfqp2cVgNR57X6JZeDrZ0YO31Vc2+KZpjom+ZZTTq41Gu6pSjOuSzGcZRa8mn+520qscDrtfJVxlN8FFN8TeGXbOU6eT7L9pNVsu5z0001vbltM8uqxJ9V0fmfVez/tc0lz3dbVLRy5d7HFtDfXhzifEpSy2/FuX1ef3Kl/vme+Pm1+r9PfCyELapRsrsSlCyDzGUXyafUzPzh2c7Z6/Z/u6e7eq/6F2bKfVJ/C/Q7zRe1facJuV32fUQbz3cqu7wvCMk+BND7mD5xpPa9pJUudunvhqI4xRHdkp5eOEm8Lx+R6vsz2p0m0YN6eW7bFfxNPZiNsfl1RNDvAMAKAAAAADAYCIAAIAwAIykYUIUgAgAQZCsgAAAGQoAjIVkABgADFmRGBACAbACgQFAEKgEBSkKAKABQQAXIAAoRCoAUAAAAAAAAAAAAqghQABxdpbSo0tcrtTbCmuHNylxb8EubfkByySaSbbSS5tvCXqeE1vtV2fFS7mGovsx7q7vuq2+mW3nB837Sdstbrm+9tcK38NFXuVJeD6sukfSfaD26jpIdxopwt1dkeNkZRnCmL8cc5fofFtVbKx95Y3ZZLLlOfvSk/Fsx6cvyC4ougikuKSXyM1yMWZIo12cvQ+l+zXtEp1rQ2tKyvLoba96P4D5s0YVWSqmpwbjKLzGSfFPoYzw8pprDO43b9G1zNklk+edlO3cLd2nWyVV2Eo3ywq7P5vwv1Pewsys54dGnlNeTPBlhceq92OUy9Nu4jh6qrh0Nlk30OLdKb4GG5HXS029LjyJdp1FcDnRrfzOv2tqYVRc7JRhFZeZNL6eI1trenU6hfTxPAdrdrqbdFbzCPxtfefQ5faTtT3idenbjW/inylP08EeRUW2evh4dd14+bm3/rCCNu6ZQhg2YPU8rXukxwM7PAyiv0YVjW8YXV8X+hytHqrKbI3UzlXZDjGcHiSOLQs+8+b/AEN6QHfQ7abUU1P7bc2sLjutP1WD23ZD2mzsthptoqGJvcjqYJx3ZPlvR5Y8z5akXBND9LXbT00Jbk9RRGeM7ruhnH1OXlPDWGmk008prxR+XXzy+LePibbPqXYv2jaWnT06LWK6uVEe7+0f0tclltZS95cGl8iaH08HH0Gup1EFbpra763xU6pqcV5PHFP1ORkiqAAiAACMBgKEKCCEKQogKQCZIUBEBQBAUARkKyAAAAIykYEIUAZlIUAAACKEAGCoIIClIAKAigRAoAhQAKAAAAAAAAAAoAAB1XaXbdeg0tmqsw3FYqrTxKyxvCivrl+SZ2k5xinKbUYRTlKT4JRSy2fBu3PaeWv1DksrTVOUNPXnhu5+N+bLEXbHbvaWpy+/eng1jutN/Djx6OXNnl7bpSeZSlLPPem5P6sqsTOPKeHnpyNDZB8/Ii4ss+nmhBAJEi+BJPLM0AKRFAEcSlA0uDXI7vYva7W6P3a7HOvl3VjcoY8jqsGLj4kuMvtZlZ6e/wBN7TOGLdMs9e7twvo0bbPaTBL3NLJv+tZFfoj5xuoywjn8OH46fNm9btL2h6qzKphXQn4J2S+rPK63XX3y3rpysb6zecei5GKSJI3MMZ9MXPK/bjuvPMyjWbMFNMsUgkUyA0xWW354Rm1wfo/0FfL5sykvdfo/0A16de6vQ3I16f4ImSYGeSNkNcpcQNsn+xPvevg8cTCUuXqiyljj4ZA52z9s36W1T0ts6rFzlB8H5SXJo+qdlfabVdu07QxRZwX2hLFMn/WX3f0Pi1Es5l4s5G8TSv1HCcZJSi1KMlmMotOLXimjI/P/AGX7Z6rZ8kq5d7p1wlprG3DH9T8LPsnZrtRpdoQ3qJYsX9JRJ/xIP915mdDuwCAAABAAQCFIUCBkCAAAAAAQoAjBWRhUDYIAIUgRAGANhSFAAACgACoIIAZAiKAKAAAAAAoAAAAAAAAAAACkML741wnbY1GFUZTnJ8lGKy2yK8P7V9vdxp46Kt4t1We9afGNKfFfNnxyzkjte0e15a3VXauXKyTVceka1wivp+p1M2biNUnyZplhSx0kbmarEmvPoUZR+FGUnhGNbzHPy+Ym84QCtdTYSKGeIFQmxEwm+IFizNM1oySAycjByBGAyTIQIGS4IjIoEKQCouOBDJcgMIciz+F+j/QiMrPhfo/0A16f4F6FiY0/AvRFgwNnQ40ZZz6m+x8GcWp/qBuk+K/30JfLEJMxl8Ufn+g1b9xgTT/CjbKWEcSt8Eb5LgBsrfDzZztla+3T2xvpm67a2nGSfPya6pnX1C2zHqwPvvZ/t9oNRRCV+oq02pxi2qye77y5tN8MPmen02prtgrabIW1y+GyucZwfllPmfldRl48/wAj0XZbtJqtnT39PNuv/maebbqsX7PzM6H6LB0vZftLp9o1d5RLE4pd7TLhZB9eHVeZ3RFQAACAEEZMFIVAAAAAQAAAICFUIAAIwyBBgADYUhQAAAoAAqAAFRSIoBFIUCMqIwBkCIoAAAAAAAAApABTwHtd206tNXoYP39W27cdKYdPm3j6nvvy8+SS6s+Ce0DbMdZr7rq3mipQ09EvxRj8UvnNz+WCwedbNczJmufI0MZM02+PgbE+BhJgKnwb8cfXBmjVR96Pg+BuQGZAgBG8GC4mckN0AmZGKMmBhkMhWBAQBVARcBFGDKuuUmowi5yfKMYuUn8kd9oOxW0r/g0s4L8VzjVH83kzuL4158pz9sbG1Gjs7rUw3JPjFp70JLxTRwHyLtLNMYmVnwteTIv+x7fsl7PbtbHv9TKek0mMqSSV1nDopJ7q82S2RqY2vBV/AjOpH0HbPsunBZ0F/ex5qGpShOXpOPD6pHi9bsy/TSdepqlVPpvLg/NPkxMpS4WODqXwZxqDZq5dDXVyNMs8+8i6r4WYr4l6mV6zn5gcap8jl4904VBzugRNOYy4z9C0PGTXB+8/MK39cmdbMJIKSSA7DYu0rtLbG/TzddkHzXKS8JeKPtvZPtzpdfGMZyjp9XjE6ZtRUpeNb6p+B8EoY5POd3Dyn1T8iWD9S7j8H9CH5qq29q5uGNTfinCi3dPCxyxx/U+idkfaZh9ztWSccYhq4xbkuHw2RXNeaJofUQadHqq7q4XUyVlViUoTjycfE2kUAIAAAAAAAGQARlZAIARhAhSAQDAA2lRCgAAARQAKgggBSkRQBSAAwAgKikKAAAADBEgKBkAAAB4/2n7cek0TqreLta5VJrg1XjM5LzxwPiMlwwe59smrctoVU592nTwa8Mz4s8LI1BrhLh6EciPg/KX6hlGHL5mEjOT4GpPiBjp370zko4+m+J+cY/XLORwAzSMXLiiylwNdPPIGUmRyIAMomTJgrAwKQoVBgHpOw/ZqW0NQlLMdLS4z1E+suqqj5vqZuUk3VktunK7Nez/Wa6tXrcool8FluczXjGPh5ntdl+yfTRalqbrL8fcr/hxfz5nv9PBJRjFKMIxjGEYrCjFLhFG5zxyX0PPeS16JxyOp2b2X0WmlG2miFUq1iLXvNefE59+rhFP8MVmTfJL5jcsnLM2lH8KMdTXWliWMPmn4eDRi1qSSup2nszS7Rp3LYqUJrMJxfvRyuEo+Z8b7W9k7tnSzP+Jp5t93cvyUl0fE+2y1GnglFOME3uxxhL0R1G39nrV0Tpl/EhPdfBreWOqLjncVy45k6H2X9k6VRHX6quNk7uNMZrMY1p4Tx4s+i2LK99JQWN2PLGPHx9DrdjpKuNW66o1ZUIPHCCeIm2UJ2vflLcpT5LhKSX6C5W1ZhroltKtzlWuO692WMPDaz+hxtq7Ko1dbrnGMk11S/LwOQq9Jp09xQrUnvSk2syb6t9Tmwog0muDaymmSbMtPjfaL2X2J72lsXiq7uXop9PmeD2jsu/SWOnUVuqzmk+MZL8UX1R+n7U0sSSkuWcfqeN7bdnKtdS4L3Loe9VP8LSfD048jpjya9uN4pl6fB2ZrimzftPQW6ayVN0HCceXhJeK8jV935Hol289mnCp+LBz2uB18OEzsOhUa941VfEbZdTChcQrkSXA0Jbzwb7OTFaUVlgWTUEcWKlPnwjzbMrbU2t7kuniYuU7PchH4sKKX3vJeINN+nkuOOSwkciEHKSivvcD0vZ/2e6y1KV27panj+ky7WvKC5fNnvdidl9Jok3GPeWtcbbPefyXQ4cnNjOnfj4Mr7NgT+z0VV0ylFQil5fQ9Ns/bKm9y3EJvgpL3Yy8seJ1Ns1/vgdbqZeB5MeSy7evPixymnviZOj7M7X71Omx5srXBvnKH+p3h7cb5Tb5+WNxuqZABpAhSAGAAiMBkAEZSMKEKQIEKTIG0pAgKAAKAABSFAqBEUAUiKFAAEUpCgAAAAAAAAB/vzB5zt32gWg0jlF/8RfvVULnhtcZ48FxA+U+1LWV27UtnVLfjWqqW1y34RxLB5mbLqMtPLbfFtvi2+bZrhLgjYxnHOfy9TCEsr/fM2eRrfB+T/UDGa6GlPK8zkM4ueLXzA2VLj8jOTNdMvea6Y/dGyQGuTORWsI1RjxN8gNaKuZGZRAyI+QDIMSoHY7D2NfrLFVp4OTyt6f3ILxkyWye1k217H2Vdq74aehZnN8ZfdhHrKR987N7Fq0dENPSsRisyk/inN/FJ+bOP2P7I1aGvEfetml3trXGT8F4I9VXQkebO3O/8enGTCMIQ4F3UjZLCOq2ttONUG88lkmtLO643aHtDXo65WWPEYrLfgfEe2HtGv1matO50U54ybUbZ/TkavaB2uernKimTdSfvy/G/BeR47SUStnGuPOcks4zjzO3Hx/dY5OTXWLstJrNXbOMnbbOFEoWTcp4jBJ5y38mfR9n9oJ91vKyLrjnNmeCXqfMtqanLdNbSoqe5FJJOTXByk+reDhZeMccceGepc+OZJx81w/6/QPYntHRbp3bdfF2WScd2Uo+6l0Z1XtG7bOqh06aTTsW5BwxiPi3I+JJf7/1Ox2Zqt2SpniVNzUJJx3nDe4b0c8nnBJxSNXn3u67YajbWqsjGM9RbKMeKzNrr1PqPs67a6iyMNPOUJyjiL714aXk+p8i1NThOdcs70JyhJPnmLaf6Ha9mFL7QlFtPdk8rnwwazxmmOPO+Xb9QUalTSzz/ACNer06kuCXr1Pnuxds6iqKU25x4Yb5o9zs/WxnFPO94vz8DzbenLDXceW7X9k46yCjKCUs5Vq5x9D5D2g2Ffopd3dF7v3Lce5NevR8uB+lXJNHWbQ2XTfCVd0I2QmvehJZT/wBDeOVxccp5Py7YsSOZQ8o+gdrPZjNOVmz5b0Vx7ibzJeUZeHqeU0XZLaMp93HSW5zjLworzzk7zOVxuFjqrBpY82es13s92nXDedMZeULE2jj6XsZr5rCqUPOc0sDzx/Twy/HnLbMHDsucj6DpfZhqJ4d2orgusYRcpfU73Z3sw0dbUrZ23NeOIL8jN5sY3OHKvnGwOz12ssVdaT6ynLhXWvGT/Y+wdmuzWk2eouO7ZqZLEr7VFyb6qC5RR2ug2ZTp493RCNceqXV+LfU3WpPmk/2PLycty6enj4pi2zs65/U4V0nlsWz48zjWy8zhY7xLZHCtN0pGmUkIONVOdc42VvdlF5T/AGfij22x9qq9KMsRtSy49JecTxraNkdQ6/fi8OHvRa6NcTthncXHk45lH0EGvTXb8IWfjhGf1jk2HsjwBCkKAYyAiMhWYgGQpAoyFAEIZEYG0ABFAwMAEUiKAKQoApABUUiKAACApSFAAAAAAAGABx9oa2vT02ai6W7VTFym/TovXofBO0+37doXyvt92K92qrP9HDPL1fU9l7Ydrvfo2fGWIQj9pvSeN6Un/Di/RJvB81f++RqDGRo5M3s1yQGJjYuBkjXZIDCU3g412eZL72nwNU9TlYwUbtJ8Xyf6o5Mzi6WScvPDOWCLUZzJBGTX+8Mi6YGUEc7Z2xtVqWo6eiy5vhmMXu/N8j22xfZXqbMS1V0NPHrCtd7b6Z5Izc5PbUwtfPf1bwlxy34LhxPW7D9nO0NXBWbsdLXJZjLUZUmvFR54PqfZ/sNs/RNTroVly/59/wDFsT8s8F8keockcry79Ok4/wBfK9i+yaKlva2/vkuVdMXVF/zSbyz6NsnY1Olgq6K4VwXSKxn18Tnby58Pm8/qHbjzMW79ta16Z8jTbekabtR0T4s4Oqs3E5zawuJLk1MLWes1mE2+B8x7e7elOFmnpk9+UXlrovD1O27Q9qc71dK95cM9I+Z4juZSk5v3pSeW31ZJe9u0w6fPWdt2aj/HcuW5VbLe5qL3eDa6+hx9s6N1XWLHuOUnF44Yyb+zeq7rUQUo70LnCmaUt14nJJSTw8NPieyXcfPynjdV3/s/7G/b5WWahThp6XuSSeJWWcVup9MPmc/bvYfS6Zzseo1K01FkKNTc6qpqNsmsV1ttOckpLKwfT+wez416OMF72bdS5SajvOXeSW9LC5v9zma/s1O1X1Rekt0uqu+0zo1mmsvdVzSU7Kt2aUstb2JYw2+OOCg+QbQ7MaPS1QvrhdtHT3XVaWq9WurvLJJPFUYrks4zJ8zl9pewNK0UdfoO9jHEZ3VWy33XBvdk3w5xfP0Pquh2TrdLRDQ0fZJU1KUadXa5xshHLll6eMN1yTbxiSXI3azSQo0dlTzOurTXRm54cpLu5OTljq+L+YtH5y7SVpamc08u+MNTJLkpWLeePJ53l5SRzuwlG/rYx54qtb+W6cPtLx1mpy+MbFCbzhOyMIxnjwW8pHvvZX2clFS110d3vcVUKSabhnMp48HwJnf9WuObye30mylu4x0QjVOh70E3HrH9z09dSxwwa7tMnnhzPI923B0m0d9HLVnU6jWaPcl3leUn8SXLJvp1DxhpkmSXHbl5TkbbIJcUcKy9LjyOLbteOcZ8htnx07C/UcHk6Od+JN8vQyv1ifU4asTZmt43TnfbUX7WaYNLwEpRMts5ahmmepZJ2I487CC2ajiced5jO00TsGl2ylazDvjjzsNMpssg5Vlxotu4YMFxIouUoQXxTlGK4dW8GpizX1DZUWtPRF81TUv8KOWYwjhKPSKjFeiWP2Ke2Pm32pACgRhgIjIVkChGUjABkyAGQQEG4IAqLkAACkKAKQoApCgACgEUhQBSACgAAAABVhc+XN+i5kOPrZ4hhc5cPl1JldTa4zd085oOzGncp36qEdVqrpynddat7LaxiK6RS4YOTf2S2dZ8Wkq9Ypxf5Ha1x4GNt3SK3m/A8Nzu3vmMeJ2v7MNLNN6W2ennxxGT7yvPRPqj5zt7s7q9DLd1Fb3M+7bD3qpL16H3yNMnxk8eSMdTs+FkHCyCshJNOM1vRefI6Y82U9sZcONfmyX+/Q0W8j7ntnsfs2FcrJaWEccF3ea234e6eV2l2H0dabkrVKMFdNKct3cfwxj1znn5Hox5pXny4rHyiUWanBn2Sj2d6LurLpd5NVQUuFsoqUmm18kZ7H7DaLeTnTGzriTlKP0ZflifHXyjY+zbru9uqrlKvTQU7pRTajvSjCKXi8yXD1PSbO7H7Q1HGvTWRj+KzEI/nxPteh2RTSowpqhVDfg5RhBRjLjjiuvM76NK8DnebL6jpOLGe6+R7K9ldsmnqr1BcPcqjvP6s9psn2fbPoxLuVbNffue+/oer4Im8+hi5W+63JJ6YUaWEFuwioxXJRSijY5LoRsxbS4vglxbfJLzMtJKbOPPUc1Hi11+6mab9Vvcnu1/i5OfkvBHQ7U29GtbkOfLC5kamO3canWKPvTlvPz4JeiOn1e3WuLmo+R5LavaJRTldYq49Mv9ubPJa3tjVl7kJ2/1pYhF/JmpjlUtwx919V/+Ya0t5y44+Z0G09uO5tJtR4/M+ZajtZfJ+5GuteGHL9TPTdr7I/HVCbXJpuP5cjXwVP8AIwe0hp+Hvc28y9TbGlJZxnw82eIt7Z3P+jqrh65mziQ7VaxSbc1Ly3VheRfhyT/IxfQq9ixm8zipNrimsnXbV7DwclOh9xLO9lLMc5ynj1Oq2Z29lD+mqyvxQZ7HZnbTRW4crIx8p8GNZ4tzPjzmq9f2TvdanVakoSlGyt8o70l78fHnxz5new1joco6pvu96UqdU17ji3lQsx8MlxSfJrB5HTbVov8A6K2uXhuzWUdD2g7aXbPlCqM7ZwujZJRVsMRaaTjuzi1jjngawztuq48vDJPLF9G1G26Un3c1fZj3YV+889MvlFebPPdoNddbp3VRGWou7uML+74Ub29lQWerfBtfdz4nWdka79dUtZrJSdU3vUafju7v45pYT9D1s1XGOJNJLhhe6Ms1w4Ot14bst7MqlP7Vr7PtNkpO3ul/RKcm295/e4v8j6GtPCCwsLC3YxSSSXgjptV2i02ng3OyEIrinJ48jxm1fadRBvuM3S8YrEfqYvlk6axwfT42ZXBmm7VJcz4xd7U9S3mFUVH8Lm8/kH7TbJfFRx8rFgvhl+M/Jj+vpm0NppZXj+p1K2vKOcxbXSUXn8j5ztHt3bNPuqlCT+9KW/j5Hv8A2UaX7bobdTrYq2ctTOFTfDdrjCCwsdN7eM/Bftbz4srNoufXBpheke9r2NpYrCor+cE8mcdl6dcqKl/YRr4mLzz8eBlMxjcz6MtJV/06/wC4jjX7H00/iph6xW6/yHxJ88/HhftDI9Qz2Muzemf3ZR9JvBql2X0/SVi/tIz8Vb+fF5HvWYubPWS7K1dLbF8os0vsnH/rvH8iJ8WR8+Lys8mtxZ7KHZWvrbN+kUjlafs7po807P5pcPoizipefF4ajRzseIRlN/1Vk7nS9k7pcZtVLwlxl9EezpphBYhGMV/VSRmbnFJ7c8ue/Tycux3Dhcv7hzdj9mK6Jq2cu9nB5gmsRT8TvyG/CRi8uV+1bJkENuasgABkKRhEZCsjAEZSBUBQBAUAbQAEUAACkKAAAFRQABQABSACgACoBAAAABwr3vWYXKPB+pzJywm3ySycHTfifNvJw5r1p34ce9t+6ZV1JeRUbEjzyPRbVwGEimtMuo2xHesohhOKk5zz8KSXM4M6c227734qajF813e6nH58/qc7aMc6mnLwoqbaz8XD4Tg12VRtuUXvLvIuSl91ySxH8/yOkc77TRabd0msrWcRnNQ8VHdWF+Rhs+agly85PmbtBre8t1VK+/CufLHTdfA6DSaiXwy5xe4/VPDNI9dLUZjw48mn6NHYxnlJ+KR0OknwXkuZ2FOo93GeRztdJHO3kYuw4Ur0uJ1W09vV1NQbbnLlCK97zfosrPqZ2rudZr4VLem0uSWXjLfJHRy213kN66O41OW7DPBrPDe8TzWt2jvvfvcZzi3KMVwhDpjz5ZPJ7d7YwhmNb76zlw+CL9Tcxt9HU7r2W2+0ihGUpTUYrnKTwvkfMttdr7LJOOn92P8A1XxnL0XQ6HaO07dRLetm34R5Rj6I4TZ3w4pPbhnzW9TqNl10pvenJyl+KTbf1NbYGDs4IDNRMlADXgyjA2KJkogYqJk6smcYmxRCtdMZQe9CThJcU4vdZt1mpuukpXWSsko7icnyiDXzY1Pa7uns9m+0bUabSV6aumMp1RUY2Sb3cdMo6PaXbPaOoeZ6iUE/uVe5H/U6to1ygYmEavLl+sbtRZY82TnY/Gc5S/UwyZbpGjbG9+xMyRiScsBGE5ZfHknln6S9mOl7rY+ii1hzhO5//wBJuX7n5qSzw69PV8D9Z7J03c6fT0pYVVNUMekUSrHLABlQjKRgQAARsZDIAyAAAAAEKQAAAIAGAIABGQrIwBGAwIAAAAA3AFCAAABAAUpCgUIhQKCIoAIBAUAAUEKAAAHF2jZiGPxNL/U16VGG1XxrXmzbpGsI8vL/AGezimsHJijNM1ymjVO9GWnJc0ap24ODbq0jjS1LZm5NTFwu0GojG7T2TliEJ7zbfDk1/ocTW2P7S47m5O6rec/uWSTai15rKyZber7yvx3Wpfny/L8zrr9RK2mF0ZKLU7Le7k3ndWYyUX04cMHSXcc7jqt+z9oJ62VnBR7uul8MYby8fJnD2pJ06myK4RsfeRfk3xx8ziV3uM7e6w434ujx93e5Sx88P5mzbGq76mE+HfU4Uo8cvxNW6rE7judLrFur3vkbZbVhW3x4JZb5pHh57UcMKxtZ4KEfifq+iOn2r2jhDhOWX0pqeV/aZPC1uZyR7LW9p3blaf3o5cZTaaXyX7nktp9pqdPmCk7bU23h7z3n+KXL5Hkdo7cuuThnu63/AMuvhleb6nVN/wC0dceGfbllzfjtdqbdvv4SluQf3IN4+Z1UmYsHaSRwtt9hRgzjEqJGJsUSxibN0DBRMlEzSMooKw3SpGe6VIDFIyRQBg2RFAGTZrZkyMDDBGjNmLCMWzRN5M7JEjEDm7B0ve6rS1Yz3mo08MeTsWfyP1Z5eGF9Fg/OPs00fe7W0UfwTla/7MX+7R+j/wDf7masCAjIqgmQAAIADQAEAAAAgAAgAAACAAAQAGYsrIwAIADIGQCopijIDcVECCKAAKRgAVBAIClIEBSkKACIVAUABQpChAAAdZtxYjCa+7LEvRrgcKrUtLmd3qaFZCVcuUlheT6M8ddKdcnXPhOLw1+jPNzY97e3+PlLPF3D1rZpnqumTqXqHx6YOLqdobvBteuTg9Pi7iy/zOPPVY6nRS2hObxBSbfBbqycirZWuu+GmyKfWeK0/r/oWYWs3LHFy7desNPinzPOz2iqbLIT41zTUIvllvL+v6npqOxupl/S2VV+WZWS/JYOz0/YfTY/jyne/J93H/Dx/M64cdefk5ca+aJzcnVXGXCWalH35vK4pJdOaPQbK7Ga6/ErWtJVJLeU3m6Xouh9I0Gy9Pp1u6emFS/qri/V8zlP9eB3mDz3O/T437VthU7P0mk+zue/bfZG2yUnvTiq84+p8pu5/Q+t+3zUvvNn0fd7vUajHnKSj+zPkdvP6HWRzta8kZcF3SoxMlEsUZ4AxjE2RiWKNiQEUTJIIyQEMoomTOIVAUAQjMjFsCBlMWwJkIoCMWapyM7JYOPJgHxN9cTXXE5UI8APfexPR720bbumn00/71kkk/8AC/qfbz5d7DNMu71t3Vzqq+Sjn9z6iZqjIymJFUEDAAEZAbAAAAACIACArIABAAIAUBkEYEZCshAABRGTBkyAVAgyBvAARQQAUAAVAACgAAigICgACghQoUhQgEAAOs2zshahb0XuXRWFJ/DJeDOzBLNrMrLuPD27E1vwxrXhvb63Tn7N7G1r3tXN3z57kcxq+b5s9SDE45HXLnyyadLpa6Vu01wqXL3I4f8AqzdkA6OWwoIAKUhB8P8AbpCS2jTJ/C9HV3fku8nlfU+ZzX6L9D6N7btXv7SVf/4+l08PnKTm/wDMfPJLl6I3ErWolwZJFSKiJGeCxRk0BIo2EiithUKYlAqMkRFbAIpjAyYEIVmGQEiJDI3gLgS4FSNF8+iA1zlkiREbIRCN1MTfgxriZMK+x+xKGNHqpfi1KX/lo+inhvY3XjZjl+PU3/4Zbp7kxQIwAoGCMAwCAUEAAAgAAAADFsAwQoDIyDHIFyMkyAIAADMTIjAIEAFIAByCkCCKAQCggApSYKAAwAMgQoFBEUCghQoikyAigAAUgAoIAqggAFIUCkAXh6L8wPzv7WJZ2vrOPJ0xfk1CP/f6HkGuXojvu3trntXXybz/AMTZHPlE6SS5ei/Q2ywSCRlgAZREixQaCskjXKRnJ4NWQjNAJjIGSHMkUbYQCqlhGps2WeBqkwg5GG8SUiIC5M4RMYLPI3SSishWu6eEcTOSzlvMJBBI5FUTXGJyq4gZxRJszwarWFfffZVVu7H0vTvHfb/enk9Yef8AZ9VubK0K/wDAi/zPQGAZCkYUYIAKCFAMhSAQFIAIUgAgAEBTFgUhABQQAUgAAjDIAAyQCkAyByQAECgYAAYGABSFAoAAFRCoAUACgAAEAgKAAIUDAAABQAAVAIADKte9H+ZfqYjexmX4U5fRZA/LXaazf1urlz3tTfj+9/7HDmv0Q1s3K62T+9bbL6zf/YszbLCRj1M2Rc0BnIxbMpmqbAlkiRMMm2KApUXdNkIAK4m0JGM2Fa5yOPORbZmpcQKjdXXklVeTlpJIIxilFHA1F288GzVX54I0VwAQRsSLjCwZ1xAzqgciKMYRNgVJs41r4G60493KXlFgfqLYdCr0mmrjyjp6cfOKZzTi7If/AA2nb59xTn+4jlGAIwxgKAYGABCkYAEAAAAQgAAhSACEAFBAAAABkDZADIA2AGSZAAAgHLAQCKAAAAAAAClIUAikKBQRFAoIUKAAIoAAAAKAAgAAooAAGFq92S8YT/yszMZ8n/LL9GQfk/Ur35/zz/zMqZnql/Es/nn/AJ5Go6MrPmIcyT5myMcLIGuyRobzyLbPJlXWAhA3xgZRhgzwFSMDZFFSwTeAkmca6ZnbYcKyeXgIN5N1NeSU1HNrhgCwikjiaq/ojPV344I4ldbk+IGNcGzeo4RshDBjjIGKXU31xMUjfCIVkkAY2PCA1WS4mqUW8pdU0LH0Nunj70f5o/qIP1FsxY0+nXhRT/kRyGa6MblaXSupf4EZnNQAAAMkyBSDJMgCkBRACACBkAZABBAUhQAyTIFIwyAGQEyADZMgBkAEAAAcsAFFAAAAAAABUykQAqKTJQCKRFAFIUAAigAAAGQRsCgAAAAKgQAXBhfLEJyfKMLJP0UGzNnE2upPTahQ+J0XKPruMD8vah5lJrrKb/M1OJl1w/iXB+vUyNowhDjl8kYai3ojK67CwjjxsXUIyqq48TlxicdXxRqnqm+EQOwyjF2JHBTmzZXXJ8wrf3meCFksIrcYLzODbY5MCW2bzwjbTT9S1VY4nIqj1Azpjgw1N2F5mdk8HFUHJ5lyQRqrrc3lnJUcFbUeRhvgZNmLYbLCOQM6oG5ESwFJcgqvxOJdbxwZanUJe6jhOYHIybtNJb0f5o/qjgZyei7E7Bt1utopjFutTjZdLjiFcZZy/ogj9KU/BD/9df8AkRmH4LgsLHpjgDDQCAAyFIABMgCkGSAATIAGIAAAZAAmRkAQEJRSMBlEyRsMAQFIQUgAgAAbHMABRQAAAAQDAYIqAQCqUxMkARSIoAAAUEKgKAAAAAAAAAAAAApHjjvYUcS3m+SWHnIOp7Wya2frWm0/s9nFPD6AfmzaNeLZuPFd5Yk1y+JmieX/AKHLn+0f0NE+ptHEdMpdMepVpPF/Q5MORkBxvsS55bLTp1nl+ZzFyNNoGTlGJot1XhwNE2awjKc88zZTHwWTXFcTsKlwQVhCDfMznZhYRnLqcSYElPIdngazbUESNTfPgZd1g2lkFjVGGTcuHLh5sseTOu1cnnm+fiBy7L4rm8+hxrdW38OEvzOKZwQROfHmzZCmUuSOy0sFhcF9DHVPHLgBrroUV0cvN8D23Z/tz9gp7jQ6WqM54lqNRfY7LLbMeC4KPgj55OT8RW+QV+guwXbeW0bbdNfCuFsK++jKvKU45xLh5cPqe1PhXsof/wBVo86b0/TCPupiqEZWRgCMpGAZCsgAAAY5BGUAQpABCmIAhSAACEoZAAEAAAjDIwGSkAABkIP/2Q==	Câu chuyện về tuổi thơ hồn nhiên của nhà văn Nguyễn Nhật Ánh.	2008	a1000001-0000-4000-8000-000000000001	archived	9	2026-10-11 13:58:10.759+00
a3000001-0000-4000-8000-000000000004	9786041000004	Tuổi trẻ đáng giá bao nhiêu	How Much Is Your Youth Worth?	Rosie Nguyễn	Nhã Nam	https://images.unsplash.com/photo-1495446815901-a7297e633e8f?auto=format&fit=crop&w=600&q=80	Gợi mở hành trình học tập, trải nghiệm và định hướng bản thân cho người trẻ.	2021	\N	active	1	2026-10-12 13:50:55.327+00
a3000001-0000-4000-8000-000000000009	9786049855634	Đắc Nhân Tâm	How to Win Friends and Influence People	Dale Carnegie	First News	https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=600&q=80	Cuốn sách kinh điển về nghệ thuật giao tiếp và thu phục lòng người.	1936	\N	active	1	2026-10-12 13:50:55.327+00
a3000001-0000-4000-8000-000000000008	9786041186248	Tôi thấy hoa vàng trên cỏ xanh	Yellow Flowers on the Green Grass	Nguyễn Nhật Ánh	NXB Trẻ	https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80	Thiếu nhi, tình bạn và cuộc sống ở nông thôn miền Trung.	2010	\N	active	1	2026-10-12 13:51:37.647+00
a3000001-0000-4000-8000-000000000003	9786041000003	Sài Gòn: Chuyện đời của phố	Saigon: Stories of the Streets	Phạm Công Luận	NXB Tổng Hợp TP.HCM	https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80	Những lát cắt về con người, ký ức và nhịp sống của Sài Gòn qua nhiều thời kỳ.	2022	\N	active	1	2026-10-12 13:51:39.295+00
a3000001-0000-4000-8000-000000000006	9786041000006	Việt Nam phong tục	Vietnamese Customs	Phan Kế Bính	NXB Văn Học	https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80	Khảo cứu nền tảng về phong tục, nếp sống và văn hóa truyền thống Việt Nam.	2020	\N	active	1	2026-10-12 13:51:39.295+00
a3000001-0000-4000-8000-000000000014	9786043829518	Nghĩ giàu & Làm giàu	Think and Grow Rich	Napoleon Hill	First News	https://images.unsplash.com/photo-1495446815901-a7297e633e8f?auto=format&fit=crop&w=600&q=80	Bí quyết làm giàu được tổng hợp từ những người thành công.	1937	\N	active	1	2026-10-12 13:50:55.327+00
a3000001-0000-4000-8000-000000000011	9786040110701	Hành trình về phương Đông	Life and Teaching of the Masters of the Far East	Baird T. Spalding	NXB Tổng Hợp	https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80	Ghi lại hành trình khám phá những huyền bí phương Đông.	2012	\N	active	1	2026-10-12 13:51:39.295+00
a3000001-0000-4000-8000-000000000012	9786043821147	Sapiens: Lược sử loài người	Sapiens: A Brief History of Humankind	Yuval Noah Harari	Alpha Books	https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80	Hành trình tiến hóa và lịch sử phát triển của loài người.	2011	\N	active	1	2026-10-12 13:51:39.295+00
a3000001-0000-4000-8000-000000000013	9786043822717	Doraemon - Truyện dài: Nobita và vương quốc trên mây	Doraemon: Nobita and the Kingdom of Clouds	Fujiko F. Fujio	NXB Kim Đồng	https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80	Cuộc phiêu lưu của Nobita và Doraemon trên vương quốc trên mây.	2005	a0588a73-2671-4407-9aca-b228e203baba	active	2	2026-10-12 13:52:01.657+00
\.


--
-- Data for Name: booth_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booth_assignments (id, booth_id, event_id, organization_id, status, assigned_at, assigned_by, released_at, release_reason, source_hold_id, qr_token, qr_revoked_at, period) FROM stdin;
e673369b-21b5-41c2-a023-3cd40ccc51be	c5966a62-03fe-4093-ae26-4faa7a102a8b	daa1f312-395e-43a2-a91c-00f3a3d50bbb	f4b638e5-2712-46b6-a6eb-ae50077cb0e3	active	2026-10-07 02:52:56.894361+00	\N	\N	\N	\N	b26504b7-401f-46aa-ac8d-a35524928cb3	\N	\N
cc8770d2-a9ae-4b1f-a9c1-a97f4f8c9b16	cff5ef63-f6a2-48a9-ae8e-e805566ea654	daa1f312-395e-43a2-a91c-00f3a3d50bbb	099484c0-25dc-40ab-a189-91d8ab2005bd	active	2026-10-07 02:52:56.894361+00	\N	\N	\N	\N	fa3e426c-dd73-42b1-9de2-4ce0e1186328	\N	\N
bb8770d2-a9ae-4b1f-a9c1-a97f4f8c9b02	e757df4c-4212-4f50-af7f-bb2c38f6a9cf	8e98d3f6-859c-45ca-ab9f-508d54e8f932	b85174ff-d92a-4e43-af7a-abd64e0ac3d6	active	2026-10-10 11:38:29.616+00	\N	\N	\N	\N	965bba44-fc3f-495e-9ccd-0ab377efa96c	\N	\N
bb8770d2-a9ae-4b1f-a9c1-a97f4f8c9b03	2291365a-10b9-445c-a44b-ad5f0261d2d1	8e98d3f6-859c-45ca-ab9f-508d54e8f932	a0d31fd8-f849-4040-a088-fa919189f072	active	2026-10-10 11:38:29.622+00	\N	\N	\N	\N	5c464e52-5b76-42aa-a37c-cad838cdc43c	\N	\N
\.


--
-- Data for Name: booth_cancellation_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booth_cancellation_requests (id, assignment_id, requested_by, reviewed_by, reason, is_late, status, submitted_at, reviewed_at, review_note, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: booth_change_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booth_change_requests (id, current_assignment_id, target_booth_id, replacement_hold_id, result_assignment_id, requested_by, reviewed_by, reason, status, submitted_at, reviewed_at, review_note, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: booth_holds; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booth_holds (id, booth_id, event_id, request_id, status, period, expires_at, released_at, created_at) FROM stdin;
\.


--
-- Data for Name: booth_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booth_requests (id, event_id, organization_id, booth_id, kind, replaces_assignment_id, status, hold_id, note, is_late, submitted_at, reviewed_at, reviewed_by, review_note, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: booth_visits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booth_visits (id, event_registration_id, booth_assignment_id, user_id, visited_at, scan_token_hash) FROM stdin;
\.


--
-- Data for Name: booths; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booths (content, id, location_id, code, name, name_en, publisher, category, area_name, dimensions, open_hours, description, description_en, image_url, image_alt, image_source, image_license, op_status, is_deleted, deleted_at, deleted_by, created_at, updated_at) FROM stdin;
{}	6d2df04d-8992-4959-a787-6fdbf3c55804	eca9f427-9189-4548-ad2f-2b33b4f1f179	B-07	nxb 1	HCMC General Publishing House	NXB Tổng Hợp TP.HCM	history	Khu A	3m x 3m	08:00 - 22:00	Nơi tập hợp những bộ sách nghiên cứu công phu nhất về lịch sử hình thành Sài Gòn - Gia Định, các công trình khảo cứu văn hóa dân gian và hồi ký các nhân chứng lịch sử.	\N	https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	t	2026-10-11 13:53:47.596+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-11 13:53:47.598+00
{}	88266c1a-e23b-4235-a1da-7652da4b4639	2a0ec771-a791-4a7b-af72-0d3826c99871	B-08	First News - Trí Việt	First News - Tri Viet	First News	history	Khu A	3m x 3m	08:00 - 22:00	Gian hàng nổi bật với dòng sách truyền cảm hứng sống đẹp, vượt qua nghịch cảnh, nghệ thuật lãnh đạo và các tác phẩm bản quyền chuyển nhượng quốc tế.	\N	https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-10 02:52:55.534303+00
{}	5b8481d3-dc49-4669-a850-0a21d33d8982	1dd0b5d5-3651-475a-aab7-aebf6d628273	B-09	Đinh Tị Books	Dinh Ti Books	Đinh Tị	children	Khu A	3m x 3m	08:00 - 21:30	Gian hàng thiếu nhi đầy màu sắc kỳ diệu với các dòng sách chuyển động, sách lật mở và bộ bách khoa toàn thư trực quan sống động cho lứa tuổi mầm non và tiểu học.	\N	https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-10 02:52:55.534303+00
{}	a3b9daeb-8542-4694-ad9e-0a68bc44aae5	7aa9a164-3a8b-4f26-a0dd-5b84690818a4	A02	Gian A02	Gian A02	Nhã Nam	Văn học & Nghệ thuật	Khu A	3m x 3m	08:00 - 22:00	Ấn bản dịch thuật văn học hiện đại.	\N	https://images.unsplash.com/photo-1507842229458-574a413d5089?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:55:10.388+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:55:10.389+00
{}	035e284f-91e7-4f0a-ae81-a3dc356c7fef	92522c68-e53f-4e54-ad29-651d6f89ca79	B-11	Gian hàng Nhà Xuất Bản Phụ Nữ	Women Publishing House Booth	NXB Phụ Nữ	literature	Khu A	3m x 3m	08:00 - 21:30	Trưng bày các tác phẩm văn học đương đại của các tác giả nữ danh tiếng, cẩm nang nuôi dạy con bằng tình yêu thương và sách sức khỏe tâm lý.	\N	https://images.unsplash.com/photo-1491841573634-28140fc7ced7?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-10 02:52:55.534303+00
{}	3ceb8da4-e4ba-44aa-a518-707afa32e515	22848a0d-4a62-4966-acdf-433cedb3a7e2	B-12	Không Gian Lưu Niệm & Tranh Cổ	Saigon Vintage Postcard & Art Pavilion	Đường Sách TP.HCM	cafe	Khu A	3m x 3m	08:00 - 22:00	Góc dừng chân văn hóa độc đáo dành cho du khách muốn gửi tặng bưu thiếp đóng dấu bưu điện trực tiếp tại Đường Sách và mua các món quà lưu niệm mỹ nghệ mang đậm dấu ấn Việt Nam.	\N	https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-10 02:52:55.534303+00
{}	c0bbb4f8-3380-4eed-aab7-67dbdb33af5b	eeef7413-87f1-41e6-af08-e1b450ad3fa8	A01	Gian A01	Gian A01	NXB Trẻ	Văn học & Nghệ thuật	Khu A	3m x 3m	08:00 - 22:00	Khu trưng bày các tác phẩm văn học chọn lọc.	\N	https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:55:04.902+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:55:04.904+00
{}	2b36ad38-5753-4ac2-abcd-df4b09819e44	791c074f-a33f-4c69-a533-d4155d43c3d8	A08	Gian A08	Gian A08	Đối tác xuất bản	Sách tham khảo	Khu A	3m x 3m	08:00 - 22:00	Vị trí góc yên tĩnh.	\N	https://images.unsplash.com/photo-1532012164546-f432f2e3b2ef?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:55:08.195+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:55:08.197+00
{}	16bdca9b-cf8e-41ca-ab29-61fad52098b7	144a77c5-0747-4e48-a30f-07cc07435f6c	A03	Gian A03	Gian A03	Đối tác xuất bản	Khoa học & Kỹ năng	Khu A	3m x 3m	08:00 - 22:00	Vị trí mặt tiền trung tâm.	\N	https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:55:14.239+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:55:14.241+00
{}	128236d0-628c-4aef-a6c9-3249273dac35	30d8af73-2a6c-447d-a94f-24306ba919f6	A04	Gian A04	Gian A04	Đối tác xuất bản	Sách ngoại văn	Khu A	3m x 3m	08:00 - 22:00	Không gian mở kết nối phố đi bộ.	\N	https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:55:16.605+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:55:16.607+00
{}	76efc9d7-c097-43a0-a7ce-cbac8bf42996	fcff0457-4e8d-4eb7-a851-5d70135fa470	A06	Gian A06	Gian A06	Đối tác xuất bản	Sách thiếu nhi	Khu A	3m x 3m	08:00 - 22:00	Khu vực gần sân chơi thiếu nhi.	\N	https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:55:19.477+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:55:19.479+00
{}	24e2ef93-eef7-4cf9-a7b7-6b58559f2ebe	482e8240-9a24-45b5-add4-2e930f80dc7c	A07	Gian A07	Gian A07	NXB Kim Đồng	Lịch sử & Di sản	Khu A	3m x 3m	08:00 - 22:00	Ấn bản tranh truyện lịch sử.	\N	https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:55:24.486+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:55:24.488+00
{}	21f7d072-6327-4eb2-a348-2460869fdec1	a2f6a8ed-52c2-44d5-a0d4-075d5e639236	C04	Gian C04	Gian C04	Đối tác xuất bản	Đồ lưu niệm Đường Sách	Khu C	3m x 3m	08:00 - 22:00	Bookmark, bưu thiếp và sổ tay di sản.	\N	https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:55:31.788+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:55:31.789+00
{}	3eccb33f-82b8-43f8-a2a0-78126dbd8518	3ecd645e-7b9c-4abf-a864-bdde3226c50e	C03	Gian C03	Gian C03	Đối tác xuất bản	Thư pháp & Tranh thủy mặc	Khu C	3m x 3m	08:00 - 22:00	Không gian nghệ thuật thư pháp truyền thống.	\N	https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:55:39.605+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:55:39.606+00
{}	1714e370-096d-41f0-bab4-bbb7910865c0	19084470-e414-4806-bdd5-f557795f8528	B-13	vcb	\N	\N	\N	Khu B	3m x 3m	08:00 – 22:00	\N	\N	\N	\N	\N	\N	operational	f	\N	\N	2026-10-12 06:56:08.437+00	2026-10-12 06:56:08.437+00
{}	cff5ef63-f6a2-48a9-ae8e-e805566ea654	fbf1be37-e5e0-4fc4-a75d-79c4fbdd94c8	A05	Gian hàng Nhà Sách Bình Minh	Gian hàng Nhà Sách Bình Minh	Nhà Sách Bình Minh	Sách thiếu nhi	Khu A	3m x 3m	08:00 - 22:00	Trưng bày và giới thiệu các đầu sách thiếu nhi, sách kỹ năng sống và tổ chức các hoạt động tương tác cùng độc giả nhí.	\N	https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-10 02:52:55.534303+00
{}	c2220002-20ad-4073-af91-1ccd7e3987c0	b3334444-20ad-4073-af91-1ccd7e3987c0	TD02	Gian hàng Tri thức Khoa học Thủ Đức	Thu Duc STEM Books Pavilion	Nhà Sách Khoa Học	science	Khu A	3m x 3m	08:00 - 21:30	Chuyên đề sách công nghệ, lập trình, khoa học và đổi mới sáng tạo.	\N	https://images.unsplash.com/photo-1532012164546-f432f2e3edd3?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-10 02:52:55.534303+00
{}	c3330003-cdb1-4073-af91-1ccd7e3987c1	b4445555-cdb1-4073-af91-1ccd7e3987c1	TD03	Cà Phê Sách Hoa Sen Thủ Đức	Thu Duc Lotus Book Cafe	Cà phê Sách	cafe	Khu B	4m x 4m	07:30 - 22:00	Điểm hẹn thưởng cà phê, giao lưu tác giả và trao đổi sách tại phố sách Thủ Đức.	\N	https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-10 02:52:55.534303+00
{}	c1110001-dc96-4189-a78e-5485c84f8349	b2223333-dc96-4189-a78e-5485c84f8349	TD01	Gian hàng Sách	Thu Duc Youth Books Booth	NXB Trẻ	literature	Khu A	3m x 3m	08:00 - 21:30	Không gian tri thức trẻ trung tại cơ sở TP. Thủ Đức, phục vụ độc giả khu đông.	\N	https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-11 13:54:38.742+00
{}	14de7ab4-7845-4034-a71c-9d60038e4d9f	d6556e8b-2735-4a08-a204-8c52c42798ef	A09	Gian A09	Gian A09	Báo Tuổi Trẻ	Truyền thông & Báo chí	Khu A	3m x 3m	08:00 - 22:00	Trưng bày ấn phẩm báo chí.	\N	https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:55:21.924+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:55:21.925+00
{}	6c874c29-41d0-49f9-af49-b2b98e7ca3fe	41de22f5-5607-4275-a7ae-99cccd6e01a0	B01	Gian B01	Gian B01	Phương Nam Book	Văn hóa Sài Gòn	Khu B	3m x 3m	08:00 - 22:00	Tác phẩm văn hóa Sài Gòn xưa.	\N	https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:55:27.033+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:55:27.035+00
{}	8343005b-26d8-45b8-aeff-3756ef00d29a	8a01f7ba-c03f-4a77-a242-6b8d76717c1e	B02	Gian B02	Gian B02	Đối tác xuất bản	Văn hóa Sài Gòn	Khu B	3m x 3m	08:00 - 22:00	Gần cổng Nguyễn Huệ.	\N	https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:55:29.466+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:55:29.467+00
{}	b44cea0a-c485-4acc-a666-8f8b21191267	f3c48773-3fe6-45a5-a70f-b16d76b663ec	B03	Gian B03	Gian B03	Đối tác xuất bản	Ấn phẩm nghệ thuật	Khu B	3m x 3m	08:00 - 22:00	Không gian trưng bày tranh và artbook.	\N	https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 11:07:14.107+00	\N	2026-10-10 02:52:55.534303+00	2026-10-10 11:07:14.109+00
{}	003ed5e5-b391-4116-a656-c040a40f7de6	016d1641-8d59-4fcc-ada1-56eec3e61417	B04	Gian B04	Gian B04	Alpha Books	Sách kinh tế	Khu B	3m x 3m	08:00 - 22:00	Sách khởi nghiệp và quản trị kinh doanh.	\N	https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 11:07:14.122+00	\N	2026-10-10 02:52:55.534303+00	2026-10-10 11:07:14.123+00
{"images": [{"id": "c5966a62-03fe-4093-ae26-4faa7a102a8b", "url": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80", "caption": ""}, {"id": "f4b8d227-1a96-4c45-931a-29d1dd6ae4d1-0", "url": "data:image/jpeg;base64,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", "caption": "images"}], "categories": ["literature"]}	c5966a62-03fe-4093-ae26-4faa7a102a8b	e344f9f5-dc96-4189-a78e-5485c84f8349	B-01	Gian hàng Nhà Xuất Bản Trẻ	Tre Publishing House Booth	NXB Trẻ	literature	Khu A	3m x 3m	08:00 - 22:00	Không gian ấm cúng với những đầu sách văn học đương đại Việt Nam, sách dịch kinh điển, dòng sách tư tưởng và thiếu niên. Nơi thường xuyên diễn ra các buổi ký tặng sách thân mật cùng tác giả.	\N	https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-13 02:37:43.037+00
{}	dacbecd4-728a-4bfc-ac83-8da632a384c3	c66e044b-0194-4c1b-a9c3-93dcb95d8f65	B05	Gian B05	Gian B05	Đối tác xuất bản	Sách tâm lý	Khu B	3m x 3m	08:00 - 22:00	Sách chữa lành và phát triển bản thân.	\N	https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 11:07:14.132+00	\N	2026-10-10 02:52:55.534303+00	2026-10-10 11:07:14.133+00
{}	188c7eae-4edc-45f6-a848-8c230b98526a	b857e157-879c-4df0-a05c-bd00b1746d12	B06	Gian B06	Gian B06	Đối tác xuất bản	Sách công nghệ	Khu B	3m x 3m	08:00 - 22:00	Sách AI và chuyển đổi số.	\N	https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 11:07:14.142+00	\N	2026-10-10 02:52:55.534303+00	2026-10-10 11:07:14.143+00
{}	e757df4c-4212-4f50-af7f-bb2c38f6a9cf	10db7331-20ad-4073-af91-1ccd7e3987c0	B-02	Gian hàng Nhà Xuất Bản Kim Đồng	Kim Dong Publishing House	NXB Kim Đồng	children	Khu A	3m x 3m	08:00 - 22:00	Điểm dừng chân yêu thích của các gia đình và độc giả trẻ. Trưng bày đầy đủ các bộ truyện tranh huyền thoại, văn học thiếu nhi kinh điển, sách tương tác và kỹ năng sống bổ ích.	\N	https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-10 02:52:55.534303+00
{}	ee1bade5-6dae-44b5-a453-9b670698d819	35d794cd-618e-4380-ac04-c486665f0925	B-06	Cà Phê Sách Bằng Lăng Tím	Bang Lang Tim Book Cafe	Khu vực dịch vụ văn hóa	cafe	Khu A	3m x 3m	07:30 - 22:30	Điểm dừng chân thư thái nằm giữa trung tâm con đường. Du khách vừa đọc những trang sách vừa mua, vừa lắng nghe tiếng chuông Nhà thờ Đức Bà vang lại và ngắm nhìn dòng người tản bộ.	\N	https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-10 02:52:55.534303+00
{}	3e6cfd09-d620-41a1-a147-6f501cd30b31	dd1f9c93-5b48-4292-ab25-1439296478af	A10	Gian A10	Gian A10	Book Cafe	Cà phê sách	Khu A	4m x 4m	08:00 - 22:00	Không gian đọc sách thư giãn.	\N	https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:55:36.705+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:55:36.706+00
{}	7fc55ea4-e4c7-46f6-ac99-41aa8a149d42	0ce1362f-8a1e-4f0e-a42d-8129cc3d0926	B-10	Alpha Books & Omega Plus	Alpha Books & Omega Plus	Alpha Books	history	Khu A	3m x 3m	08:00 - 22:00	Địa chỉ tin cậy cho giới doanh nhân, nhà quản lý và học giả với các công trình nghiên cứu kinh điển về kinh tế, lịch sử văn minh và tư tưởng thế giới.	\N	https://images.unsplash.com/photo-1532012164546-f432f2e3edd3?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-10 02:52:55.534303+00
{}	dbefb64d-8ba8-4588-a41e-848dde3ba416	35a0dd4f-c707-41b0-adce-296a925f3b60	C02	Gian C02	Gian C02	Đối tác xuất bản	Sách cũ & Ấn bản quý	Khu C	3m x 3m	08:00 - 22:00	Gần khu vực giao lưu di sản.	\N	https://images.unsplash.com/photo-1507842229458-574a413d5089?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:54:55.84+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:54:55.842+00
{}	1db709e3-432c-456f-affe-d3369e3fc2e6	15a42e0a-0d09-453b-a520-4bc95ef52ded	C01	Gian C01	Gian C01	Sách Cũ Sài Gòn	Sách cũ & Ấn bản quý	Khu C	3m x 3m	08:00 - 22:00	Sưu tầm ấn bản sách cổ.	\N	https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=600&q=80	\N	\N	\N	operational	t	2026-10-10 05:54:59.257+00	b9d37b50-942d-430a-a45f-0e303739b400	2026-10-10 02:52:55.534303+00	2026-10-10 05:54:59.259+00
{}	2291365a-10b9-445c-a44b-ad5f0261d2d1	a9e00195-fbc3-42e4-a60a-cdb18d961e5b	B-03	Hiệu sách Nhã Nam	Nha Nam Bookstore	Nhã Nam	literature	Khu A	3m x 3m	08:00 - 22:00	Không gian mang hơi thở châu Âu cổ điển giữa lòng phố sách. Nổi tiếng với các bản dịch chuẩn xác của những giải Nobel văn chương, triết học và các tác phẩm lịch sử kinh điển thế giới.	\N	https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-10 02:52:55.534303+00
{}	6388f756-c9b9-4e73-ae58-1d4d078e82be	afa37df7-f49d-4728-a951-abfb72db4790	B-04	Phương Nam Book Store	Phuong Nam Book Pavilion	Phương Nam	lifestyle	Khu A	3m x 3m	08:00 - 22:00	Trưng bày phong phú sách nghiên cứu văn hóa Sài Gòn - Nam Bộ xưa và nay, kết hợp quầy văn phòng phẩm thủ công, bưu thiếp lưu niệm đặc trưng dành cho du khách quốc tế.	\N	https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-10 02:52:55.534303+00
{}	aa6bd434-33ae-4e7b-aee6-0bfd2e8553c6	9ea56cd5-504c-485a-a30b-3d4b8b2375eb	B-05	Thái Hà Books	Thai Ha Books	Thái Hà	history	Khu A	3m x 3m	08:00 - 21:30	Chuyên trang dòng sách nuôi dưỡng tinh thần, lãnh đạo, khởi nghiệp và giáo dục khai phóng. Thường có góc thưởng trà đàm đạo về văn hóa đọc chậm rãi giữa nhịp sống đô thị.	\N	https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80	\N	\N	\N	operational	f	\N	\N	2026-10-10 02:52:55.534303+00	2026-10-10 02:52:55.534303+00
\.


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificates (id, registration_id, attendance_id, user_id, certificate_code, title, issued_at, preview_url) FROM stdin;
dccffbc2-821a-4f62-af0c-e1f0dd91d771	9d3a2d20-d390-4498-af87-83017eab53fd	\N	518a7ba0-302a-4463-a113-f0ca5eb94dd7	CERT-TALKSHOW-001	Chứng nhận tham gia: Tọa đàm Ký ức văn học Sài Gòn - Chợ Lớn	2026-10-09 02:52:59.070953+00	\N
eccffbc2-821a-4f62-af0c-e1f0dd91d773	8b2c1d10-d390-4498-af87-83017eab53fe	\N	518a7ba0-302a-4463-a113-f0ca5eb94dd7	CERT-AUTHOR-002	Chứng nhận tham gia: Giao lưu tác giả Hành Trình Lan Tỏa Văn Hóa Đọc	2026-10-08 23:52:59.070953+00	\N
cbbffbc2-821a-4f62-af0c-e1f0dd91d772	6f0a9b98-d390-4498-af87-83017eab53fa	\N	b7e60b7b-fd9b-4c53-a7d6-f2e435c399ac	CERT-WORKSHOP-002	Chứng nhận hoàn thành Workshop Nghệ thuật Khâu Sách Cổ	2026-10-10 00:52:59.070953+00	\N
\.


--
-- Data for Name: content_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content_entries (id, slug, kind, title, data, status, version, updated_at) FROM stdin;
d4000001-0000-4000-8000-000000000001	khai-mac-le-hoi-duong-sach-mua-thu-2026	news	Khai mạc Lễ hội Đường Sách TP.HCM Mùa Thu 2026	{"author": "Ban Quản Lý Đường Sách", "content": "Sáng nay, tại Đường Sách Nguyễn Văn Bình, Lễ hội Đường Sách Mùa Thu 2026 đã chính thức khai mạc với sự tham gia của lãnh đạo thành phố, hơn 30 nhà xuất bản và đông đảo bạn đọc yêu sách.", "summary": "Sự kiện văn hóa trọng điểm thu hút hàng ngàn lượt khách tham quan ngay trong buổi sáng khai mạc.", "category": "Sự kiện", "coverUrl": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80", "publishedDate": "2026-10-08"}	published	1	2026-10-10 04:41:46.361252+00
d4000001-0000-4000-8000-000000000002	toa-dam-10-nam-duong-sach-tphcm	news	Tọa đàm: Hành trình 10 năm chuyển mình cùng văn hóa đọc Sài Gòn	{"author": "Ban Truyền Thông", "content": "Tại sân khấu chính, các chuyên gia văn hóa và nhà xuất bản đã cùng chia sẻ những thành tựu nổi bật trong 10 năm qua, đồng thời công bố kế hoạch số hóa di sản và trải nghiệm thư viện số tương tác.", "summary": "Diễn đàn nhìn lại cột mốc 10 năm hình thành và định hướng phát triển không gian văn hóa số tại Đường Sách.", "category": "Tọa đàm", "coverUrl": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80", "publishedDate": "2026-10-10"}	published	1	2026-10-10 04:41:46.361252+00
d4000001-0000-4000-8000-000000000003	workshop-dong-sach-thu-cong-gay-sot	news	Độc giả hào hứng trải nghiệm Workshop đóng sách thủ công & in tranh mộc bản	{"author": "CLB Sách Trẻ", "content": "Dưới sự hướng dẫn của các nghệ nhân, bạn đọc được thực hành các công đoạn khâu gáy sách cổ, ép bìa giấy dó và in tranh khắc gỗ mang đậm nét văn hóa dân gian.", "summary": "Không gian trải nghiệm thu hút đông đảo bạn trẻ và gia đình tự tay tạo nên ấn phẩm sách mang dấu ấn cá nhân.", "category": "Hoạt động trải nghiệm", "coverUrl": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80", "publishedDate": "2026-10-09"}	published	1	2026-10-10 04:41:46.361252+00
d4000001-0000-4000-8000-000000000005	landing-org	organization	Bộ Máy Tổ Chức Đường Sách TP.HCM	{"hero": {"era": "Nhiệm kỳ 2024 - 2029", "lead": "Đội ngũ chuyên trách định hướng, quản lý vận hành và kiến tạo các không gian trải nghiệm văn hóa đọc tại Đường Sách TP. Hồ Chí Minh.", "title": "Bộ Máy Tổ Chức & Ban Điều Hành"}, "leaders": [{"id": "ldr-01", "tier": 1, "bioVi": "Người sáng lập và định hình không gian văn hóa Đường Sách TP.HCM từ những ngày đầu, có hơn 40 năm kinh nghiệm trong ngành xuất bản Việt Nam.", "subVi": "Nguyên Phó Chủ tịch Hội Xuất bản Việt Nam", "nameVi": "Ông Lê Hoàng", "roleVi": "Chủ tịch Hội đồng Phát triển & Cố vấn Cấp cao", "tagsVi": ["Sáng lập", "Cố vấn", "Xuất bản"], "badgeVi": "Cố vấn cấp cao", "imageUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", "avatarText": "LH", "contactEmail": "lehoang@duongsach.example.vn"}, {"id": "ldr-02", "tier": 1, "bioVi": "Chịu trách nhiệm điều hành toàn diện hoạt động vận hành, hợp tác xuất bản và chiến lược đổi mới trải nghiệm cho bạn đọc tại Đường Sách.", "subVi": "Quản trị tổng thể & Phát triển cộng đồng", "nameVi": "Bà Đoàn Thị Trang", "roleVi": "Giám đốc Điều hành Đường Sách TP.HCM", "tagsVi": ["Điều hành", "Phát triển", "Văn hóa"], "badgeVi": "Ban Điều Hành", "imageUrl": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", "avatarText": "TT", "contactEmail": "trangdoan@duongsach.example.vn"}, {"id": "ldr-03", "tier": 2, "bioVi": "Chủ trì tổ chức hàng trăm sự kiện giao lưu tác giả, hội sách chuyên đề và phụ trách quan hệ báo chí truyền thông.", "subVi": "Phụ trách các lễ hội sách & tọa đàm tác giả", "nameVi": "Ông Nguyễn Văn Hùng", "roleVi": "Trưởng Ban Truyền thông & Sự kiện", "tagsVi": ["Sự kiện", "Truyền thông", "Tọa đàm"], "badgeVi": "Sự kiện & Báo chí", "imageUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80", "avatarText": "NH", "contactEmail": "nguyenhung@duongsach.example.vn"}, {"id": "ldr-04", "tier": 2, "bioVi": "Đảm bảo công tác an ninh, cảnh quan xanh, hỗ trợ kỹ thuật và phân bổ cơ sở vật chất cho các gian hàng xuất bản.", "subVi": "Phụ trách 30+ ki-ốt & an toàn kỹ thuật", "nameVi": "Bà Phạm Thanh Mai", "roleVi": "Trưởng Ban Vận hành & Cơ sở vật chất", "tagsVi": ["Vận hành", "Gian hàng", "An ninh"], "badgeVi": "Vận hành gian hàng", "imageUrl": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80", "avatarText": "TM", "contactEmail": "phamthanhmai@duongsach.example.vn"}, {"id": "ldr-05", "tier": 2, "bioVi": "Phụ trách kiến trúc hệ sinh thái số, hệ thống tra cứu thư viện trực tuyến và tương tác mã QR di sản văn hóa.", "subVi": "Nền tảng số & Bản đồ tương tác", "nameVi": "Ông Trần Minh Khoa", "roleVi": "Trưởng Ban Chuyển đổi số & Thư viện số", "tagsVi": ["Chuyển đổi số", "Thư viện số", "Bản đồ 3D"], "badgeVi": "Công nghệ & Số hóa", "imageUrl": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80", "avatarText": "MK", "contactEmail": "minhkhoa@duongsach.example.vn"}, {"id": "ldr-06", "tier": 3, "bioVi": "Trực tiếp đón tiếp các đoàn du khách, hỗ trợ bạn đọc trải nghiệm bản đồ di sản và hướng dẫn hoạt động workshop thiếu nhi.", "subVi": "Hỗ trợ khách tham quan & tour di sản", "nameVi": "Bà Lê Hoàng Yến", "roleVi": "Chuyên viên Chăm sóc Bạn đọc & Hướng dẫn Văn hóa", "tagsVi": ["Bạn đọc", "Tour di sản", "Workshop"], "badgeVi": "Dịch vụ bạn đọc", "imageUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", "avatarText": "HY", "contactEmail": "hoangyen@duongsach.example.vn"}], "directory": {"sub": "Quy tụ các nhà quản lý xuất bản giàu kinh nghiệm, chuyên gia văn hóa và đội ngũ nhân sự trẻ nhiệt huyết.", "kicker": "CƠ CẤU NHÂN SỰ", "heading": "Ban Điều Hành & Đội Ngũ Chuyên Trách", "tier1Badge": "LÃNH ĐẠO", "tier1Title": "Hội đồng Cố vấn & Lãnh đạo Cấp cao", "tier2Badge": "QUẢN LÝ", "tier2Title": "Ban Quản lý & Trưởng các Bộ phận", "tier3Badge": "CHUYÊN VIÊN", "tier3Title": "Đội ngũ Điều phối & Chuyên viên Vận hành"}, "principles": [{"num": "01", "desc": "Đặt lợi ích của bạn đọc và cộng đồng yêu sách lên hàng đầu trong mọi hoạt động tổ chức và vận hành.", "title": "Chuyên nghiệp & Tận tâm Phụng sự"}, {"num": "02", "desc": "Tạo cầu nối gắn kết chặt chẽ giữa tác giả, nhà xuất bản, nhà nghiên cứu và đông đảo công chúng độc giả.", "title": "Đồng hành & Kết nối Tri thức"}, {"num": "03", "desc": "Liên tục cập nhật các giải pháp công nghệ hiện đại nhằm mang lại trải nghiệm văn hóa đọc phong phú, tiện lợi và bền vững.", "title": "Đổi mới Sáng tạo & Chuyển đổi Số"}]}	published	1	2026-10-10 05:48:13.513561+00
d4000001-0000-4000-8000-000000000004	landing-journey	journey	Hành trình 10 năm kiến tạo Không gian Văn hóa Đọc	{"hero": {"era": "2016 - 2026", "bgPhoto": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=80", "summary": "Đường Sách Nguyễn Văn Bình — biểu tượng văn hóa tri thức và điểm hẹn giao lưu tác giả giữa lòng đô thị TP. Hồ Chí Minh.", "titleLine1": "Hành trình", "titleLine2": "10 Năm Lan Tỏa", "titleLine3": "Văn Hóa Đọc"}, "brandStory": {"desc": "Từ ý tưởng về một không gian văn hóa mở dành riêng cho sách và người yêu sách giữa trung tâm Sài Gòn.", "quote": "Đường Sách không chỉ đơn thuần là nơi bán sách, mà là mái nhà chung ấm áp của những tâm hồn đồng điệu, nơi lưu giữ ký ức và gieo mầm tri thức cho tương lai.", "title": "Câu chuyện hình thành", "image1": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80", "image2": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80", "image3": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80", "image4": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80", "heading": "Biểu tượng văn hóa đọc giữa lòng đô thị Sài Gòn", "paragraph1": "Được khánh thành vào ngày 09/01/2016, Đường Sách TP.HCM trên trục đường Nguyễn Văn Bình đã trở thành công trình văn hóa tiêu biểu của thành phố mang tên Bác. Nằm kề bên các di tích lịch sử như Nhà thờ Đức Bà và Bưu điện Trung tâm, nơi đây không chỉ là không gian mua bán sách mà còn là điểm hẹn tinh thần của người yêu con chữ.", "paragraph2": "Trải qua 10 năm chuyển mình và phụng sự cộng đồng, Đường Sách đã đón tiếp hơn 25 triệu lượt khách trong và ngoài nước, tổ chức hàng ngàn chương trình tọa đàm, triển lãm và giao lưu tác giả, lan tỏa thói quen đọc sách đến mọi tầng lớp nhân dân.", "quoteAuthor": "Lê Hoàng — Nguyên Phó Chủ tịch Hội Xuất bản Việt Nam, Giám đốc Công ty Đường Sách TP.HCM", "image1Caption": "Không gian xanh mát rợp bóng cây cổ thụ dưới vòm me Nguyễn Văn Bình.", "image2Caption": "Hàng ngàn độc giả hội tụ trong các dịp lễ hội sách lớn.", "image3Caption": "Workshop trải nghiệm văn hóa và nghệ thuật thủ công cho bạn trẻ.", "image4Caption": "Sân khấu giao lưu tác giả - tác phẩm và tọa đàm chuyên đề."}, "milestones": [{"id": "m1", "desc": "Chính thức đi vào hoạt động ngày 09/01/2016 với 20 gian hàng xuất bản đầu tiên trên đường Nguyễn Văn Bình.", "year": "2016", "badge": "Khởi đầu", "image": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80", "title": "Khánh thành Đường Sách TP.HCM"}, {"id": "m2", "desc": "Trở thành điểm đến văn hóa du lịch hấp dẫn hàng đầu TP.HCM, đón nhận sự quan tâm của nhiều đoàn ngoại giao quốc tế.", "year": "2018", "badge": "Cột mốc", "image": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80", "title": "Đạt 5 triệu lượt bạn đọc & du khách"}, {"id": "m3", "desc": "Đa dạng hóa hoạt động với sân chơi đọc sách, vẽ tranh, khâu sách thủ công và triển lãm sách nghệ thuật.", "year": "2020", "badge": "Phát triển", "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80", "title": "Mở rộng chuỗi Workshop & Không gian Thiếu nhi"}, {"id": "m4", "desc": "Tổ chức chuỗi sự kiện Ngày Sách và Văn hóa đọc Việt Nam, thu hút hàng chục ngàn lượt độc giả mỗi ngày.", "year": "2022", "badge": "Chuyển mình", "image": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80", "title": "Phục hồi mạnh mẽ & Đạt 15 triệu lượt khách"}, {"id": "m5", "desc": "Áp dụng bản đồ tương tác, tra cứu sách theo vị trí gian hàng và số hóa dữ liệu di sản văn hóa đọc.", "year": "2024", "badge": "Số hóa", "image": "https://images.unsplash.com/photo-1507842229458-5777174e2d27?auto=format&fit=crop&w=800&q=80", "title": "Ra mắt Đề án Chuyển đổi số & Thư viện số"}, {"id": "m6", "desc": "Khẳng định biểu tượng văn hóa tri thức vững chắc của TP.HCM và vươn tầm không gian giao lưu quốc tế.", "year": "2026", "badge": "10 Năm", "image": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80", "title": "Kỷ niệm 10 năm thành lập Đường Sách"}, {"id": "m7", "desc": "Được Liên hiệp Kiến trúc sư Thế giới (UIA) và UN-Habitat trao giải tại hạng mục Tiếp cận không gian xanh & công cộng (Access to green and public spaces), tôn vinh mô hình không gian văn hóa đọc bền vững.", "year": "2026", "badge": "Vinh danh Quốc tế", "image": "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=800&q=80", "title": "Vinh danh Giải thưởng Quốc tế UIA 2030 Award"}], "achievements": [{"desc": "Độc giả trong nước và du khách quốc tế", "label": "Lượt khách tham quan", "value": 25, "suffix": " Triệu+"}, {"desc": "Tọa đàm, ra mắt sách và triển lãm chuyên đề", "label": "Sự kiện văn hóa", "value": 2200, "suffix": "+"}, {"desc": "Các đơn vị xuất bản - phát hành uy tín", "label": "Gian hàng xuất bản", "value": 30, "suffix": "+"}, {"desc": "2016 - 2026 bền bỉ lan tỏa tri thức", "label": "Hành trình phụng sự", "value": 10, "suffix": " Năm"}], "visionMission": {"introDesc": "Định hướng phát triển bền vững của Đường Sách TP.HCM trong kỷ nguyên số.", "visionDesc": "Trở thành không gian văn hóa đọc hàng đầu Đông Nam Á, kết hợp hài hòa giữa không gian vật lý di sản và trải nghiệm công nghệ số tương tác hiện đại.", "missionDesc": "Nuôi dưỡng thói quen đọc sách cho thế hệ trẻ, tôn vinh giá trị tri thức và xây dựng cộng đồng văn hóa đọc văn minh, nghĩa tình.", "networkDesc": "Liên kết chặt chẽ với các nhà xuất bản hàng đầu, các trường đại học và tổ chức văn hóa quốc tế.", "visionImage": "https://images.unsplash.com/photo-1507842229458-5777174e2d27?auto=format&fit=crop&w=800&q=80", "visionTitle": "Tầm nhìn 2030", "missionTitle": "Sứ mệnh phụng sự", "networkTitle": "Mạng lưới Đối tác Tri thức", "missionPoints": ["Lan tỏa thói quen đọc sách đến mọi gia đình và thế hệ độc giả", "Đồng hành cùng hơn 30 nhà xuất bản và đơn vị phát hành uy tín", "Chuyển đổi số di sản và kết nối thư viện tương tác thông minh"], "innovationDesc": "Tiên phong ứng dụng bản đồ di sản tương tác, check-in QR thông minh và thư viện số tra cứu trực tuyến.", "openAccessDesc": "Mở cửa tự do 365 ngày/năm chào đón người dân thành phố và du khách thập phương.", "innovationTitle": "Đổi mới & Sáng tạo Số", "introTitleLine1": "Tầm nhìn & Sứ mệnh", "introTitleLine2": "Kiến tạo tương lai văn hóa đọc", "openAccessTitle": "Không gian Mở & Miễn phí"}, "partnersHeader": {"title": "Đối tác đồng hành", "eduTitle": "Đối tác Giáo dục & Đào tạo", "corpTitle": "Đơn vị Xuất bản & Doanh nghiệp"}, "milestonesHeader": {"desc": "Các cột mốc lịch sử đánh dấu sự trưởng thành và phát triển của Đường Sách TP.HCM.", "title": "Dấu ấn qua từng thời kỳ"}, "educationPartners": [{"id": "dhqg", "name": "Đại học Quốc gia TP.HCM", "subText": "Hợp tác đào tạo & nghiên cứu", "category": "education"}, {"id": "dhsp", "name": "Trường ĐH Sư Phạm TP.HCM", "subText": "Phát triển văn hóa đọc học đường", "category": "education"}, {"id": "deakin", "name": "Deakin University", "subText": "Giao lưu học thuật quốc tế", "category": "education"}, {"id": "swinburne", "name": "Swinburne University of Technology", "subText": "Chương trình đổi mới sáng tạo", "category": "education"}], "achievementsHeader": {"desc": "Thành quả sau một thập kỷ đồng hành cùng bạn đọc và phát triển văn hóa đọc thành phố.", "title": "Những con số ấn tượng"}, "enterprisePartners": [{"id": "nxbtre", "name": "Nhà Xuất Bản Trẻ", "subText": "Gian hàng tiêu biểu", "category": "enterprise"}, {"id": "kimdong", "name": "NXB Kim Đồng", "subText": "Sách thiếu nhi & giáo dục", "category": "enterprise"}, {"id": "nhanam", "name": "Công ty Văn hóa & Truyền thông Nhã Nam", "subText": "Văn học đương đại", "category": "enterprise"}, {"id": "tonghop", "name": "NXB Tổng Hợp TP.HCM", "subText": "Sách lịch sử văn hóa", "category": "enterprise"}]}	published	2	2026-10-11 10:15:44.564+00
d4000001-0000-4000-8000-000000000000	landing-news	news	Bản tin & Tin tức Đường Sách TP.HCM	{"articles": [{"id": "news-01", "tags": ["Lễ hội 2026", "Sự kiện", "Khai mạc", "Văn hóa đọc"], "views": 0, "author": "Ban Quản Lý Đường Sách", "titleEn": "Grand Opening of HCMC Book Street Autumn Festival 2026: A Hub of Knowledge and Author Gatherings", "titleVi": "Khai mạc Lễ hội Đường Sách TP.HCM Mùa Thu 2026: Không gian tri thức và hội ngộ tác giả", "category": "van-hoa", "featured": true, "imageUrl": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80", "readTime": "5 phút đọc", "contentEn": ["This morning at Nguyen Van Binh Book Street, the HCMC Autumn Book Festival 2026 was officially inaugurated with the presence of city cultural leaders, publisher representatives, and thousands of eager book lovers.", "This year's theme, 'Connecting Knowledge - Nurturing Future', introduces thousands of new titles alongside 20+ author talks, seminars, and artisan craft workshops.", "A major highlight is the Digital Cultural Experience zone, enabling visitors to scan interactive QR codes, explore map-based book indexes, and track cultural badges.", "The festival runs until October 18, 2026, offering book promotions and exclusive author signing sessions."], "contentVi": ["Sáng nay, tại Đường Sách Nguyễn Văn Bình, Lễ hội Đường Sách TP.HCM Mùa Thu 2026 đã chính thức khai mạc với sự hiện diện của đại diện Sở Thông tin và Truyền thông, Hội Xuất bản Việt Nam, hơn 30 đơn vị xuất bản - phát hành sách cùng hàng ngàn bạn đọc và du khách trong nước, quốc tế.", "Lễ hội năm nay được tổ chức với chủ đề “Kết nối tri thức - Nuôi dưỡng tương lai”, mang đến hàng ngàn tựa sách mới cùng chuỗi hơn 20 sự kiện giao lưu tác giả, tọa đàm chuyên đề và các workshop nghệ thuật thủ công độc đáo.", "Điểm nhấn đặc biệt của mùa lễ hội là việc ra mắt khu vực Trải nghiệm Văn hóa Số, cho phép bạn đọc quét mã QR tương tác, tra cứu vị trí sách theo gian hàng và lưu lại hành trình khám phá di sản Đường Sách trên ứng dụng di động.", "Lễ hội sẽ kéo dài liên tục từ ngày 10/10 đến hết ngày 18/10/2026 với nhiều chương trình ưu đãi sách hấp dẫn và các buổi ký tặng sách trực tiếp từ các tác giả tên tuổi."], "summaryEn": "On the morning of October 10, 2026, the Autumn Book Street Festival officially kicked off on leafy Nguyen Van Binh street featuring over 30 stalls, talks, and multi-sensory cultural experiences.", "summaryVi": "Sáng ngày 10/10/2026, tại con đường Nguyễn Văn Bình rợp bóng cây xanh, Lễ hội Đường Sách Mùa Thu 2026 đã chính thức mở màn với hơn 30 gian hàng, chuỗi tọa đàm và không gian trải nghiệm văn hóa đa giác quan.", "publishedDate": "10/10/2026", "imageCaptionEn": "Vibrant grand opening ceremony at the main stage of Nguyen Van Binh Book Street.", "imageCaptionVi": "Quang cảnh lễ khai mạc rực rỡ sắc màu tại sân khấu chính Đường Sách Nguyễn Văn Bình.", "categoryLabelEn": "Events & Activities", "categoryLabelVi": "Sự kiện & Hoạt động"}, {"id": "news-02", "tags": ["Kỷ niệm 10 năm", "Tọa đàm", "Di sản Sài Gòn", "Tác giả"], "views": 0, "author": "Hội Xuất Bản Việt Nam", "titleEn": "Seminar: 10-Year Journey of Fostering Reading Culture in the Heart of Saigon", "titleVi": "Tọa đàm: Hành trình 10 năm lan tỏa văn hóa đọc giữa lòng Sài Gòn", "category": "tac-gia", "featured": false, "imageUrl": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80", "readTime": "4 phút đọc", "contentEn": ["Over a decade of growth, HCMC Book Street has welcomed over 25 million visitors, hosted 2,000+ cultural events, and established itself as a premier cultural landmark.", "Scholars, veteran writers, and publishers discussed the critical role of open community spaces in nurturing youth reading habits.", "Organizers highlighted that Book Street is not just a commercial avenue, but a sanctuary of literary discovery and intergenerational dialogue."], "contentVi": ["Trải qua một thập kỷ hình thành và phát triển, Đường Sách TP.HCM đã đón hơn 25 triệu lượt du khách, tổ chức thành công hơn 2.000 sự kiện văn hóa và khẳng định vị thế là một trong những điểm đến văn hóa độc đáo nhất của cả nước.", "Tại buổi tọa đàm, các nhà nghiên cứu văn hóa, nhà văn lão thành và các nhà xuất bản đã cùng thảo luận về vai trò của không gian mở trong việc nuôi dưỡng thói quen đọc sách cho thế hệ trẻ.", "Ông Lê Hoàng - đại diện Ban Điều Hành chia sẻ: 'Đường Sách không chỉ là nơi mua bán sách, mà là mái nhà chung ấm áp của những người yêu con chữ, nơi trao truyền tình yêu tri thức từ thế hệ này sang thế hệ khác.'"], "summaryEn": "A retrospective forum on the 10-year milestone and the forward-looking digital culture roadmap of Nguyen Van Binh Book Street.", "summaryVi": "Diễn đàn nhìn lại cột mốc 10 năm hình thành và định hướng phát triển không gian văn hóa số tại Đường Sách Nguyễn Văn Bình, nơi hội tụ của tri thức và tình yêu sách.", "publishedDate": "09/10/2026", "imageCaptionEn": "Guest speakers and cultural scholars in engaging discussion at the 10-year Anniversary Seminar.", "imageCaptionVi": "Các diễn giả và chuyên gia văn hóa thảo luận sôi nổi tại Tọa đàm 10 năm Đường Sách.", "categoryLabelEn": "Reading Culture", "categoryLabelVi": "Văn hóa đọc & Tác giả"}, {"id": "news-03", "tags": ["Chuyển đổi số", "Thư viện số", "Bản đồ tương tác", "Di sản"], "views": 0, "author": "Trung tâm Chuyển đổi số", "titleEn": "Ra mắt Không gian Thư viện Số & Bản đồ Tương tác Di sản Đường Sách", "titleVi": "Ra mắt Không gian Thư viện Số & Bản đồ Tương tác Di sản Đường Sách", "category": "thong-cao", "featured": false, "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzOupLGElWkEhK-hM4S3BimNpW2DuUybgyIHiZGqgz4Q&s=10", "readTime": "3 phút đọc", "contentEn": ["Nhằm nâng cao trải nghiệm cho độc giả, Ban Quản Lý Đường Sách phối hợp cùng các đơn vị công nghệ chính thức vận hành nền tảng Thư viện Số và Bản đồ tương tác đa tiện ích.", "Người dùng có thể tra cứu nhanh vị trí của từng tựa sách yêu thích tại 20+ gian hàng thực tế, xem lịch sự kiện trực tiếp theo thời gian thực và quét mã QR tại các điểm check-in di sản.", "Hệ thống vận hành mượt mà trên cả máy tính và thiết bị di động, không yêu cầu cài đặt ứng dụng phức tạp."], "contentVi": ["Nhằm nâng cao trải nghiệm cho độc giả, Ban Quản Lý Đường Sách phối hợp cùng các đơn vị công nghệ chính thức vận hành nền tảng Thư viện Số và Bản đồ tương tác đa tiện ích.", "Người dùng có thể tra cứu nhanh vị trí của từng tựa sách yêu thích tại 20+ gian hàng thực tế, xem lịch sự kiện trực tiếp theo thời gian thực và quét mã QR tại các điểm check-in di sản.", "Hệ thống vận hành mượt mà trên cả máy tính và thiết bị di động, không yêu cầu cài đặt ứng dụng phức tạp."], "summaryEn": "Ứng dụng công nghệ số hóa di sản và tra cứu sách đa phương thức giúp độc giả dễ dàng tìm kiếm sách theo gian hàng, tham gia sự kiện và check-in nhận huy hiệu văn hóa.", "summaryVi": "Ứng dụng công nghệ số hóa di sản và tra cứu sách đa phương thức giúp độc giả dễ dàng tìm kiếm sách theo gian hàng, tham gia sự kiện và check-in nhận huy hiệu văn hóa.", "publishedDate": "08/10/2026", "imageCaptionEn": "Giao diện bản đồ tương tác và tra cứu thư viện số trực quan trên thiết bị thông minh.", "imageCaptionVi": "Giao diện bản đồ tương tác và tra cứu thư viện số trực quan trên thiết bị thông minh.", "categoryLabelEn": "Press Releases", "categoryLabelVi": "Thông cáo báo chí"}, {"id": "news-04", "tags": ["Workshop", "Thủ công", "Giới trẻ", "Trải nghiệm"], "views": 0, "author": "CLB Sách & Nghệ Thuật Sài Gòn", "titleEn": "Artisan Bookbinding & Woodblock Printing Workshop Delights Visitors", "titleVi": "Trải nghiệm Workshop nghệ thuật Đóng sách Thủ công & Khắc mộc bản", "category": "nhip-song", "featured": false, "imageUrl": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80", "readTime": "4 phút đọc", "contentEn": ["On weekend afternoons, Stage B comes alive with creative energy during the artisan bookbinding workshops.", "Guided by master artisans, participants select traditional Do paper, sew custom bindings, and print personalized seals.", "This free cultural workshop celebrates the enduring tangible beauty of physical books in the digital era."], "contentVi": ["Vào những ngày cuối tuần, góc sân khấu B của Đường Sách luôn rộn rã tiếng cười trong không gian workshop đóng sách thủ công.", "Dưới sự hướng dẫn tận tình của các nghệ nhân làng nghề, người tham gia được tự tay chọn giấy dó, đục lỗ khâu gáy theo kỹ thuật truyền thống Á Đông và khắc triện in dấu ấn cá nhân lên trang bìa.", "Đây là hoạt động trải nghiệm văn hóa hoàn toàn miễn phí nhằm tôn vinh giá trị của cuốn sách giấy trong kỷ nguyên số."], "summaryEn": "Hundreds of young readers and families handcrafted heirloom books and printed woodblock art under the green canopy.", "summaryVi": "Hàng trăm bạn trẻ và gia đình thích thú tự tay khâu từng gáy sách cổ, ép bìa giấy dó và in tranh mộc bản truyền thống trong không gian xanh mát dưới vòm me.", "publishedDate": "07/10/2026", "imageCaptionEn": "Young participants sewing handmade book bindings on traditional Do paper.", "imageCaptionVi": "Độc giả trẻ trải nghiệm từng công đoạn khâu sách thủ công bằng chỉ dù và giấy dó cổ truyền.", "categoryLabelEn": "Book Street Life", "categoryLabelVi": "Nhịp sống Đường Sách"}, {"id": "news-05", "tags": ["Giao lưu tác giả", "Sài Gòn xưa", "Ký ức", "Sách mới"], "views": 0, "author": "NXB Tổng Hợp TP.HCM", "titleEn": "Author Meet & Greet: Memories of Saigon - Cho Lon in Living Pages", "titleVi": "Giao lưu cùng Tác giả: Ký ức Sài Gòn - Chợ Lớn qua từng trang viết", "category": "tac-gia", "featured": false, "imageUrl": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80", "readTime": "3 phút đọc", "contentEn": ["The book launch and panel 'Saigon - Cho Lon: Past and Present Memories' drew a diverse, multi-generational audience.", "The author recounted poignant stories of Saigon hospitality, vanishing culinary streets, and colonial architecture.", "Young attendees expressed appreciation for city heritage preservation."], "contentVi": ["Buổi ra mắt tác phẩm khảo cứu văn hóa 'Sài Gòn - Chợ Lớn: Ký ức và Hiện tại' đã thu hút đông đảo độc giả nhiều lứa tuổi tham dự.", "Tác giả đã chia sẻ những mẩu chuyện xúc động về nếp sống hào sảng, những hàng quán xưa và kiến trúc cổ đang dần biến đổi theo thời gian.", "Nhiều độc giả trẻ bày tỏ niềm tự hào và mong muốn tiếp tục gìn giữ những nét đẹp văn hóa độc đáo của thành phố."], "summaryEn": "An intimate gathering between historians, writers, and young readers exploring the heritage of old Saigon.", "summaryVi": "Buổi gặp gỡ thân mật giữa các nhà nghiên cứu lịch sử văn hóa và độc giả trẻ, mở ra những góc nhìn sâu lắng về nếp sống và con người Sài Gòn xưa.", "publishedDate": "06/10/2026", "imageCaptionEn": "Warm book signing and heartfelt dialogue with cultural researcher.", "imageCaptionVi": "Buổi ký tặng sách ấm áp và lắng đọng cùng nhà nghiên cứu văn hóa.", "categoryLabelEn": "Reading Culture", "categoryLabelVi": "Văn hóa đọc & Tác giả"}]}	published	12	2026-10-11 14:14:18.336+00
\.


--
-- Data for Name: event_locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_locations (event_id, location_id, created_at) FROM stdin;
c638df0a-af6d-4ba1-9f55-107e352cdcca	fbf1be37-e5e0-4fc4-a75d-79c4fbdd94c8	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	2a0ec771-a791-4a7b-af72-0d3826c99871	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	1dd0b5d5-3651-475a-aab7-aebf6d628273	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	0ce1362f-8a1e-4f0e-a42d-8129cc3d0926	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	92522c68-e53f-4e54-ad29-651d6f89ca79	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	22848a0d-4a62-4966-acdf-433cedb3a7e2	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	19084470-e414-4806-bdd5-f557795f8528	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	74504a41-22d1-4a44-ac6c-a452359ef291	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	d67622d5-1cd3-40a0-ac8e-271a550f258c	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	e98d0808-ceb7-4734-a471-c8d1e37dab61	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	70568dc7-f50b-4499-ade5-e3fcfd19e8b1	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	eca9f427-9189-4548-ad2f-2b33b4f1f179	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	eeef7413-87f1-41e6-af08-e1b450ad3fa8	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	7aa9a164-3a8b-4f26-a0dd-5b84690818a4	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	144a77c5-0747-4e48-a30f-07cc07435f6c	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	30d8af73-2a6c-447d-a94f-24306ba919f6	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	fcff0457-4e8d-4eb7-a851-5d70135fa470	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	482e8240-9a24-45b5-add4-2e930f80dc7c	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	791c074f-a33f-4c69-a533-d4155d43c3d8	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	3ecd645e-7b9c-4abf-a864-bdde3226c50e	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	a2f6a8ed-52c2-44d5-a0d4-075d5e639236	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	d6556e8b-2735-4a08-a204-8c52c42798ef	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	41de22f5-5607-4275-a7ae-99cccd6e01a0	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	8a01f7ba-c03f-4a77-a242-6b8d76717c1e	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	dd1f9c93-5b48-4292-ab25-1439296478af	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	15a42e0a-0d09-453b-a520-4bc95ef52ded	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	35a0dd4f-c707-41b0-adce-296a925f3b60	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	afa37df7-f49d-4728-a951-abfb72db4790	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	9ea56cd5-504c-485a-a30b-3d4b8b2375eb	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	35d794cd-618e-4380-ac04-c486665f0925	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	f3c48773-3fe6-45a5-a70f-b16d76b663ec	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	016d1641-8d59-4fcc-ada1-56eec3e61417	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	c66e044b-0194-4c1b-a9c3-93dcb95d8f65	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	b857e157-879c-4df0-a05c-bd00b1746d12	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	e344f9f5-dc96-4189-a78e-5485c84f8349	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	10db7331-20ad-4073-af91-1ccd7e3987c0	2026-10-12 13:57:18.009+00
c638df0a-af6d-4ba1-9f55-107e352cdcca	a9e00195-fbc3-42e4-a60a-cdb18d961e5b	2026-10-12 13:57:18.009+00
163029a5-844c-4953-be87-942f4f9b1a9e	fbf1be37-e5e0-4fc4-a75d-79c4fbdd94c8	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	2a0ec771-a791-4a7b-af72-0d3826c99871	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	1dd0b5d5-3651-475a-aab7-aebf6d628273	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	0ce1362f-8a1e-4f0e-a42d-8129cc3d0926	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	92522c68-e53f-4e54-ad29-651d6f89ca79	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	22848a0d-4a62-4966-acdf-433cedb3a7e2	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	19084470-e414-4806-bdd5-f557795f8528	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	74504a41-22d1-4a44-ac6c-a452359ef291	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	d67622d5-1cd3-40a0-ac8e-271a550f258c	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	e98d0808-ceb7-4734-a471-c8d1e37dab61	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	70568dc7-f50b-4499-ade5-e3fcfd19e8b1	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	eca9f427-9189-4548-ad2f-2b33b4f1f179	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	eeef7413-87f1-41e6-af08-e1b450ad3fa8	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	7aa9a164-3a8b-4f26-a0dd-5b84690818a4	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	144a77c5-0747-4e48-a30f-07cc07435f6c	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	30d8af73-2a6c-447d-a94f-24306ba919f6	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	fcff0457-4e8d-4eb7-a851-5d70135fa470	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	482e8240-9a24-45b5-add4-2e930f80dc7c	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	791c074f-a33f-4c69-a533-d4155d43c3d8	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	3ecd645e-7b9c-4abf-a864-bdde3226c50e	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	a2f6a8ed-52c2-44d5-a0d4-075d5e639236	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	d6556e8b-2735-4a08-a204-8c52c42798ef	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	41de22f5-5607-4275-a7ae-99cccd6e01a0	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	8a01f7ba-c03f-4a77-a242-6b8d76717c1e	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	dd1f9c93-5b48-4292-ab25-1439296478af	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	15a42e0a-0d09-453b-a520-4bc95ef52ded	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	35a0dd4f-c707-41b0-adce-296a925f3b60	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	afa37df7-f49d-4728-a951-abfb72db4790	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	9ea56cd5-504c-485a-a30b-3d4b8b2375eb	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	35d794cd-618e-4380-ac04-c486665f0925	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	f3c48773-3fe6-45a5-a70f-b16d76b663ec	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	016d1641-8d59-4fcc-ada1-56eec3e61417	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	c66e044b-0194-4c1b-a9c3-93dcb95d8f65	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	b857e157-879c-4df0-a05c-bd00b1746d12	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	e344f9f5-dc96-4189-a78e-5485c84f8349	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	10db7331-20ad-4073-af91-1ccd7e3987c0	2026-10-12 13:58:02.151+00
163029a5-844c-4953-be87-942f4f9b1a9e	a9e00195-fbc3-42e4-a60a-cdb18d961e5b	2026-10-12 13:58:02.151+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	e98d0808-ceb7-4734-a471-c8d1e37dab61	2026-10-10 09:23:22.003+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	70568dc7-f50b-4499-ade5-e3fcfd19e8b1	2026-10-10 09:23:22.012+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	d67622d5-1cd3-40a0-ac8e-271a550f258c	2026-10-10 09:23:22.016+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	74504a41-22d1-4a44-ac6c-a452359ef291	2026-10-10 09:23:22.02+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	eca9f427-9189-4548-ad2f-2b33b4f1f179	2026-10-10 09:23:22.025+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	2a0ec771-a791-4a7b-af72-0d3826c99871	2026-10-10 09:23:22.029+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	1dd0b5d5-3651-475a-aab7-aebf6d628273	2026-10-10 09:23:22.033+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	92522c68-e53f-4e54-ad29-651d6f89ca79	2026-10-10 09:23:22.037+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	22848a0d-4a62-4966-acdf-433cedb3a7e2	2026-10-10 09:23:22.041+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	fbf1be37-e5e0-4fc4-a75d-79c4fbdd94c8	2026-10-10 09:23:22.046+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	0ce1362f-8a1e-4f0e-a42d-8129cc3d0926	2026-10-10 09:23:22.05+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	eeef7413-87f1-41e6-af08-e1b450ad3fa8	2026-10-10 09:23:22.054+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	7aa9a164-3a8b-4f26-a0dd-5b84690818a4	2026-10-10 09:23:22.058+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	144a77c5-0747-4e48-a30f-07cc07435f6c	2026-10-10 09:23:22.062+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	30d8af73-2a6c-447d-a94f-24306ba919f6	2026-10-10 09:23:22.066+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	fcff0457-4e8d-4eb7-a851-5d70135fa470	2026-10-10 09:23:22.07+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	482e8240-9a24-45b5-add4-2e930f80dc7c	2026-10-10 09:23:22.074+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	791c074f-a33f-4c69-a533-d4155d43c3d8	2026-10-10 09:23:22.078+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	3ecd645e-7b9c-4abf-a864-bdde3226c50e	2026-10-10 09:23:22.083+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	a2f6a8ed-52c2-44d5-a0d4-075d5e639236	2026-10-10 09:23:22.087+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	d6556e8b-2735-4a08-a204-8c52c42798ef	2026-10-10 09:23:22.091+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	41de22f5-5607-4275-a7ae-99cccd6e01a0	2026-10-10 09:23:22.095+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	8a01f7ba-c03f-4a77-a242-6b8d76717c1e	2026-10-10 09:23:22.099+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	dd1f9c93-5b48-4292-ab25-1439296478af	2026-10-10 09:23:22.103+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	15a42e0a-0d09-453b-a520-4bc95ef52ded	2026-10-10 09:23:22.107+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	35a0dd4f-c707-41b0-adce-296a925f3b60	2026-10-10 09:23:22.112+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	9ea56cd5-504c-485a-a30b-3d4b8b2375eb	2026-10-10 09:23:22.117+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	f3c48773-3fe6-45a5-a70f-b16d76b663ec	2026-10-10 09:23:22.12+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	016d1641-8d59-4fcc-ada1-56eec3e61417	2026-10-10 09:23:22.125+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	c66e044b-0194-4c1b-a9c3-93dcb95d8f65	2026-10-10 09:23:22.129+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	b857e157-879c-4df0-a05c-bd00b1746d12	2026-10-10 09:23:22.133+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	e344f9f5-dc96-4189-a78e-5485c84f8349	2026-10-10 09:23:22.136+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	10db7331-20ad-4073-af91-1ccd7e3987c0	2026-10-10 09:23:22.141+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	35d794cd-618e-4380-ac04-c486665f0925	2026-10-10 09:23:22.144+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	a9e00195-fbc3-42e4-a60a-cdb18d961e5b	2026-10-10 09:23:22.148+00
daa1f312-395e-43a2-a91c-00f3a3d50bbb	afa37df7-f49d-4728-a951-abfb72db4790	2026-10-10 09:23:22.152+00
7e579f11-c470-4788-a0ef-3cc29525e16e	e98d0808-ceb7-4734-a471-c8d1e37dab61	2026-10-10 09:23:22.157+00
7e579f11-c470-4788-a0ef-3cc29525e16e	70568dc7-f50b-4499-ade5-e3fcfd19e8b1	2026-10-10 09:23:22.161+00
7e579f11-c470-4788-a0ef-3cc29525e16e	d67622d5-1cd3-40a0-ac8e-271a550f258c	2026-10-10 09:23:22.166+00
7e579f11-c470-4788-a0ef-3cc29525e16e	74504a41-22d1-4a44-ac6c-a452359ef291	2026-10-10 09:23:22.17+00
7e579f11-c470-4788-a0ef-3cc29525e16e	eca9f427-9189-4548-ad2f-2b33b4f1f179	2026-10-10 09:23:22.174+00
7e579f11-c470-4788-a0ef-3cc29525e16e	2a0ec771-a791-4a7b-af72-0d3826c99871	2026-10-10 09:23:22.179+00
7e579f11-c470-4788-a0ef-3cc29525e16e	1dd0b5d5-3651-475a-aab7-aebf6d628273	2026-10-10 09:23:22.182+00
7e579f11-c470-4788-a0ef-3cc29525e16e	92522c68-e53f-4e54-ad29-651d6f89ca79	2026-10-10 09:23:22.186+00
7e579f11-c470-4788-a0ef-3cc29525e16e	22848a0d-4a62-4966-acdf-433cedb3a7e2	2026-10-10 09:23:22.189+00
7e579f11-c470-4788-a0ef-3cc29525e16e	fbf1be37-e5e0-4fc4-a75d-79c4fbdd94c8	2026-10-10 09:23:22.194+00
7e579f11-c470-4788-a0ef-3cc29525e16e	0ce1362f-8a1e-4f0e-a42d-8129cc3d0926	2026-10-10 09:23:22.198+00
7e579f11-c470-4788-a0ef-3cc29525e16e	eeef7413-87f1-41e6-af08-e1b450ad3fa8	2026-10-10 09:23:22.202+00
7e579f11-c470-4788-a0ef-3cc29525e16e	7aa9a164-3a8b-4f26-a0dd-5b84690818a4	2026-10-10 09:23:22.207+00
7e579f11-c470-4788-a0ef-3cc29525e16e	144a77c5-0747-4e48-a30f-07cc07435f6c	2026-10-10 09:23:22.21+00
7e579f11-c470-4788-a0ef-3cc29525e16e	30d8af73-2a6c-447d-a94f-24306ba919f6	2026-10-10 09:23:22.214+00
7e579f11-c470-4788-a0ef-3cc29525e16e	fcff0457-4e8d-4eb7-a851-5d70135fa470	2026-10-10 09:23:22.218+00
7e579f11-c470-4788-a0ef-3cc29525e16e	482e8240-9a24-45b5-add4-2e930f80dc7c	2026-10-10 09:23:22.222+00
7e579f11-c470-4788-a0ef-3cc29525e16e	791c074f-a33f-4c69-a533-d4155d43c3d8	2026-10-10 09:23:22.225+00
7e579f11-c470-4788-a0ef-3cc29525e16e	3ecd645e-7b9c-4abf-a864-bdde3226c50e	2026-10-10 09:23:22.228+00
7e579f11-c470-4788-a0ef-3cc29525e16e	a2f6a8ed-52c2-44d5-a0d4-075d5e639236	2026-10-10 09:23:22.233+00
7e579f11-c470-4788-a0ef-3cc29525e16e	d6556e8b-2735-4a08-a204-8c52c42798ef	2026-10-10 09:23:22.237+00
7e579f11-c470-4788-a0ef-3cc29525e16e	41de22f5-5607-4275-a7ae-99cccd6e01a0	2026-10-10 09:23:22.24+00
7e579f11-c470-4788-a0ef-3cc29525e16e	8a01f7ba-c03f-4a77-a242-6b8d76717c1e	2026-10-10 09:23:22.244+00
7e579f11-c470-4788-a0ef-3cc29525e16e	dd1f9c93-5b48-4292-ab25-1439296478af	2026-10-10 09:23:22.248+00
7e579f11-c470-4788-a0ef-3cc29525e16e	15a42e0a-0d09-453b-a520-4bc95ef52ded	2026-10-10 09:23:22.252+00
7e579f11-c470-4788-a0ef-3cc29525e16e	35a0dd4f-c707-41b0-adce-296a925f3b60	2026-10-10 09:23:22.255+00
7e579f11-c470-4788-a0ef-3cc29525e16e	9ea56cd5-504c-485a-a30b-3d4b8b2375eb	2026-10-10 09:23:22.259+00
7e579f11-c470-4788-a0ef-3cc29525e16e	f3c48773-3fe6-45a5-a70f-b16d76b663ec	2026-10-10 09:23:22.263+00
7e579f11-c470-4788-a0ef-3cc29525e16e	016d1641-8d59-4fcc-ada1-56eec3e61417	2026-10-10 09:23:22.266+00
7e579f11-c470-4788-a0ef-3cc29525e16e	c66e044b-0194-4c1b-a9c3-93dcb95d8f65	2026-10-10 09:23:22.27+00
7e579f11-c470-4788-a0ef-3cc29525e16e	b857e157-879c-4df0-a05c-bd00b1746d12	2026-10-10 09:23:22.275+00
7e579f11-c470-4788-a0ef-3cc29525e16e	e344f9f5-dc96-4189-a78e-5485c84f8349	2026-10-10 09:23:22.278+00
7e579f11-c470-4788-a0ef-3cc29525e16e	10db7331-20ad-4073-af91-1ccd7e3987c0	2026-10-10 09:23:22.282+00
7e579f11-c470-4788-a0ef-3cc29525e16e	35d794cd-618e-4380-ac04-c486665f0925	2026-10-10 09:23:22.287+00
7e579f11-c470-4788-a0ef-3cc29525e16e	a9e00195-fbc3-42e4-a60a-cdb18d961e5b	2026-10-10 09:23:22.291+00
7e579f11-c470-4788-a0ef-3cc29525e16e	afa37df7-f49d-4728-a951-abfb72db4790	2026-10-10 09:23:22.294+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	e98d0808-ceb7-4734-a471-c8d1e37dab61	2026-10-10 09:23:22.723+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	70568dc7-f50b-4499-ade5-e3fcfd19e8b1	2026-10-10 09:23:22.732+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	d67622d5-1cd3-40a0-ac8e-271a550f258c	2026-10-10 09:23:22.736+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	74504a41-22d1-4a44-ac6c-a452359ef291	2026-10-10 09:23:22.74+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	eca9f427-9189-4548-ad2f-2b33b4f1f179	2026-10-10 09:23:22.744+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	2a0ec771-a791-4a7b-af72-0d3826c99871	2026-10-10 09:23:22.748+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	1dd0b5d5-3651-475a-aab7-aebf6d628273	2026-10-10 09:23:22.752+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	92522c68-e53f-4e54-ad29-651d6f89ca79	2026-10-10 09:23:22.756+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	22848a0d-4a62-4966-acdf-433cedb3a7e2	2026-10-10 09:23:22.759+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	fbf1be37-e5e0-4fc4-a75d-79c4fbdd94c8	2026-10-10 09:23:22.762+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	0ce1362f-8a1e-4f0e-a42d-8129cc3d0926	2026-10-10 09:23:22.767+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	eeef7413-87f1-41e6-af08-e1b450ad3fa8	2026-10-10 09:23:22.77+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	7aa9a164-3a8b-4f26-a0dd-5b84690818a4	2026-10-10 09:23:22.773+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	144a77c5-0747-4e48-a30f-07cc07435f6c	2026-10-10 09:23:22.778+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	30d8af73-2a6c-447d-a94f-24306ba919f6	2026-10-10 09:23:22.793+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	fcff0457-4e8d-4eb7-a851-5d70135fa470	2026-10-10 09:23:22.797+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	482e8240-9a24-45b5-add4-2e930f80dc7c	2026-10-10 09:23:22.801+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	791c074f-a33f-4c69-a533-d4155d43c3d8	2026-10-10 09:23:22.805+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	3ecd645e-7b9c-4abf-a864-bdde3226c50e	2026-10-10 09:23:22.809+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	a2f6a8ed-52c2-44d5-a0d4-075d5e639236	2026-10-10 09:23:22.813+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	d6556e8b-2735-4a08-a204-8c52c42798ef	2026-10-10 09:23:22.816+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	41de22f5-5607-4275-a7ae-99cccd6e01a0	2026-10-10 09:23:22.821+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	8a01f7ba-c03f-4a77-a242-6b8d76717c1e	2026-10-10 09:23:22.825+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	dd1f9c93-5b48-4292-ab25-1439296478af	2026-10-10 09:23:22.828+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	15a42e0a-0d09-453b-a520-4bc95ef52ded	2026-10-10 09:23:22.832+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	35a0dd4f-c707-41b0-adce-296a925f3b60	2026-10-10 09:23:22.836+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	9ea56cd5-504c-485a-a30b-3d4b8b2375eb	2026-10-10 09:23:22.84+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	f3c48773-3fe6-45a5-a70f-b16d76b663ec	2026-10-10 09:23:22.844+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	016d1641-8d59-4fcc-ada1-56eec3e61417	2026-10-10 09:23:22.847+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	c66e044b-0194-4c1b-a9c3-93dcb95d8f65	2026-10-10 09:23:22.851+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	b857e157-879c-4df0-a05c-bd00b1746d12	2026-10-10 09:23:22.854+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	e344f9f5-dc96-4189-a78e-5485c84f8349	2026-10-10 09:23:22.858+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	10db7331-20ad-4073-af91-1ccd7e3987c0	2026-10-10 09:23:22.862+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	35d794cd-618e-4380-ac04-c486665f0925	2026-10-10 09:23:22.865+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	a9e00195-fbc3-42e4-a60a-cdb18d961e5b	2026-10-10 09:23:22.869+00
bde2daf8-061d-4ae1-adeb-db8dd283e9c9	afa37df7-f49d-4728-a951-abfb72db4790	2026-10-10 09:23:22.874+00
89c22dc5-645b-4528-a081-8dc42a29b834	e98d0808-ceb7-4734-a471-c8d1e37dab61	2026-10-10 09:23:22.878+00
89c22dc5-645b-4528-a081-8dc42a29b834	70568dc7-f50b-4499-ade5-e3fcfd19e8b1	2026-10-10 09:23:22.882+00
89c22dc5-645b-4528-a081-8dc42a29b834	d67622d5-1cd3-40a0-ac8e-271a550f258c	2026-10-10 09:23:22.886+00
89c22dc5-645b-4528-a081-8dc42a29b834	74504a41-22d1-4a44-ac6c-a452359ef291	2026-10-10 09:23:22.889+00
89c22dc5-645b-4528-a081-8dc42a29b834	eca9f427-9189-4548-ad2f-2b33b4f1f179	2026-10-10 09:23:22.893+00
89c22dc5-645b-4528-a081-8dc42a29b834	2a0ec771-a791-4a7b-af72-0d3826c99871	2026-10-10 09:23:22.896+00
89c22dc5-645b-4528-a081-8dc42a29b834	1dd0b5d5-3651-475a-aab7-aebf6d628273	2026-10-10 09:23:22.901+00
89c22dc5-645b-4528-a081-8dc42a29b834	92522c68-e53f-4e54-ad29-651d6f89ca79	2026-10-10 09:23:22.905+00
89c22dc5-645b-4528-a081-8dc42a29b834	22848a0d-4a62-4966-acdf-433cedb3a7e2	2026-10-10 09:23:22.909+00
89c22dc5-645b-4528-a081-8dc42a29b834	fbf1be37-e5e0-4fc4-a75d-79c4fbdd94c8	2026-10-10 09:23:22.913+00
89c22dc5-645b-4528-a081-8dc42a29b834	0ce1362f-8a1e-4f0e-a42d-8129cc3d0926	2026-10-10 09:23:22.916+00
89c22dc5-645b-4528-a081-8dc42a29b834	eeef7413-87f1-41e6-af08-e1b450ad3fa8	2026-10-10 09:23:22.919+00
89c22dc5-645b-4528-a081-8dc42a29b834	7aa9a164-3a8b-4f26-a0dd-5b84690818a4	2026-10-10 09:23:22.923+00
89c22dc5-645b-4528-a081-8dc42a29b834	144a77c5-0747-4e48-a30f-07cc07435f6c	2026-10-10 09:23:22.926+00
89c22dc5-645b-4528-a081-8dc42a29b834	30d8af73-2a6c-447d-a94f-24306ba919f6	2026-10-10 09:23:22.93+00
89c22dc5-645b-4528-a081-8dc42a29b834	fcff0457-4e8d-4eb7-a851-5d70135fa470	2026-10-10 09:23:22.933+00
89c22dc5-645b-4528-a081-8dc42a29b834	482e8240-9a24-45b5-add4-2e930f80dc7c	2026-10-10 09:23:22.936+00
89c22dc5-645b-4528-a081-8dc42a29b834	791c074f-a33f-4c69-a533-d4155d43c3d8	2026-10-10 09:23:22.941+00
89c22dc5-645b-4528-a081-8dc42a29b834	3ecd645e-7b9c-4abf-a864-bdde3226c50e	2026-10-10 09:23:22.944+00
89c22dc5-645b-4528-a081-8dc42a29b834	a2f6a8ed-52c2-44d5-a0d4-075d5e639236	2026-10-10 09:23:22.948+00
89c22dc5-645b-4528-a081-8dc42a29b834	d6556e8b-2735-4a08-a204-8c52c42798ef	2026-10-10 09:23:22.953+00
89c22dc5-645b-4528-a081-8dc42a29b834	41de22f5-5607-4275-a7ae-99cccd6e01a0	2026-10-10 09:23:22.956+00
89c22dc5-645b-4528-a081-8dc42a29b834	8a01f7ba-c03f-4a77-a242-6b8d76717c1e	2026-10-10 09:23:22.96+00
89c22dc5-645b-4528-a081-8dc42a29b834	dd1f9c93-5b48-4292-ab25-1439296478af	2026-10-10 09:23:22.964+00
89c22dc5-645b-4528-a081-8dc42a29b834	15a42e0a-0d09-453b-a520-4bc95ef52ded	2026-10-10 09:23:22.968+00
89c22dc5-645b-4528-a081-8dc42a29b834	35a0dd4f-c707-41b0-adce-296a925f3b60	2026-10-10 09:23:22.971+00
89c22dc5-645b-4528-a081-8dc42a29b834	9ea56cd5-504c-485a-a30b-3d4b8b2375eb	2026-10-10 09:23:22.975+00
89c22dc5-645b-4528-a081-8dc42a29b834	f3c48773-3fe6-45a5-a70f-b16d76b663ec	2026-10-10 09:23:22.979+00
89c22dc5-645b-4528-a081-8dc42a29b834	016d1641-8d59-4fcc-ada1-56eec3e61417	2026-10-10 09:23:22.982+00
89c22dc5-645b-4528-a081-8dc42a29b834	c66e044b-0194-4c1b-a9c3-93dcb95d8f65	2026-10-10 09:23:22.986+00
89c22dc5-645b-4528-a081-8dc42a29b834	b857e157-879c-4df0-a05c-bd00b1746d12	2026-10-10 09:23:22.989+00
89c22dc5-645b-4528-a081-8dc42a29b834	e344f9f5-dc96-4189-a78e-5485c84f8349	2026-10-10 09:23:22.995+00
89c22dc5-645b-4528-a081-8dc42a29b834	10db7331-20ad-4073-af91-1ccd7e3987c0	2026-10-10 09:23:22.998+00
89c22dc5-645b-4528-a081-8dc42a29b834	35d794cd-618e-4380-ac04-c486665f0925	2026-10-10 09:23:23.002+00
89c22dc5-645b-4528-a081-8dc42a29b834	a9e00195-fbc3-42e4-a60a-cdb18d961e5b	2026-10-10 09:23:23.006+00
89c22dc5-645b-4528-a081-8dc42a29b834	afa37df7-f49d-4728-a951-abfb72db4790	2026-10-10 09:23:23.01+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	e98d0808-ceb7-4734-a471-c8d1e37dab61	2026-10-10 09:23:23.014+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	70568dc7-f50b-4499-ade5-e3fcfd19e8b1	2026-10-10 09:23:23.018+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	d67622d5-1cd3-40a0-ac8e-271a550f258c	2026-10-10 09:23:23.021+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	74504a41-22d1-4a44-ac6c-a452359ef291	2026-10-10 09:23:23.025+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	eca9f427-9189-4548-ad2f-2b33b4f1f179	2026-10-10 09:23:23.028+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	2a0ec771-a791-4a7b-af72-0d3826c99871	2026-10-10 09:23:23.031+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	1dd0b5d5-3651-475a-aab7-aebf6d628273	2026-10-10 09:23:23.035+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	92522c68-e53f-4e54-ad29-651d6f89ca79	2026-10-10 09:23:23.039+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	22848a0d-4a62-4966-acdf-433cedb3a7e2	2026-10-10 09:23:23.042+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	fbf1be37-e5e0-4fc4-a75d-79c4fbdd94c8	2026-10-10 09:23:23.046+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	0ce1362f-8a1e-4f0e-a42d-8129cc3d0926	2026-10-10 09:23:23.05+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	eeef7413-87f1-41e6-af08-e1b450ad3fa8	2026-10-10 09:23:23.054+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	7aa9a164-3a8b-4f26-a0dd-5b84690818a4	2026-10-10 09:23:23.058+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	144a77c5-0747-4e48-a30f-07cc07435f6c	2026-10-10 09:23:23.062+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	30d8af73-2a6c-447d-a94f-24306ba919f6	2026-10-10 09:23:23.065+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	fcff0457-4e8d-4eb7-a851-5d70135fa470	2026-10-10 09:23:23.068+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	482e8240-9a24-45b5-add4-2e930f80dc7c	2026-10-10 09:23:23.072+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	791c074f-a33f-4c69-a533-d4155d43c3d8	2026-10-10 09:23:23.076+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	3ecd645e-7b9c-4abf-a864-bdde3226c50e	2026-10-10 09:23:23.079+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	a2f6a8ed-52c2-44d5-a0d4-075d5e639236	2026-10-10 09:23:23.083+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	d6556e8b-2735-4a08-a204-8c52c42798ef	2026-10-10 09:23:23.088+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	41de22f5-5607-4275-a7ae-99cccd6e01a0	2026-10-10 09:23:23.092+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	8a01f7ba-c03f-4a77-a242-6b8d76717c1e	2026-10-10 09:23:23.095+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	dd1f9c93-5b48-4292-ab25-1439296478af	2026-10-10 09:23:23.099+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	15a42e0a-0d09-453b-a520-4bc95ef52ded	2026-10-10 09:23:23.102+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	35a0dd4f-c707-41b0-adce-296a925f3b60	2026-10-10 09:23:23.105+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	9ea56cd5-504c-485a-a30b-3d4b8b2375eb	2026-10-10 09:23:23.109+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	f3c48773-3fe6-45a5-a70f-b16d76b663ec	2026-10-10 09:23:23.113+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	016d1641-8d59-4fcc-ada1-56eec3e61417	2026-10-10 09:23:23.117+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	c66e044b-0194-4c1b-a9c3-93dcb95d8f65	2026-10-10 09:23:23.12+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	b857e157-879c-4df0-a05c-bd00b1746d12	2026-10-10 09:23:23.124+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	e344f9f5-dc96-4189-a78e-5485c84f8349	2026-10-10 09:23:23.128+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	10db7331-20ad-4073-af91-1ccd7e3987c0	2026-10-10 09:23:23.131+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	35d794cd-618e-4380-ac04-c486665f0925	2026-10-10 09:23:23.135+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	a9e00195-fbc3-42e4-a60a-cdb18d961e5b	2026-10-10 09:23:23.138+00
849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	afa37df7-f49d-4728-a951-abfb72db4790	2026-10-10 09:23:23.141+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	e98d0808-ceb7-4734-a471-c8d1e37dab61	2026-10-10 09:23:23.145+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	70568dc7-f50b-4499-ade5-e3fcfd19e8b1	2026-10-10 09:23:23.149+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	d67622d5-1cd3-40a0-ac8e-271a550f258c	2026-10-10 09:23:23.153+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	74504a41-22d1-4a44-ac6c-a452359ef291	2026-10-10 09:23:23.158+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	eca9f427-9189-4548-ad2f-2b33b4f1f179	2026-10-10 09:23:23.161+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	2a0ec771-a791-4a7b-af72-0d3826c99871	2026-10-10 09:23:23.166+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	1dd0b5d5-3651-475a-aab7-aebf6d628273	2026-10-10 09:23:23.169+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	92522c68-e53f-4e54-ad29-651d6f89ca79	2026-10-10 09:23:23.172+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	22848a0d-4a62-4966-acdf-433cedb3a7e2	2026-10-10 09:23:23.176+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	fbf1be37-e5e0-4fc4-a75d-79c4fbdd94c8	2026-10-10 09:23:23.179+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	0ce1362f-8a1e-4f0e-a42d-8129cc3d0926	2026-10-10 09:23:23.183+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	eeef7413-87f1-41e6-af08-e1b450ad3fa8	2026-10-10 09:23:23.186+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	7aa9a164-3a8b-4f26-a0dd-5b84690818a4	2026-10-10 09:23:23.189+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	144a77c5-0747-4e48-a30f-07cc07435f6c	2026-10-10 09:23:23.193+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	30d8af73-2a6c-447d-a94f-24306ba919f6	2026-10-10 09:23:23.197+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	fcff0457-4e8d-4eb7-a851-5d70135fa470	2026-10-10 09:23:23.2+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	482e8240-9a24-45b5-add4-2e930f80dc7c	2026-10-10 09:23:23.203+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	791c074f-a33f-4c69-a533-d4155d43c3d8	2026-10-10 09:23:23.208+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	3ecd645e-7b9c-4abf-a864-bdde3226c50e	2026-10-10 09:23:23.212+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	a2f6a8ed-52c2-44d5-a0d4-075d5e639236	2026-10-10 09:23:23.215+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	d6556e8b-2735-4a08-a204-8c52c42798ef	2026-10-10 09:23:23.219+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	41de22f5-5607-4275-a7ae-99cccd6e01a0	2026-10-10 09:23:23.223+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	8a01f7ba-c03f-4a77-a242-6b8d76717c1e	2026-10-10 09:23:23.226+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	dd1f9c93-5b48-4292-ab25-1439296478af	2026-10-10 09:23:23.229+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	15a42e0a-0d09-453b-a520-4bc95ef52ded	2026-10-10 09:23:23.234+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	35a0dd4f-c707-41b0-adce-296a925f3b60	2026-10-10 09:23:23.238+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	9ea56cd5-504c-485a-a30b-3d4b8b2375eb	2026-10-10 09:23:23.242+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	f3c48773-3fe6-45a5-a70f-b16d76b663ec	2026-10-10 09:23:23.246+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	016d1641-8d59-4fcc-ada1-56eec3e61417	2026-10-10 09:23:23.25+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	c66e044b-0194-4c1b-a9c3-93dcb95d8f65	2026-10-10 09:23:23.253+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	b857e157-879c-4df0-a05c-bd00b1746d12	2026-10-10 09:23:23.256+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	e344f9f5-dc96-4189-a78e-5485c84f8349	2026-10-10 09:23:23.259+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	10db7331-20ad-4073-af91-1ccd7e3987c0	2026-10-10 09:23:23.263+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	35d794cd-618e-4380-ac04-c486665f0925	2026-10-10 09:23:23.266+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	a9e00195-fbc3-42e4-a60a-cdb18d961e5b	2026-10-10 09:23:23.269+00
8e98d3f6-859c-45ca-ab9f-508d54e8f932	afa37df7-f49d-4728-a951-abfb72db4790	2026-10-10 09:23:23.273+00
\.


--
-- Data for Name: event_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_registrations (id, event_id, user_id, joined_at, left_at, auto_created) FROM stdin;
d2cdb89b-5e18-474b-a809-7bc7f4c22201	daa1f312-395e-43a2-a91c-00f3a3d50bbb	518a7ba0-302a-4463-a113-f0ca5eb94dd7	2026-10-09 02:52:58.162909+00	\N	f
e3ded89b-5e18-474b-a809-7bc7f4c22202	daa1f312-395e-43a2-a91c-00f3a3d50bbb	1d646476-a477-4895-ab3b-319e24ce7115	2026-10-08 02:52:58.162909+00	\N	f
f4fed89b-5e18-474b-a809-7bc7f4c22203	daa1f312-395e-43a2-a91c-00f3a3d50bbb	b7e60b7b-fd9b-4c53-a7d6-f2e435c399ac	2026-10-07 02:52:58.162909+00	\N	f
\.


--
-- Data for Name: event_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_settings (event_id, partner_apply_deadline, booth_request_deadline, booth_cancel_cutoff, proposal_deadline, participant_reg_deadline, activity_cancel_cutoff, max_booths_per_partner, max_activities_per_partner, booth_hold_minutes, min_attendance_minutes, points_per_attendance) FROM stdin;
daa1f312-395e-43a2-a91c-00f3a3d50bbb	2026-10-20 02:52:56.215574+00	2026-10-22 02:52:56.215574+00	\N	2026-10-24 02:52:56.215574+00	2026-10-30 02:52:56.215574+00	\N	1	3	60	20	30
7e579f11-c470-4788-a0ef-3cc29525e16e	2026-10-18 02:52:56.215574+00	2026-10-19 02:52:56.215574+00	\N	2026-10-20 02:52:56.215574+00	2026-10-25 02:52:56.215574+00	\N	1	3	60	20	10
\.


--
-- Data for Name: event_suggestions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_suggestions (id, full_name, phone, content, status, internal_note, created_at) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (visibility, public_until, id, title, title_en, slug, theme, venue_id, start_at, end_at, status, priority_level, description, summary, summary_en, cover_image_url, published_at, cancelled_at, cancel_reason, created_by, is_deleted, created_at, updated_at) FROM stdin;
public	\N	c638df0a-af6d-4ba1-9f55-107e352cdcca	sự kiện ộ i i 2026	\N	su-kien-o-i-i-2026	\N	569210e0-e140-4ece-a8e1-0b67e32a3404	2026-10-11 17:00:00+00	2026-10-14 16:59:59+00	published	regular	\N	\N	\N	\N	2026-10-12 13:57:49.294+00	\N	\N	b9d37b50-942d-430a-a45f-0e303739b400	f	2026-10-12 13:57:18.009+00	2026-10-12 13:57:49.296+00
public	\N	163029a5-844c-4953-be87-942f4f9b1a9e	sự kiện valorant	\N	su-kien-valorant	\N	569210e0-e140-4ece-a8e1-0b67e32a3404	2026-10-11 17:00:00+00	2026-10-14 16:59:59+00	published	regular	\N	\N	\N	\N	2026-10-12 13:58:02.171+00	\N	\N	b9d37b50-942d-430a-a45f-0e303739b400	f	2026-10-12 13:58:02.151+00	2026-10-12 13:58:02.172+00
public	\N	daa1f312-395e-43a2-a91c-00f3a3d50bbb	Lễ hội Đường Sách Mùa Thu 2026	Autumn Book Street Festival 2026	le-hoi-duong-sach-mua-thu-2026	Mùa Thu & Những Trang Sách Kết Nối Tri Thức	569210e0-e140-4ece-a8e1-0b67e32a3404	2026-10-08 05:48:09.379385+00	2026-10-15 05:48:09.379385+00	published	high	Lễ hội thường niên quy tụ hàng trăm đầu sách mới, chương trình ký tặng của các tác giả tên tuổi và chuỗi tọa đàm nghệ thuật xuất bản.	Hội tụ sách hay, hoạt động hấp dẫn và không gian văn hóa dành cho mọi người.	\N	https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80	2026-10-11 10:28:12.842+00	\N	\N	87427bb9-732b-44b3-aed9-18938ae98fe9	f	2026-10-10 02:52:55.868153+00	2026-10-11 10:28:12.844+00
public	\N	7e579f11-c470-4788-a0ef-3cc29525e16e	Hội Sách Thiếu Nhi Hè 2026	Summer Children Book Fair 2026	hoi-sach-thieu-nhi-he-2026	Mở Trang Sách Sáng Tạo Mùa Hè Rực Rỡ	569210e0-e140-4ece-a8e1-0b67e32a3404	2026-10-20 05:48:09.379385+00	2026-10-25 05:48:09.379385+00	published	high	Ngày hội dành riêng cho các bạn nhỏ với hàng ngàn đầu sách tranh truyện, workshop khoa học và góc đọc tương tác.	Không gian vui chơi và đọc sách bổ ích cho thiếu nhi.	\N	https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80	2026-10-10 05:48:09.379385+00	\N	\N	87427bb9-732b-44b3-aed9-18938ae98fe9	f	2026-10-10 02:52:55.868153+00	2026-10-10 04:34:53.892+00
public	\N	bde2daf8-061d-4ae1-adeb-db8dd283e9c9	Ngày hội Đọc sách Thiếu nhi: "Phiêu lưu cùng Dế Mèn & Những người bạn"	Children Reading Festival: "Adventures of Cricket & Friends"	event-event-06		569210e0-e140-4ece-a8e1-0b67e32a3404	2026-10-17 01:30:00+00	2026-10-17 10:00:00+00	published	medium	Không gian kịch rối tương tác, đọc sách thiếu nhi và thi vẽ tranh minh họa nhận sách tặng dành cho các bé và gia đình.	Không gian kịch rối tương tác, đọc sách thiếu nhi và thi vẽ tranh minh họa nhận sách tặng dành cho các bé và gia đình.	\N	https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80	2026-10-10 05:48:09.379385+00	\N	\N	87427bb9-732b-44b3-aed9-18938ae98fe9	f	2026-10-10 02:52:55.868153+00	2026-10-10 02:52:55.868153+00
public	\N	89c22dc5-645b-4528-a081-8dc42a29b834	Đêm Thơ Nhạc Sài Gòn: "Giai điệu phố & Lời ru của sông"	Saigon Poetry & Acoustic Night: "Street Melodies & River Lullabies"	event-event-07		569210e0-e140-4ece-a8e1-0b67e32a3404	2026-10-22 11:30:00+00	2026-10-22 14:00:00+00	published	high	Không gian giao lưu thơ ca, ngâm thơ và biểu diễn guitar mộc mạc tôn vinh vẻ đẹp trữ tình của các thi phẩm về Sài Gòn xưa và nay.	Không gian giao lưu thơ ca, ngâm thơ và biểu diễn guitar mộc mạc tôn vinh vẻ đẹp trữ tình của các thi phẩm về Sài Gòn xưa và nay.	\N	https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80	2026-10-10 05:48:09.379385+00	\N	\N	87427bb9-732b-44b3-aed9-18938ae98fe9	f	2026-10-10 02:52:55.868153+00	2026-10-10 02:52:55.868153+00
public	\N	849259d6-ccfe-47fb-a90a-8a6f0c7aba9b	Workshop Nghệ Thuật: "Thực hành Đóng sách Thủ công & Khắc Mộc Bản"	Craft Workshop: "Handmade Bookbinding & Woodblock Printing"	event-event-08		569210e0-e140-4ece-a8e1-0b67e32a3404	2026-10-26 02:00:00+00	2026-10-26 05:00:00+00	published	medium	Bạn đọc được trực tiếp hướng dẫn khâu gáy sách kiểu cổ truyền, làm bìa sách giấy dó và in ấn tranh khắc gỗ truyền thống mang về.	Bạn đọc được trực tiếp hướng dẫn khâu gáy sách kiểu cổ truyền, làm bìa sách giấy dó và in ấn tranh khắc gỗ truyền thống mang về.	\N	https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80	2026-10-10 05:48:09.379385+00	\N	\N	87427bb9-732b-44b3-aed9-18938ae98fe9	f	2026-10-10 02:52:55.868153+00	2026-10-10 02:52:55.868153+00
public	\N	8e98d3f6-859c-45ca-ab9f-508d54e8f932	Tọa đàm Chuyên sâu: "Văn hóa Đọc trong Kỷ nguyên Trí tuệ Nhân tạo (AI)"	Panel Discussion: "Reading Culture in the Age of Artificial Intelligence"	event-event-09		569210e0-e140-4ece-a8e1-0b67e32a3404	2026-10-30 07:00:00+00	2026-10-30 09:30:00+00	published	high	Các chuyên gia công nghệ, nhà xuất bản và nhà giáo dục đối thoại về cách AI hỗ trợ việc học tập, bảo tồn di sản tri thức và nuôi dưỡng niềm say mê đọc sách.	Các chuyên gia công nghệ, nhà xuất bản và nhà giáo dục đối thoại về cách AI hỗ trợ việc học tập, bảo tồn di sản tri thức và nuôi dưỡng niềm say mê đọc sách.	\N	https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80	2026-10-10 05:48:09.379385+00	\N	\N	87427bb9-732b-44b3-aed9-18938ae98fe9	f	2026-10-10 02:52:55.868153+00	2026-10-10 02:52:55.868153+00
\.


--
-- Data for Name: feedbacks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedbacks (id, target_scope, heritage_id, booth_id, target_name, rating, comments, contact_email, source, status, assigned_to, internal_note, created_at, updated_at, event_id, full_name) FROM stdin;
32b9cae5-f5b9-4bc1-9b7d-3c315a09434b	entire	\N	\N	Lễ hội Đường Sách Mùa Thu 2026	5	sự kiện hay	\N	web_landing	new	\N	\N	2026-10-11 10:27:10.18+00	2026-10-11 10:27:10.18+00	daa1f312-395e-43a2-a91c-00f3a3d50bbb	\N
33c22f4d-0593-4707-9572-fb1f0637f8cc	entire	\N	\N	Lễ hội Đường Sách Mùa Thu 2026	5	QUÁ HAY	\N	web_landing	new	\N	\N	2026-10-11 14:22:51.499+00	2026-10-11 14:22:51.499+00	daa1f312-395e-43a2-a91c-00f3a3d50bbb	\N
b5b2d523-6015-4141-a9ce-43272283194f	heritage	e6b455d3-7f42-4e08-a332-23a6011a8a5d	\N	DS-01 Quần thể di tích Cố đô Huế	5	Phần thuyết minh và câu chuyện lịch sử về Cố đô Huế rất chi tiết, hình ảnh chụp Ngọ Môn sắc nét và sống động!	nguyenvana@gmail.com	web_landing	responded	\N	Cảm ơn quý độc giả đã yêu mến di sản văn hóa.	2026-10-10 02:52:59.076064+00	2026-10-10 02:52:59.076064+00	\N	\N
3f72e592-ec5a-437a-abcf-8a3f7dfe26b3	entire	\N	\N	Toàn Đường Sách TP.HCM	4	Không gian rợp bóng cây xanh mát mẻ, tuy nhiên vào cuối tuần buổi tối sân khấu A hơi đông, cần bố trí thêm ghế ngồi.	nguyenvana@gmail.com	web_landing	in_progress	\N	Đang bố trí thêm 50 ghế tựa tại khu vực khán đài A.	2026-10-10 02:52:59.076064+00	2026-10-10 05:02:22.011+00	\N	\N
c30e93f7-5d34-4786-a4c3-49d6eb72b498	booth	\N	\N	Gian hàng Nhà Xuất Bản Trẻ	5	Nhân viên tư vấn nhiệt tình, tìm được cuốn sách văn học hiếm rất ưng ý.	nguyenvana@gmail.com	web_landing	new	\N	\N	2026-10-10 02:52:59.076064+00	2026-10-10 02:52:59.076064+00	\N	\N
df0cee45-2e16-477c-a3d3-765e8995dca2	heritage	e6b455d3-7f42-4e08-a332-23a6011a8a5d	\N	DS-10 Di tích lịch sử Địa đạo Củ Chi	5	Mã QR quét tại điểm tải trang rất mượt, xem được đầy đủ lược đồ chiến khu!	dukhach_saigon@yahoo.com	web_landing	new	\N	\N	2026-10-10 02:52:59.076064+00	2026-10-10 05:02:37.942+00	\N	\N
e10aee45-2e16-477c-a3d3-765e8995dca3	entire	\N	\N	Khu tiện ích vệ sinh & nước uống	4	Nước uống miễn phí sạch sẽ, đề xuất bổ sung thêm thùng phân loại rác tái chế.	hoangminh.reader@gmail.com	web_landing	new	\N	\N	2026-10-10 02:52:59.076064+00	2026-10-10 02:52:59.076064+00	\N	\N
\.


--
-- Data for Name: heritage_qr_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.heritage_qr_codes (id, heritage_id, qr_data, created_at) FROM stdin;
4c6a1563-d654-49cb-a52f-9e3dcceeff85	e6b455d3-7f42-4e08-a332-23a6011a8a5d	https://duongsach.example.vn/heritages/ds-01	2026-10-10 02:52:58.612048+00
800e6690-1b21-445a-aaf3-8e7e4a899349	dbb3f1c4-4673-4b65-abc2-7a93006a4e17	https://duongsach.example.vn/heritages/ds-02	2026-10-10 02:52:58.612048+00
38930cd7-c72c-42dc-a317-192bcfd96814	0c8d0f33-f990-4f20-a369-630e91ff9f27	https://duongsach.example.vn/heritages/ds-03	2026-10-10 02:52:58.612048+00
e4e76f2f-9606-4165-a0c9-e8d65e6c7ffd	d98f008f-0d5d-4b7c-a799-eebbc66963fb	https://duongsach.example.vn/heritages/ds-04	2026-10-10 02:52:58.612048+00
fb850ea3-fedd-452b-a924-0a1291f96c48	22a1475e-29aa-47c9-a13c-60bbc2dec7ad	https://duongsach.example.vn/heritages/ds-05	2026-10-10 02:52:58.612048+00
9d1c3526-c926-4fb4-a374-2872a70a8883	bde1a23a-8af6-461d-adca-3a0d33b64f28	https://duongsach.example.vn/heritages/ds-06	2026-10-10 02:52:58.612048+00
bb894770-51b2-4fa8-abae-15a0063bfd64	3a7c495b-4dd9-4bac-aae6-f7e762970c50	https://duongsach.example.vn/heritages/ds-07	2026-10-10 02:52:58.612048+00
16df44a5-44ab-4a46-a0d8-902a6e59dc54	9c035a5d-9ec0-4117-a6c3-4711db9d863a	https://duongsach.example.vn/heritages/ds-08	2026-10-10 02:52:58.612048+00
10a6a6bd-c7bd-4350-a7f9-78b3b9aa56b6	71e08a20-374b-4115-a5ef-f30d7199063d	https://duongsach.example.vn/heritages/ds-09	2026-10-10 02:52:58.612048+00
fa9f6f57-2662-4a2b-ae6f-77fa7928e717	6b450a5c-00f4-4f2b-abfb-06655bcdf713	https://duongsach.example.vn/heritages/ds-10	2026-10-10 02:52:58.612048+00
\.


--
-- Data for Name: heritages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.heritages (id, code, slug, name, name_en, province, province_en, category, category_en, period, period_en, address, address_en, brief_desc, brief_desc_en, story, story_en, highlights, highlights_en, reference_source, status, qr_status, view_count, qr_scan_count, image_url, image_alt, image_source, image_license, map_x, map_y, map_area_name, is_deleted, deleted_at, deleted_by, created_at, updated_at) FROM stdin;
22a1475e-29aa-47c9-a13c-60bbc2dec7ad	DS-05	ds-05	Thành nhà Hồ	Citadel of the Ho Dynasty	Thanh Hóa	Thanh Hoa	Di sản Văn hóa Thế giới	\N	Xây dựng năm 1397 (Nhà Hồ)	\N	\N	\N	Tòa thành kiên cố xây hoàn toàn bằng những khối đá xanh khổng lồ đẽo gọt chuẩn xác, kiệt tác kiến trúc quân sự độc nhất vô nhị ở Đông Nam Á.	A stone-block fortress built in 1397 using massive limestone blocks, standing as an exceptional military engineering masterpiece.	Được Hồ Quý Ly cho khởi công xây dựng vào mùa xuân năm Đinh Sửu 1397 với tên gọi Tây Đô chỉ trong vỏn vẹn ba tháng, Thành nhà Hồ là hiện tượng kỳ vĩ trong lịch sử kiến trúc quân sự thế giới. Toàn bộ bốn bức tường thành và bốn vòm cổng uy nghi đều được ghép bằng những tảng đá vôi xanh nguyên khối khổng lồ, được ghè đẽo vuông vức và xếp khít khao không cần đến bất kỳ loại vữa kết dính nào. Dưới thời tiết khắc nghiệt miền Trung suốt hơn sáu thế kỷ, cổng vòm Nam của thành vẫn đứng sừng sững uy nghi, chứng minh trí tuệ siêu phàm và sức lao động phi thường của tiền nhân Đại Việt.	Constructed in just three months in 1397 under Ho Quy Ly, this colossal stone citadel was fashioned entirely from massive limestone blocks fitted together without cement. Its monumental arched southern gates have endured six centuries as a testament to exceptional Vietnamese stone-masonry.	["Công trình thành đá cổ duy nhất còn lại ở Đông Nam Á được lắp ghép không dùng chất kết dính.", "Khối lượng đá xanh đồ sộ nặng từ 10 đến 26 tấn được vận chuyển và lắp ráp chuẩn xác tuyệt đối.", "Sự kết hợp tinh tế giữa quy phạm phong thủy Nho giáo truyền thống và kỹ nghệ công sự phòng thủ."]	[]	Ban Quản lý Di tích Thành Nhà Hồ & Hồ sơ UNESCO số 1358	published	active	150	0	/assets/heritage/verified/ds-05.jpg	Tay Do castle South gate.JPG	\N	\N	50.00	50.00	Đường Nguyễn Văn Bình	f	\N	\N	2026-10-10 02:52:58.608528+00	2026-10-10 02:52:58.608528+00
d98f008f-0d5d-4b7c-a799-eebbc66963fb	DS-04	ds-04	Khu trung tâm Hoàng thành Thăng Long	Central Sector of the Imperial Citadel of Thang Long	Hà Nội	Hanoi	Di sản Văn hóa Thế giới	\N	Khởi lập năm 1010 (Lý – Trần – Lê – Nguyễn)	\N	\N	\N	Trung tâm quyền lực chính trị liên tục suốt 13 thế kỷ của các triều đại phong kiến Đại Việt, chứa đựng tầng văn hóa khảo cổ vô giá.	The continuous political power hub of Dai Viet dynasties across 13 centuries, featuring priceless archaeological strata.	Mùa thu năm Canh Tuất 1010, vua Lý Thái Tổ ban Chiếu dời đô từ Hoa Lư về thành Đại La, mở ra trang sử rực rỡ của kinh đô Thăng Long nghìn năm văn hiến. Trải qua hơn một nghìn năm với các vương triều Lý, Trần, Lê, Mạc, Nguyễn, mảnh đất này luôn giữ vị thế trái tim quyền lực của nước Đại Việt. Những cuộc khai quật khảo cổ học tại 18 Hoàng Diệu đã làm phát lộ các tầng văn hóa chồng xếp lên nhau nguyên vẹn, từ giếng nước gạch hoa, ngói rồng men xanh thời Lý đến dấu tích nền Điện Kính Thiên thời Hậu Lê. Hoàng thành Thăng Long là biểu tượng trường tồn của độc lập dân tộc và bản lĩnh văn hiến Việt Nam.	Established in 1010 when King Ly Thai To moved the capital to Thang Long, this site remained the seat of imperial administrative power for consecutive dynasties. Archeological findings at 18 Hoang Dieu prove an unbroken civilizational continuum spanning over a thousand years.	["Tính kế thừa và liên tục quyền lực chính trị hiếm có trong lịch sử thế giới.", "Tầng văn hóa khảo cổ dày đặc phát lộ dấu tích cung điện từ thời Tiền Thăng Long đến hiện đại.", "Các di tích nổi bật: Cột cờ Hà Nội, Đoan Môn, Điện Kính Thiên, Hậu Lâu và Bắc Môn."]	[]	Trung tâm Bảo tồn Di sản Thăng Long - Hà Nội & Hồ sơ UNESCO số 1328	published	active	150	0	/assets/heritage/verified/ds-04.jpg	Doan Mon Gate 2.jpg	\N	\N	50.00	50.00	Đường Nguyễn Văn Bình	f	\N	\N	2026-10-10 02:52:58.608528+00	2026-10-10 02:52:58.608528+00
bde1a23a-8af6-461d-adca-3a0d33b64f28	DS-06	ds-06	Quần thể danh thắng Tràng An	Trang An Landscape Complex	Ninh Bình	Ninh Binh	Di sản Thế giới Hỗn hợp (Văn hóa & Thiên nhiên)	\N	Địa chất karst 250 triệu năm & Di chỉ tiền sử 30.000 năm	\N	\N	\N	Di sản thế giới kép đầu tiên tại Đông Nam Á, nơi giao hòa giữa tháp karst nhiệt đới ngập nước tuyệt mỹ và dấu vết người tiền sử.	Southeast Asia's first dual mixed World Heritage Site, blending spectacular flooded karst towers with 30,000 years of human evolution.	Tràng An là bản hòa ca tráng lệ giữa thiên nhiên kỳ vĩ và chiều sâu lịch sử dân tộc. Cảnh quan nơi đây gồm các dãy tháp đá vôi dựng đứng soi bóng xuống mặt nước trong vắt, kết nối qua hệ thống 48 hang động xuyên thủy kỳ ảo như hang Sáng, hang Tối, hang Nấu Rượu. Bên trong những mái đá thâm u, các nhà khảo cổ đã tìm thấy vỏ nhuyễn thể, công cụ đá chứng minh con người tiền sử đã liên tục sinh sống và thích ứng bền bỉ qua các đợt biển tiến, biển thoái từ hơn 30.000 năm trước. Nơi đây cũng từng là kinh đô Hoa Lư vững chắc bảo vệ non sông thời Đinh - Tiền Lê thế kỷ thứ X.	Trang An presents a breathtaking landscape of sheer karst towers rising above quiet flooded valleys. Archaeological excavations across cave shelters here unearthed invaluable evidence of human prehistoric settlement adapting to changing sea levels over 30,000 years, beside being the historical cradle of ancient Hoa Lu.	["Di sản hỗn hợp văn hóa và thiên nhiên duy nhất được UNESCO công nhận tại Việt Nam.", "Cảnh quan karst tháp chuông ngoạn mục đan xen mạng lưới hang động và thung nước nguyên sơ.", "Hồ sơ khảo cổ lưu giữ bằng chứng cư trú và thích ứng biến đổi khí hậu của người tiền sử."]	[]	Ban Quản lý Quần thể Danh thắng Tràng An & UNESCO số 1438	published	active	150	0	/assets/heritage/verified/ds-06.jpg	Trang An, Ninh Binh.jpg	\N	\N	50.00	50.00	Đường Nguyễn Văn Bình	f	\N	\N	2026-10-10 02:52:58.608528+00	2026-10-10 02:52:58.608528+00
3a7c495b-4dd9-4bac-aae6-f7e762970c50	DS-07	ds-07	Vườn quốc gia Phong Nha – Kẻ Bàng	Phong Nha – Ke Bang National Park	Quảng Bình	Quang Binh	Di sản Thiên nhiên Thế giới	\N	Quá trình kiến tạo địa chất karst hơn 400 triệu năm	\N	\N	\N	Vương quốc hang động thế giới sở hữu khối karst cổ nhất châu Á cùng hang Sơn Đoòng — hang động tự nhiên lớn nhất hành tinh.	The world's cave kingdom with Asia's oldest karst system and Son Doong, the largest natural cave on Earth.	Được mệnh danh là trái tim của di sản địa chất Việt Nam, Phong Nha – Kẻ Bàng bảo tồn một bảo tàng địa chất sống động được hình thành từ kỷ Cổ sinh cách đây hơn 400 triệu năm. Nơi đây ẩn giấu quần thể hang động tráng lệ bậc nhất trái đất, từ động Thiên Đường lung linh muôn sắc thạch nhũ, động Phong Nha với dòng sông ngầm dài nhất, đến hang Sơn Đoòng với thể tích khổng lồ đủ sức chứa cả một dãy phố cao tầng New York bên trong. Thảm rừng nhiệt đới nguyên sinh bạt ngàn bao phủ các dãy núi đá vôi cũng là ngôi nhà cư trú an lành của hàng ngàn loài động thực vật quý hiếm nằm trong Sách Đỏ.	Representing more than 400 million years of Earth history, Phong Nha – Ke Bang is celebrated globally as the ultimate kingdom of caves. Housing Hang Son Doong and underground rivers flowing beneath undisturbed primary rainforests, it protects unparalleled karst beauty and rich endemic wildlife.	["Hệ thống hang động kỳ vĩ dài hơn 300km với các sông ngầm, thạch nhũ và hố sụt khổng lồ.", "Khối đá vôi cổ xưa nhất châu Á trải qua nhiều thời kỳ biến dạng kiến tạo phức tạp.", "Khu hệ sinh thái rừng nhiệt đới nguyên sinh có độ đa dạng sinh học đặc biệt cao."]	[]	Ban Quản lý Vườn Quốc gia Phong Nha - Kẻ Bàng & UNESCO số 95	published	active	150	0	/assets/heritage/verified/ds-07.jpg	PhongNhaCave.jpg	\N	\N	50.00	50.00	Đường Nguyễn Văn Bình	f	\N	\N	2026-10-10 02:52:58.608528+00	2026-10-10 02:52:58.608528+00
71e08a20-374b-4115-a5ef-f30d7199063d	DS-09	ds-09	Khu di tích Chủ tịch Hồ Chí Minh tại Phủ Chủ tịch	Presidential Palace Historical Site	Hà Nội	Hanoi	Di tích Lịch sử - Lưu niệm Quốc gia	\N	Thời kỳ 1954 – 1969	\N	\N	\N	Không gian sống và làm việc suốt 15 năm cuối đời của Chủ tịch Hồ Chí Minh, tiêu biểu với ngôi Nhà sàn gỗ mộc mạc bên bờ ao cá.	The modest residence and workspace where President Ho Chi Minh lived and worked from 1954 until 1969.	Từ năm 1954 đến khi Người qua đời vào mùa thu năm 1969, Chủ tịch Hồ Chí Minh đã chọn sống trong một căn nhà nhỏ đơn sơ thay vì tòa dinh thự Phủ Toàn quyền lộng lẫy kế bên. Ngôi nhà sàn bằng gỗ hai tầng thoáng đãng hướng ra ao cá, xung quanh là hàng dâm bụt đỏ, hàng xoài miền Nam và những cây vú sữa đồng bào gửi tặng. Tại góc bàn làm việc nhìn ra mặt nước phẳng lặng, Người đã cùng Trung ương hoạch định đường lối kháng chiến cứu nước, soạn thảo bản Di chúc lịch sử thiêng liêng. Nơi đây mãi là biểu tượng cao đẹp của đạo đức cách mạng và tinh thần tận tụy vì nhân dân.	Spanning from 1954 to 1969, President Ho Chi Minh chose to reside in a humble wooden stilt house rather than the opulent colonial palace. Surrounded by orchards, southern mango trees, and an open fish pond, this peaceful sanctuary was where pivotal decisions shaping Vietnam's modern history were forged.	["Nơi lưu giữ trọn vẹn phong cách sống thanh bạch, giản dị của vị lãnh tụ kính yêu.", "Ngôi nhà sàn gỗ kiến trúc dân tộc Thái nằm giữa vườn cây xum xuê và ao cá Bác Hồ.", "Bộ sưu tập hàng ngàn tài liệu, hiện vật và những tác phẩm tư tưởng bất hủ thời đại."]	[]	Khu Di tích Chủ tịch Hồ Chí Minh tại Phủ Chủ tịch & Bộ Văn hóa, Thể thao và Du lịch	published	active	150	0	/assets/heritage/verified/ds-09.jpg	Ho Chi Minh House 3012017573 19ef7d0d3c.jpg	\N	\N	50.00	50.00	Đường Nguyễn Văn Bình	f	\N	\N	2026-10-10 02:52:58.608528+00	2026-10-10 02:52:58.608528+00
e6b455d3-7f42-4e08-a332-23a6011a8a5d	DS-01	ds-01	Quần thể di tích Cố đô Huế	Complex of Hue Monuments	Thừa Thiên Huế	Thua Thien Hue	Di sản Văn hóa Thế giới	\N	Triều Nguyễn (1802 – 1945)	\N	\N	\N	Kinh đô phong kiến cuối cùng của Việt Nam với hệ thống thành quách, cung điện, lăng tẩm hoàng gia uy nghiêm soi bóng bên dòng Hương Giang.	The last imperial capital of Vietnam, boasting fortified citadels, regal palaces, and tombs beside the Perfume River.	Khởi dựng từ năm 1805 dưới triều vua Gia Long và hoàn thiện dưới thời Minh Mạng, Cố đô Huế là biểu tượng đỉnh cao của nền quy hoạch đô thị và kiến trúc triều đình Việt Nam thế kỷ XIX. Trải qua hơn một thế kỷ thăng trầm lịch sử và khói lửa chiến tranh, Kinh thành Huế cùng Hoàng thành và Tử Cấm Thành vẫn gìn giữ trọn vẹn tinh hoa phong thủy Á Đông — lấy núi Ngự Bình làm bình phong, cồn Hến và cồn Dã Viên làm tả thanh long, hữu bạch hổ. Nơi đây không chỉ là quần thể kiến trúc đồ sộ mà còn là bảo tàng sống lưu giữ hồn cốt văn hóa, lễ nhạc và tri thức cung đình của một vương triều đã khép lại trang sử phong kiến nước nhà.	Founded in 1805 under Emperor Gia Long, the Complex of Hue Monuments embodies the pinnacle of 19th-century Vietnamese royal architecture and urban geomancy. Standing along the Perfume River, its citadel, imperial palaces, and emperor mausoleums remain an authentic living archive of courtly rituals, philosophy, and classical arts.	["Kiến trúc cung đình phương Đông kết hợp kỹ thuật phòng thủ phương Tây kiểu Vauban.", "Hệ thống lăng tẩm các hoàng đế nhà Nguyễn hòa quyện hài hòa cùng cảnh quan thiên nhiên.", "Di sản tư liệu phong phú với Nhã nhạc cung đình, Mộc bản và Châu bản triều Nguyễn."]	[]	Trung tâm Bảo tồn Di tích Cố đô Huế & Hồ sơ UNESCO số 678	published	active	150	0	/assets/heritage/verified/ds-01.png	Ngọ Môn.png	\N	\N	50.00	50.00	Đường Nguyễn Văn Bình	f	\N	\N	2026-10-10 02:52:58.608528+00	2026-10-10 02:52:58.608528+00
6b450a5c-00f4-4f2b-abfb-06655bcdf713	DS-10	ds-10	Di tích lịch sử Địa đạo Củ Chi	Cu Chi Tunnels Historical Relic	TP. Hồ Chí Minh	Ho Chi Minh City	Di tích Lịch sử Quân sự Quốc gia	\N	Giai đoạn kháng chiến 1946 – 1968	\N	\N	\N	Mạng lưới công sự ngầm dài hơn 250km được ví như “thành phố trong lòng đất”, minh chứng cho ý chí kiên cường và nghệ thuật chiến tranh nhân dân.	A subterranean labyrinth extending over 250km dug by hand, acclaimed worldwide as a subterranean marvel of human resilience.	Được mệnh danh là “vùng đất thép thành đồng”, Địa đạo Củ Chi được đào hoàn toàn bằng sức người với dụng cụ thô sơ suốt những năm tháng kháng chiến chống giặc ngoại xâm ác liệt. Mạng lưới đường hầm chằng chịt dài trên 250km xuyên sâu dưới lòng đất từ 3 đến 12 mét, chống chịu được đạn pháo và bom hạng nặng. Dưới lòng đất tối tăm và thiếu dưỡng khí, các chiến sĩ và đồng bào Củ Chi vẫn sinh hoạt, chữa bệnh, nấu nướng bằng bếp Hoàng Cầm giấu khói và tổ chức các cuộc tiến công quyết định. Địa đạo Củ Chi ngày nay là điểm đến lịch sử nổi tiếng toàn cầu, thu hút hàng triệu du khách đến chiêm ngưỡng ý chí kiên cường của con người Việt Nam.	Chiseled entirely by hand into hard laterite earth over decades of resistance, the Cu Chi tunnels stretch over 250 kilometers underground. Functioning as living quarters, hospitals, weapon workshops, and command posts, it stands today as an internationally recognized monument to indomitable human spirit.	["Hệ thống đường hầm nhiều tầng sâu trong lòng đất đất sét ong với các cửa nắp ngụy trang bí mật.", "Đầy đủ công năng sinh hoạt chiến đấu: phòng hội họp, bếp Hoàng Cầm không khói, bệnh xá và giếng nước.", "Kỳ tích quân sự độc đáo khẳng định sức mạnh đoàn kết và ý chí bất khuất của quân dân Nam Bộ."]	[]	Ban Quản lý Khu Di tích Lịch sử Địa đạo Củ Chi & UBND TP. Hồ Chí Minh	published	active	150	0	/assets/heritage/verified/ds-10.jpg	Cu Chi Tunnel.jpg	\N	\N	50.00	50.00	Đường Nguyễn Văn Bình	f	\N	\N	2026-10-10 02:52:58.608528+00	2026-10-10 02:52:58.608528+00
0c8d0f33-f990-4f20-a369-630e91ff9f27	DS-03	ds-03	Khu đền tháp Mỹ Sơn	My Son Sanctuary	Quảng Nam	Quang Nam	Di sản Văn hóa Thế giới	\N	Thế kỷ IV – XIII (Vương quốc Chămpa)	\N	\N	\N	Thánh địa tôn giáo linh thiêng của nền văn minh Chămpa ẩn mình trong thung lũng khép kín, nổi tiếng với nghệ thuật xây gạch không mạch vữa.	A religious valley sanctuary of the ancient Champa civilization, famous for mortarless brick architecture and sandstone reliefs.	Nằm ẩn mình giữa thung lũng lòng chảo đường kính chừng hai cây số được bao bọc bởi núi Chúa hùng vĩ, Mỹ Sơn từng là trung tâm cúng tế linh thiêng nhất của các triều vua Chămpa suốt gần một ngàn năm. Hơn 70 công trình đền tháp bằng gạch đỏ rực đứng uy nghiêm giữa màu xanh đại ngàn, được xây dựng theo kỹ thuật ghép gạch kín khít thần kỳ mà khoa học hiện đại vẫn miệt mài nghiên cứu. Dù bom đạn chiến tranh đã hủy hoại nhiều cụm tháp, các phế tích trầm mặc còn lại vẫn toát lên vẻ đẹp siêu việt của nghệ thuật điêu khắc hoa văn dây leo, thần hộ pháp Dvarapala và vũ nữ Apsara mềm mại.	Set within a secluded amphitheater valley presided over by sacred Cat's Tooth Mountain, My Son was the spiritual epicenter of the Champa kingdom for nearly a millennium. Its red-brick tower temples, carved directly into living brick, stand as poignant monuments of engineering mastery and Hindu-Buddhist art.	["Tuyệt kỹ xây dựng tháp bằng gạch nung kết dính bí ẩn không để lộ mạch vữa.", "Hệ thống điêu khắc đá sa thạch mang đậm dấu ấn Ấn Độ giáo tôn vinh thần Shiva.", "Bằng chứng vật chất độc nhất về một nền văn minh bản địa phát triển rực rỡ suốt cả thiên niên kỷ."]	[]	Ban Quản lý Di sản Văn hóa Mỹ Sơn & Hồ sơ UNESCO số 949	published	active	150	0	/assets/heritage/verified/ds-03.jpg	My Son Sanctuary, Vietnam, 2017 (52416000869).jpg	\N	\N	50.00	50.00	Đường Nguyễn Văn Bình	f	\N	\N	2026-10-10 02:52:58.608528+00	2026-10-10 02:52:58.608528+00
dbb3f1c4-4673-4b65-abc2-7a93006a4e17	DS-02	ds-02	Đô thị cổ Hội An	Hoi An Ancient Town	Quảng Nam	Quang Nam	Di sản Văn hóa Thế giới	\N	Thế kỷ XVI – XIX	\N	\N	\N	Thương cảng quốc tế truyền thống Đông Nam Á được bảo tồn gần như nguyên vẹn với mái ngói âm dương rêu phong và đèn lồng lung linh.	An exceptionally well-preserved Southeast Asian commercial port dating from the 16th to the 19th centuries.	Từng là thương cảng quốc tế sầm uất bậc nhất khu vực Đàng Trong từ thế kỷ XVI, Hội An là điểm hẹn giao thương của những đội thuyền buôn từ Nhật Bản, Trung Hoa, Bồ Đào Nha và Hà Lan. Nhờ sự chuyển dòng tự nhiên của sông Thu Bồn làm luồng lạch cạn dần ở thế kỷ XIX, Hội An may mắn thoát khỏi làn sóng đô thị hóa hiện đại, giữ lại gần như nguyên vẹn mạng lưới đường phố bàn cờ hẹp, những ngôi nhà cổ lợp ngói âm dương, giếng nước cổ Bá Lễ và cây Chùa Cầu linh thiêng. Nơi đây là minh chứng sống động cho tinh thần cởi mở, bao dung và sức sống bền bỉ của văn hóa cư dân miền Trung qua nhiều thế kỷ.	Thriving as a vibrant maritime trading hub from the 16th to the 19th centuries, Hoi An uniquely preserved its grid layout, wooden row houses, and assembly halls. Its gentle pace, timber bridges, and lantern-lit alleys reflect centuries of peaceful international cultural synthesis.	["Giao thoa văn hóa kiến trúc đặc sắc giữa Việt Nam, Nhật Bản, Trung Hoa và phương Tây.", "Quần thể nhà phố cổ khung gỗ, tường vàng quét vôi truyền thống và ngói âm dương.", "Không gian sinh hoạt văn hóa dân gian gắn liền với lễ hội đèn lồng và ẩm thực xứ Quảng."]	[]	Trung tâm Quản lý Bảo tồn Di sản Văn hóa Hội An & UNESCO số 948	published	active	150	0	/assets/heritage/verified/ds-02.jpg	Hoi An Ancient Town.jpg	\N	\N	50.00	50.00	Đường Nguyễn Văn Bình	f	\N	\N	2026-10-10 02:52:58.608528+00	2026-10-10 02:52:58.608528+00
9c035a5d-9ec0-4117-a6c3-4711db9d863a	DS-08	ds-08	Vịnh Hạ Long – Quần đảo Cát Bà	Ha Long Bay – Cat Ba Archipelago	Quảng Ninh / Hải Phòng	Quang Ninh / Hai Phong	Di sản Thiên nhiên Thế giới	\N	Tiến hóa địa chất karst ngập biển 500 triệu năm	\N	\N	\N	Kỳ quan thiên nhiên thế giới với hàng ngàn hòn đảo đá vôi xanh ngắt nổi bật giữa mặt biển phẳng lặng như tấm gương khổng lồ.	A magnificent marine world wonder comprising thousands of dramatic limestone towers emerging from emerald sea waters.	Gắn liền với huyền tích rồng mẹ cùng đàn rồng con hạ phàm phun châu nhả ngọc tạo thành hàng ngàn đảo đá ngăn chặn giặc ngoại xâm, Vịnh Hạ Long và Quần đảo Cát Bà là tuyệt tác kỳ vĩ của thiên nhiên nhiệt đới. Qua hàng triệu năm chịu tác động của sóng biển và gió mùa, các khối núi đá vôi vươn thẳng từ lòng đại dương đã tạo nên các vòm hang kỳ thú như hang Đầu Gỗ, động Thiên Cung và hồ Ba Hầm. Năm 2023, UNESCO đã chính thức mở rộng ranh giới di sản sang Quần đảo Cát Bà, khẳng định giá trị toàn cầu nguyên vẹn của kỳ quan sinh thái biển đảo số một nước ta.	Entwined with the legend of the Mother Dragon descending to protect the realm, Ha Long Bay and Cat Ba Archipelago represent nature's greatest maritime sculpture. Thousands of towering limestone pillars and turquoise bays create a tranquil sanctuary of exceptional aesthetic and geological worth.	["Hình mẫu xuất sắc nhất thế giới về cảnh quan karst chìm ngập trong biển nhiệt đới.", "Quần tụ hơn 2.600 hòn đảo lớn nhỏ mang hình thù sống động như rồng thiêng hạ cánh.", "Hệ sinh thái biển đảo phong phú với rừng ngập mặn, rạn san hô và loài Voọc Cát Bà cực kỳ quý hiếm."]	[]	Ban Quản lý Vịnh Hạ Long & Hồ sơ UNESCO số 672 bis (Mở rộng 2023)	published	active	150	0	/assets/heritage/verified/ds-08.jpg	Ha Long Bay - Bahía de Ha Long.JPG	\N	\N	50.00	50.00	Đường Nguyễn Văn Bình	f	\N	\N	2026-10-10 02:52:58.608528+00	2026-10-10 02:52:58.608528+00
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.locations (id, venue_id, code, name, name_en, kind, capacity, zone, map_x, map_y, is_deleted, created_at, updated_at) FROM stdin;
fbf1be37-e5e0-4fc4-a75d-79c4fbdd94c8	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-A05	Vị trí Gian hàng Nhà Sách Bình Minh	\N	booth	30	Khu A	57.60	31.70	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.146+00
2a0ec771-a791-4a7b-af72-0d3826c99871	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B-08	Vị trí First News - Trí Việt	\N	booth	30	Khu A	64.30	36.80	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.172+00
1dd0b5d5-3651-475a-aab7-aebf6d628273	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B-09	Vị trí Đinh Tị Books	\N	booth	30	Khu A	62.90	44.60	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.175+00
0ce1362f-8a1e-4f0e-a42d-8129cc3d0926	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B-10	Vị trí Alpha Books & Omega Plus	\N	booth	30	Khu A	34.80	75.90	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.178+00
92522c68-e53f-4e54-ad29-651d6f89ca79	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B-11	Vị trí Gian hàng Nhà Xuất Bản Phụ Nữ	\N	booth	30	Khu A	54.40	66.10	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.181+00
22848a0d-4a62-4966-acdf-433cedb3a7e2	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B-12	Vị trí Không Gian Lưu Niệm & Tranh Cổ	\N	booth	30	Khu A	40.10	69.20	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.184+00
19084470-e414-4806-bdd5-f557795f8528	569210e0-e140-4ece-a8e1-0b67e32a3404	B-13	Vị trí vcb	\N	booth	0	\N	47.00	42.10	f	2026-10-12 06:56:08.433+00	2026-10-12 06:56:13.188+00
74504a41-22d1-4a44-ac6c-a452359ef291	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-EXHIBIT	Khu Triển Lãm & Trưng Bày	\N	other	150	Khu A	33.00	65.80	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.209+00
d67622d5-1cd3-40a0-ac8e-271a550f258c	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-READ-01	Không Gian Đọc Sách Cộng Đồng	\N	reading_area	100	Khu C	50.50	60.20	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.214+00
e98d0808-ceb7-4734-a471-c8d1e37dab61	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-STAGE	Sân Khấu Chính (Main Stage)	\N	main_stage	250	Khu Trung Tâm	53.80	45.60	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.22+00
70568dc7-f50b-4499-ade5-e3fcfd19e8b1	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-WORK-01	Khu Vực Workshop & Trải Nghiệm	\N	workshop_area	80	Khu B	72.70	77.50	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.226+00
b1112222-ceb7-4734-a471-c8d1e37dab61	a1112222-e140-4ece-a8e1-0b67e32a3405	LOC-TD-STAGE	Sân Khấu Hoa Sen - Thủ Đức	\N	main_stage	200	Khu Trung Tâm	60.00	60.10	f	2026-10-10 02:52:53.987292+00	2026-10-10 10:25:30.032+00
eca9f427-9189-4548-ad2f-2b33b4f1f179	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B-07	Vị trí Gian hàng NXB Tổng Hợp TP.HCM	\N	booth	30	Khu A	58.90	51.80	f	2026-10-10 02:52:53.987292+00	2026-10-11 13:53:44.952+00
eeef7413-87f1-41e6-af08-e1b450ad3fa8	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-A01	Vị trí Gian A01	\N	booth	30	Khu A	50.00	50.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.435+00
7aa9a164-3a8b-4f26-a0dd-5b84690818a4	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-A02	Vị trí Gian A02	\N	booth	30	Khu A	50.00	50.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.437+00
144a77c5-0747-4e48-a30f-07cc07435f6c	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-A03	Vị trí Gian A03	\N	booth	30	Khu A	50.00	50.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.439+00
30d8af73-2a6c-447d-a94f-24306ba919f6	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-A04	Vị trí Gian A04	\N	booth	30	Khu A	50.00	50.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.441+00
fcff0457-4e8d-4eb7-a851-5d70135fa470	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-A06	Vị trí Gian A06	\N	booth	30	Khu A	50.00	50.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.445+00
482e8240-9a24-45b5-add4-2e930f80dc7c	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-A07	Vị trí Gian A07	\N	booth	30	Khu A	50.00	50.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.446+00
791c074f-a33f-4c69-a533-d4155d43c3d8	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-A08	Vị trí Gian A08	\N	booth	30	Khu A	50.00	50.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.448+00
3ecd645e-7b9c-4abf-a864-bdde3226c50e	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-C03	Vị trí Gian C03	\N	booth	30	Khu C	50.00	50.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.451+00
a2f6a8ed-52c2-44d5-a0d4-075d5e639236	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-C04	Vị trí Gian C04	\N	booth	30	Khu C	50.00	50.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.453+00
d6556e8b-2735-4a08-a204-8c52c42798ef	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-A09	Vị trí Gian A09	\N	booth	30	Khu A	50.00	50.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.466+00
41de22f5-5607-4275-a7ae-99cccd6e01a0	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B01	Vị trí Gian B01	\N	booth	30	Khu B	50.00	50.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.468+00
8a01f7ba-c03f-4a77-a242-6b8d76717c1e	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B02	Vị trí Gian B02	\N	booth	30	Khu B	50.00	50.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.47+00
dd1f9c93-5b48-4292-ab25-1439296478af	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-A10	Vị trí Gian A10	\N	booth	30	Khu A	50.10	37.30	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.488+00
15a42e0a-0d09-453b-a520-4bc95ef52ded	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-C01	Vị trí Gian C01	\N	booth	30	Khu C	50.60	28.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.49+00
35a0dd4f-c707-41b0-adce-296a925f3b60	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-C02	Vị trí Gian C02	\N	booth	30	Khu C	58.30	31.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 04:36:35.492+00
afa37df7-f49d-4728-a951-abfb72db4790	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B-04	Vị trí Phương Nam Book Store	\N	booth	30	Khu A	67.10	55.90	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.162+00
9ea56cd5-504c-485a-a30b-3d4b8b2375eb	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B-05	Vị trí Thái Hà Books	\N	booth	30	Khu A	45.40	63.50	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.166+00
35d794cd-618e-4380-ac04-c486665f0925	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B-06	Vị trí Cà Phê Sách Bằng Lăng Tím	\N	booth	30	Khu A	41.50	47.90	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.169+00
b2223333-dc96-4189-a78e-5485c84f8349	a1112222-e140-4ece-a8e1-0b67e32a3405	LOC-TD-01	Vị trí Gian hàng Thủ Đức 01	\N	booth	30	Khu A	21.70	64.00	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.193+00
b3334444-20ad-4073-af91-1ccd7e3987c0	a1112222-e140-4ece-a8e1-0b67e32a3405	LOC-TD-02	Vị trí Gian hàng Thủ Đức 02	\N	booth	30	Khu A	28.30	60.10	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.197+00
b4445555-cdb1-4073-af91-1ccd7e3987c1	a1112222-e140-4ece-a8e1-0b67e32a3405	LOC-TD-03	Vị trí Cà Phê Sách Thủ Đức	\N	booth	30	Khu B	73.00	64.50	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.202+00
f3c48773-3fe6-45a5-a70f-b16d76b663ec	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B03	Vị trí Gian B03	\N	booth	30	Khu B	28.80	81.90	f	2026-10-10 02:52:53.987292+00	2026-10-10 10:40:03.613+00
016d1641-8d59-4fcc-ada1-56eec3e61417	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B04	Vị trí Gian B04	\N	booth	30	Khu B	48.60	41.90	f	2026-10-10 02:52:53.987292+00	2026-10-10 10:40:03.615+00
c66e044b-0194-4c1b-a9c3-93dcb95d8f65	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B05	Vị trí Gian B05	\N	booth	30	Khu B	51.30	60.10	f	2026-10-10 02:52:53.987292+00	2026-10-10 10:40:03.617+00
b857e157-879c-4df0-a05c-bd00b1746d12	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B06	Vị trí Gian B06	\N	booth	30	Khu B	64.50	80.00	f	2026-10-10 02:52:53.987292+00	2026-10-10 10:40:03.619+00
e344f9f5-dc96-4189-a78e-5485c84f8349	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B-01	Vị trí Gian hàng Nhà Xuất Bản Trẻ	\N	booth	30	Khu A	58.70	72.70	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.151+00
10db7331-20ad-4073-af91-1ccd7e3987c0	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B-02	Vị trí Gian hàng Nhà Xuất Bản Kim Đồng	\N	booth	30	Khu A	53.30	37.90	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.154+00
a9e00195-fbc3-42e4-a60a-cdb18d961e5b	569210e0-e140-4ece-a8e1-0b67e32a3404	LOC-B-03	Vị trí Hiệu sách Nhã Nam	\N	booth	30	Khu A	35.70	53.70	f	2026-10-10 02:52:53.987292+00	2026-10-12 06:56:13.158+00
d061cf8d-b342-435f-8cbc-7b7cfa946a4c	79978f73-dec7-47aa-b2a2-7bd165250888	guest-2c14ff52-3a94-	guest-2c14ff52-3a94-4976-ae2d-4a13886836a1	\N	main_stage	10	\N	\N	\N	f	2026-10-12 13:13:09.086+00	2026-10-12 13:13:09.086+00
\.


--
-- Data for Name: map_hotspots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.map_hotspots (id, code, title, title_en, category, x, y, short_desc, short_desc_en, booth_id, icon_type, area, dimensions, created_at) FROM stdin;
\.


--
-- Data for Name: news_article_reads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_article_reads (id, content_entry_id, article_id, session_id, day, created_at) FROM stdin;
0740925f-a035-423c-a991-20f9c1706ce0	d4000001-0000-4000-8000-000000000000	tin-1791728018564	136a9f7e-c045-498a-91ed-7b84b60ee492	2026-10-11	2026-10-11 14:14:05.152+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, message, kind, is_read, link, created_at) FROM stdin;
9bd3ece4-9cba-4eba-82ad-300eabc6c3c2	bb9a1b3a-d697-4f19-af16-81075497b198	Quyền tài khoản đã thay đổi	Vai trò mới: admin	role	f	\N	2026-10-11 10:18:59.459+00
dfc47eb0-679a-43be-a564-3dc75e33d466	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "Nhà Xuất Bản Trẻ" vừa gửi đề xuất hoạt động "ádasd".	system	f	/admin	2026-10-11 14:17:21.913+00
6350ce14-a2df-479c-a135-87d2b47fdf7f	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "Nhà Xuất Bản Trẻ" vừa gửi đề xuất hoạt động "ádasd".	system	f	/admin	2026-10-11 14:17:21.913+00
95e73bf7-ed19-4cbe-998d-c2d002b37bb6	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "Nhà Xuất Bản Trẻ" vừa gửi đề xuất hoạt động "ádasd".	system	f	/admin	2026-10-11 14:17:21.913+00
961ee9ac-e893-4a4b-87c2-196ebcd867c3	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "Nhà Xuất Bản Trẻ" vừa gửi đề xuất hoạt động "ádasd".	system	f	/admin	2026-10-11 14:17:21.913+00
b19a8e97-7c67-46be-8f19-2b2cde563b27	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "Nhà Xuất Bản Trẻ" vừa gửi đề xuất hoạt động "ádasd".	system	t	/admin	2026-10-11 14:17:21.913+00
25618579-7756-4977-995f-126af9b165af	33c2a21d-4a71-4820-a171-97df600f78ce	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-e8f59d93-c484-42c0-9809-0888d2c9655f.	system	f	/admin?tab=events	2026-10-12 13:18:48.172+00
14da848c-9e61-44c9-b2d8-48f4dc9c25c5	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động cập nhật	Đối tác "Nhà Xuất Bản Trẻ" vừa cập nhật đề xuất hoạt động "ádasdas".	system	t	/admin?tab=activities	2026-10-12 07:58:06.875+00
2da2216f-d53e-4df7-8efa-4794c617b883	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa gửi yêu cầu đăng ký gian hàng flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85 (1c2f74df-e306-4a72-b).	system	f	/admin?tab=booths	2026-10-12 07:30:31.175+00
d0954d09-2b81-4137-a545-405b98f95aaf	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa gửi yêu cầu đăng ký gian hàng flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85 (1c2f74df-e306-4a72-b).	system	f	/admin?tab=booths	2026-10-12 07:30:31.175+00
e60fbd9b-1288-4e2d-95a4-a257fa6fbc62	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa gửi đề xuất hoạt động "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85".	system	f	/admin?tab=activities	2026-10-12 07:30:31.456+00
772cfe26-3ca2-46aa-9bec-7d4d4b8f1f84	b9d37b50-942d-430a-a45f-0e303739b400	Đăng ký sự kiện mới: Lễ hội Đường Sách Mùa Thu 2026	Khách tham quan Nguyễn Thính Giả Test (thinhgia.test@gmail.com - 0912345678) vừa đăng ký tham gia sự kiện "Lễ hội Đường Sách Mùa Thu 2026" (2 người, Mã vé: EVT-H5QZX5).	system	t	/admin	2026-10-10 05:22:17.863+00
d1000001-0000-4000-8000-000000000001	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	NXB Trẻ vừa nộp đề xuất hoạt động "Workshop: Thưởng thức Cà phê & Đọc sách". Vui lòng kiểm duyệt.	system	t	/admin	2026-10-10 04:10:10.565654+00
d1000001-0000-4000-8000-000000000002	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu phân bổ gian hàng	Nhà Sách Bình Minh đã hoàn tất hồ sơ đăng ký gian hàng cho Lễ hội Mùa Thu 2026.	system	t	/admin	2026-10-10 02:40:10.565654+00
d1000001-0000-4000-8000-000000000004	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	Hồ sơ sự kiện đã được duyệt	Đơn đăng ký tham gia Lễ hội Đường Sách Mùa Thu 2026 của NXB Trẻ đã được Ban Quản Lý phê duyệt chính thức.	system	t	/partner/events	2026-10-09 04:40:10.565654+00
b5dcef37-73cb-4c44-ae34-2a1b43d32ef3	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa gửi đề xuất hoạt động "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85".	system	f	/admin?tab=activities	2026-10-12 07:30:31.456+00
365aa1a1-bc16-4f26-8943-2732edeed191	33c2a21d-4a71-4820-a171-97df600f78ce	Đăng ký sự kiện mới: Lễ hội Đường Sách Mùa Thu 2026	Khách tham quan Nguyễn Thính Giả Test (thinhgia.test@gmail.com - 0912345678) vừa đăng ký tham gia sự kiện "Lễ hội Đường Sách Mùa Thu 2026" (2 người, Mã vé: EVT-H5QZX5).	system	f	/admin	2026-10-10 05:22:17.863+00
292e8436-1138-485b-8673-117616d758d3	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đăng ký sự kiện mới: Lễ hội Đường Sách Mùa Thu 2026	Khách tham quan Nguyễn Thính Giả Test (thinhgia.test@gmail.com - 0912345678) vừa đăng ký tham gia sự kiện "Lễ hội Đường Sách Mùa Thu 2026" (2 người, Mã vé: EVT-H5QZX5).	system	f	/admin	2026-10-10 05:22:17.863+00
338603a7-c149-4dac-bb74-e1b0813256ff	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đăng ký sự kiện mới: Lễ hội Đường Sách Mùa Thu 2026	Khách tham quan Nguyễn Thính Giả Test (thinhgia.test@gmail.com - 0912345678) vừa đăng ký tham gia sự kiện "Lễ hội Đường Sách Mùa Thu 2026" (2 người, Mã vé: EVT-H5QZX5).	system	f	/admin	2026-10-10 05:22:17.863+00
68c23c64-0644-4bd3-9f00-7c243d5f34f3	87427bb9-732b-44b3-aed9-18938ae98fe9	Đăng ký sự kiện mới: Lễ hội Đường Sách Mùa Thu 2026	Khách tham quan Nguyễn Thính Giả Test (thinhgia.test@gmail.com - 0912345678) vừa đăng ký tham gia sự kiện "Lễ hội Đường Sách Mùa Thu 2026" (2 người, Mã vé: EVT-H5QZX5).	system	f	/admin	2026-10-10 05:22:17.863+00
713cd246-bed8-4eaa-b03a-708c18f63ab0	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa gửi đề xuất hoạt động "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85".	system	f	/admin?tab=activities	2026-10-12 07:30:31.456+00
33736de8-c964-4b4a-a9ee-0f091b4ab777	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa gửi đề xuất hoạt động "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85".	system	f	/admin?tab=activities	2026-10-12 07:30:31.456+00
867f4cd2-1af2-4dc1-a167-8cee9accf888	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động cập nhật	Đối tác "Nhà Xuất Bản Trẻ" vừa cập nhật đề xuất hoạt động "ádasdas".	system	f	/admin?tab=activities	2026-10-12 07:58:05.094+00
a90a6ec7-2c52-4523-9344-52ace74157d8	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động cập nhật	Đối tác "Nhà Xuất Bản Trẻ" vừa cập nhật đề xuất hoạt động "ádasdas".	system	f	/admin?tab=activities	2026-10-12 07:58:06.875+00
499202c3-a70c-4bd6-90be-f8aee83c3eea	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động cập nhật	Đối tác "Nhà Xuất Bản Trẻ" vừa cập nhật đề xuất hoạt động "ádasdas".	system	f	/admin?tab=activities	2026-10-12 07:58:06.875+00
28e615ef-1f63-4c15-b09b-942cb9d07d20	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động cập nhật	Đối tác "Nhà Xuất Bản Trẻ" vừa cập nhật đề xuất hoạt động "ádasdas".	system	f	/admin?tab=activities	2026-10-12 07:58:06.875+00
4ba1700b-02d7-4b80-a15b-74f9993343c4	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động cập nhật	Đối tác "Nhà Xuất Bản Trẻ" vừa cập nhật đề xuất hoạt động "ádasdas".	system	f	/admin?tab=activities	2026-10-12 07:58:06.875+00
d1000001-0000-4000-8000-000000000003	b9d37b50-942d-430a-a45f-0e303739b400	Báo cáo vận hành ngày	Đã có 142 lượt check-in tại Sân khấu chính A trong sự kiện hôm nay.	system	t	/admin	2026-10-09 23:40:10.565654+00
d1000001-0000-4000-8000-000000000006	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	Đề xuất tọa đàm đã được duyệt	Hoạt động "Tọa đàm: Ký ức văn học Sài Gòn - Chợ Lớn" đã được duyệt lịch tổ chức tại Sân khấu A.	system	t	/partner/activities	2026-10-08 04:40:10.565654+00
d1000001-0000-4000-8000-000000000007	a1997704-8ccd-4838-ab09-31be558bf632	Phê duyệt tham gia sự kiện	Hồ sơ tham gia Lễ hội Đường Sách Mùa Thu 2026 của Nhà Sách Bình Minh đã được duyệt thành công.	system	f	/partner/events	2026-10-08 04:40:10.565654+00
1217cc7c-9663-4207-8708-bfadff21112a	bb9a1b3a-d697-4f19-af16-81075497b198	Quyền tài khoản đã thay đổi	Vai trò mới: partner	role	f	\N	2026-10-11 10:19:09.8+00
2690250b-d4ee-460f-9311-365b7e3baee6	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "Lâm Minh Khải" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-11 10:22:42.491+00
91c88a17-5668-4069-aabe-27e2326c08dd	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "Lâm Minh Khải" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-11 10:22:42.491+00
2e09195e-4291-4279-aa32-7a685795a833	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 09:28:40.256+00
aeb3e7c6-c873-42a3-99cb-8f715262d602	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 09:28:40.256+00
bf15a8c9-6db5-4640-91ea-3fb93e804446	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 09:28:40.256+00
608408c9-8590-4036-8477-27b54930cbc8	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 09:28:40.256+00
ba2b4bb4-3e68-4b4a-9a28-04a82287f31c	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "Lâm Minh Khải" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-11 10:22:42.491+00
7c00bc13-b799-43ec-8693-03b3656e41ca	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa gửi yêu cầu đăng ký gian hàng flow-be3181ca-967c-4a11-91b4-f94499101675 (889b2939-f050-41e7-a).	system	f	/admin	2026-10-10 09:28:40.331+00
b5e764f2-688a-4e6c-b117-49e91588d7f8	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa gửi yêu cầu đăng ký gian hàng flow-be3181ca-967c-4a11-91b4-f94499101675 (889b2939-f050-41e7-a).	system	f	/admin	2026-10-10 09:28:40.331+00
373f2ff2-0a34-4cac-9836-ec4a4a3f32ea	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "Lâm Minh Khải" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-11 10:22:42.491+00
cdb05e8a-e118-4f1d-bcef-cd6073033d72	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa gửi yêu cầu đăng ký gian hàng flow-be3181ca-967c-4a11-91b4-f94499101675 (889b2939-f050-41e7-a).	system	f	/admin	2026-10-10 09:28:40.331+00
9add4003-5ac7-45fb-a3c6-42337276bc3b	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa gửi yêu cầu đăng ký gian hàng flow-be3181ca-967c-4a11-91b4-f94499101675 (889b2939-f050-41e7-a).	system	f	/admin	2026-10-10 09:28:40.331+00
06dd8365-0854-4283-8202-1342d5d0fc19	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "Lâm Minh Khải" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin	2026-10-11 10:22:42.491+00
41d66cd2-260a-4af6-91a9-d539ad17ffd8	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa gửi đề xuất hoạt động "flow-be3181ca-967c-4a11-91b4-f94499101675".	system	f	/admin	2026-10-10 09:28:40.577+00
2574cb56-38d7-43d1-805f-de7202006601	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa gửi đề xuất hoạt động "flow-be3181ca-967c-4a11-91b4-f94499101675".	system	f	/admin	2026-10-10 09:28:40.577+00
38476674-e184-40a0-a26e-98a6698302d7	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa gửi đề xuất hoạt động "flow-be3181ca-967c-4a11-91b4-f94499101675".	system	f	/admin	2026-10-10 09:28:40.577+00
77a147e4-e668-4023-b83f-28729a84a42c	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa gửi đề xuất hoạt động "flow-be3181ca-967c-4a11-91b4-f94499101675".	system	f	/admin	2026-10-10 09:28:40.577+00
d1000001-0000-4000-8000-000000000005	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	Phân bổ gian hàng thành công	Gian hàng trung tâm C-01 đã được phân bổ cho NXB Trẻ. Quý đơn vị có thể bắt đầu trang trí và nhập danh mục sách.	system	t	/partner/booths	2026-10-09 04:40:10.565654+00
00f2032f-29a2-4667-a8d3-2ab9abe82b43	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 09:38:30.464+00
e2cc6a54-b498-4663-8a12-e1b3b9cef11b	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 09:38:30.464+00
f74432d8-cc17-4f75-87f6-5e93eb9037df	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 09:38:30.464+00
e44bf99c-9a32-40ff-ab2a-51db3a735b26	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 06:54:26.929+00
7ef53e2a-adda-4836-8b4d-735880c0744f	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 09:38:30.464+00
31a356da-52ca-4079-a974-7fafd7a2f04a	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin	2026-10-10 09:28:40.256+00
1c7033b4-5957-4c9f-90a7-250b63cc7f20	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa gửi yêu cầu đăng ký gian hàng flow-be3181ca-967c-4a11-91b4-f94499101675 (889b2939-f050-41e7-a).	system	t	/admin	2026-10-10 09:28:40.331+00
f6313db1-bf9a-4063-9d7e-906858678fbc	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-be3181ca-967c-4a11-91b4-f94499101675" vừa gửi đề xuất hoạt động "flow-be3181ca-967c-4a11-91b4-f94499101675".	system	t	/admin	2026-10-10 09:28:40.577+00
15ec1c84-8ff3-4ffe-ae83-05a03363d19d	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin	2026-10-10 09:38:30.464+00
c95ca6a4-ee15-48c8-b010-a0f654faf2fb	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 06:54:26.929+00
351e2fa2-25eb-4f76-b86d-4ba8ec6060fe	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-e8f59d93-c484-42c0-9809-0888d2c9655f.	system	f	/admin?tab=events	2026-10-12 13:18:48.172+00
cc8be9f7-6ddb-43bc-be2c-78a236e30c45	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "Nhà Xuất Bản Trẻ" vừa gửi đề xuất hoạt động "ádasdas".	system	f	/admin	2026-10-11 14:19:57.247+00
17eb9e33-3c3b-46c2-aa0b-19c56ace5a25	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "Nhà Xuất Bản Trẻ" vừa gửi đề xuất hoạt động "ádasdas".	system	f	/admin	2026-10-11 14:19:57.247+00
def34d91-05d8-4b9c-b101-57a2113a515e	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa gửi yêu cầu đăng ký gian hàng flow-dd8b3e79-b5f7-49fb-8510-d759123e7681 (3d901594-b4c0-4633-9).	system	f	/admin	2026-10-10 09:38:30.557+00
0aefa435-d73a-4c0f-b61c-acb5709f6a6f	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa gửi yêu cầu đăng ký gian hàng flow-dd8b3e79-b5f7-49fb-8510-d759123e7681 (3d901594-b4c0-4633-9).	system	f	/admin	2026-10-10 09:38:30.557+00
6086dc1c-5404-47eb-ba5d-4a2d851557d4	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa gửi yêu cầu đăng ký gian hàng flow-dd8b3e79-b5f7-49fb-8510-d759123e7681 (3d901594-b4c0-4633-9).	system	f	/admin	2026-10-10 09:38:30.557+00
1456451e-edb7-46cd-9b97-ffc6b2244e01	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "Nhà Xuất Bản Trẻ" vừa gửi đề xuất hoạt động "ádasdas".	system	f	/admin	2026-10-11 14:19:57.247+00
9d75b0f5-55d2-4279-92cb-38cb7365943b	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa gửi yêu cầu đăng ký gian hàng flow-dd8b3e79-b5f7-49fb-8510-d759123e7681 (3d901594-b4c0-4633-9).	system	f	/admin	2026-10-10 09:38:30.557+00
d7f22971-cd49-4833-84c5-0682bb5b15a8	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "Nhà Xuất Bản Trẻ" vừa gửi đề xuất hoạt động "ádasdas".	system	f	/admin	2026-10-11 14:19:57.247+00
e8ba9284-e6f8-47d1-92b3-d4a29092cd4c	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "Nhà Xuất Bản Trẻ" vừa gửi đề xuất hoạt động "ádasdas".	system	t	/admin	2026-10-11 14:19:57.247+00
f4ecad04-485f-46e4-9dca-1c0586a42939	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa gửi đề xuất hoạt động "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681".	system	f	/admin	2026-10-10 09:38:30.791+00
f13b0cb9-b363-48ea-9781-5fe8172d8a87	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa gửi đề xuất hoạt động "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681".	system	f	/admin	2026-10-10 09:38:30.791+00
386b8abb-8892-47b9-9b88-b09e967c1e3c	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa gửi đề xuất hoạt động "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681".	system	f	/admin	2026-10-10 09:38:30.791+00
1a5ed3f5-e264-44a1-910e-15ad394c9d38	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 06:54:26.929+00
47e8a2a7-d441-4ac7-89a8-ef92932c38db	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa gửi đề xuất hoạt động "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681".	system	f	/admin	2026-10-10 09:38:30.791+00
dece435b-d61d-4d56-8f82-faa2a79fd559	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 06:54:26.929+00
57add59c-a42c-40b3-bb1d-f6b8610ead09	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-e8f59d93-c484-42c0-9809-0888d2c9655f.	system	f	/admin?tab=events	2026-10-12 13:18:48.172+00
d86eb2e0-10a1-492c-ae9f-55bd388234d8	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 09:39:13.373+00
dc5fa4e0-f47a-431b-b056-d0ae144e6cf1	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 09:39:13.373+00
9096123d-c04e-43ba-b50e-ac7b4200ac40	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 09:39:13.373+00
dbd5107a-7450-460d-8cf5-ff9f22a4524c	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 09:39:13.373+00
be69ade1-0eda-406c-93f2-a4c85a49902a	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa gửi yêu cầu đăng ký gian hàng flow-1443c2ed-b84b-4392-9961-9c18fd011302 (a30d5e19-95db-4961-a).	system	f	/admin?tab=booths	2026-10-12 06:54:27.048+00
390bd3f4-37af-4a18-a616-e309623a1b0b	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa gửi yêu cầu đăng ký gian hàng flow-cb9d6804-197c-4110-8752-b6436b0d7beb (6e79bd39-be6b-486f-9).	system	f	/admin	2026-10-10 09:39:13.477+00
c318398c-9d1b-40ae-8a18-3491823b5a67	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa gửi yêu cầu đăng ký gian hàng flow-cb9d6804-197c-4110-8752-b6436b0d7beb (6e79bd39-be6b-486f-9).	system	f	/admin	2026-10-10 09:39:13.477+00
655c2dae-5629-4623-a8f3-4b0963e6f5da	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa gửi yêu cầu đăng ký gian hàng flow-cb9d6804-197c-4110-8752-b6436b0d7beb (6e79bd39-be6b-486f-9).	system	f	/admin	2026-10-10 09:39:13.477+00
d11fcc99-2658-454e-8661-cc744a3457b8	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa gửi yêu cầu đăng ký gian hàng flow-cb9d6804-197c-4110-8752-b6436b0d7beb (6e79bd39-be6b-486f-9).	system	f	/admin	2026-10-10 09:39:13.477+00
96080b54-270d-481c-9acd-4f6a7cf42e8b	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin?tab=event-applications	2026-10-12 06:54:26.929+00
435c999f-4c0d-40ba-b7dd-983b6166ee24	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa gửi yêu cầu đăng ký gian hàng flow-dd8b3e79-b5f7-49fb-8510-d759123e7681 (3d901594-b4c0-4633-9).	system	t	/admin	2026-10-10 09:38:30.557+00
29c80b38-de04-49f2-a001-866c4d206e2a	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681" vừa gửi đề xuất hoạt động "flow-dd8b3e79-b5f7-49fb-8510-d759123e7681".	system	t	/admin	2026-10-10 09:38:30.791+00
355c3983-e393-479f-aa84-b4f113bd682f	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin	2026-10-10 09:39:13.373+00
3c40f7cb-d3ab-48d7-9451-284b37416290	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa gửi yêu cầu đăng ký gian hàng flow-cb9d6804-197c-4110-8752-b6436b0d7beb (6e79bd39-be6b-486f-9).	system	t	/admin	2026-10-10 09:39:13.477+00
61d26a38-49c0-4e52-b39d-904c1709d0ef	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-e8f59d93-c484-42c0-9809-0888d2c9655f.	system	f	/admin?tab=events	2026-10-12 13:18:48.172+00
480c1546-a456-4293-92f1-e7bb3d709fc2	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa gửi yêu cầu đăng ký gian hàng flow-1443c2ed-b84b-4392-9961-9c18fd011302 (a30d5e19-95db-4961-a).	system	f	/admin?tab=booths	2026-10-12 06:54:27.048+00
610e235d-04db-4260-85eb-3ed7fb109c33	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa gửi đề xuất hoạt động "flow-cb9d6804-197c-4110-8752-b6436b0d7beb".	system	f	/admin	2026-10-10 09:39:13.744+00
3aa5ea51-6e8d-45b1-baa8-b712c2be8b1e	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa gửi đề xuất hoạt động "flow-cb9d6804-197c-4110-8752-b6436b0d7beb".	system	f	/admin	2026-10-10 09:39:13.744+00
0604fe25-a004-4a61-a998-bd0da23a84ff	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa gửi đề xuất hoạt động "flow-cb9d6804-197c-4110-8752-b6436b0d7beb".	system	f	/admin	2026-10-10 09:39:13.744+00
8c9aaffa-7201-4b61-993d-18619699e330	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa gửi đề xuất hoạt động "flow-cb9d6804-197c-4110-8752-b6436b0d7beb".	system	f	/admin	2026-10-10 09:39:13.744+00
1e654fae-d9a1-4ec9-a699-b62028603727	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-cb9d6804-197c-4110-8752-b6436b0d7beb" vừa gửi đề xuất hoạt động "flow-cb9d6804-197c-4110-8752-b6436b0d7beb".	system	t	/admin	2026-10-10 09:39:13.744+00
f4a1ae8f-2ab7-46a6-9f88-e1ba8dba5a6a	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Giao lưu ký tặng: "Hồi ức Sài Gòn & Hương vị Cà phê xưa"" không được duyệt.	activity	f	/partner/activities	2026-10-10 10:16:35.995+00
7e357a57-8280-4710-bfe5-6d860ea9f48f	87427bb9-732b-44b3-aed9-18938ae98fe9	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-e8f59d93-c484-42c0-9809-0888d2c9655f.	system	f	/admin?tab=events	2026-10-12 13:18:48.172+00
16346d85-f544-4e42-a293-5be8672f525a	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 15:16:08.679+00
68d52459-85d4-4ae6-ae53-131144a460dc	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 15:16:08.679+00
54c52bc8-6a17-4171-9dad-51486b05171f	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 15:16:08.679+00
a751ab13-bb58-4c8a-b3f7-41a1fb9838e0	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 15:16:08.679+00
9ea41348-fc08-43a7-89c7-997983cbddcf	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa gửi yêu cầu đăng ký gian hàng flow-1443c2ed-b84b-4392-9961-9c18fd011302 (a30d5e19-95db-4961-a).	system	f	/admin?tab=booths	2026-10-12 06:54:27.048+00
acb4d84c-2f89-410c-80a8-b39e27b0a5cc	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa gửi yêu cầu đăng ký gian hàng flow-db61ca88-0f96-467e-b117-e485390e224e (3a5a3a97-f5d3-47db-b).	system	f	/admin	2026-10-10 15:16:08.803+00
e0fdbba8-9f0c-489c-aff0-aaaa88bbfc00	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa gửi yêu cầu đăng ký gian hàng flow-db61ca88-0f96-467e-b117-e485390e224e (3a5a3a97-f5d3-47db-b).	system	f	/admin	2026-10-10 15:16:08.803+00
d7c7f9ef-9124-49a4-8790-e3fd1a40e476	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa gửi yêu cầu đăng ký gian hàng flow-db61ca88-0f96-467e-b117-e485390e224e (3a5a3a97-f5d3-47db-b).	system	f	/admin	2026-10-10 15:16:08.803+00
c5b9e91c-f471-4d77-96be-6258e920aa38	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa gửi yêu cầu đăng ký gian hàng flow-db61ca88-0f96-467e-b117-e485390e224e (3a5a3a97-f5d3-47db-b).	system	f	/admin	2026-10-10 15:16:08.803+00
23715e5c-04b4-4f72-bd23-7c7d8442a52c	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa gửi yêu cầu đăng ký gian hàng flow-1443c2ed-b84b-4392-9961-9c18fd011302 (a30d5e19-95db-4961-a).	system	f	/admin?tab=booths	2026-10-12 06:54:27.048+00
15ae66c3-fbb6-4f98-8663-ad6e534ec8e2	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa gửi đề xuất hoạt động "flow-db61ca88-0f96-467e-b117-e485390e224e".	system	f	/admin	2026-10-10 15:16:09.022+00
f9d2bc3b-2773-498a-9b09-eea846b2f271	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa gửi đề xuất hoạt động "flow-db61ca88-0f96-467e-b117-e485390e224e".	system	f	/admin	2026-10-10 15:16:09.022+00
74242402-e16f-44f9-950a-1c6229c4144c	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa gửi đề xuất hoạt động "flow-db61ca88-0f96-467e-b117-e485390e224e".	system	f	/admin	2026-10-10 15:16:09.022+00
aa303552-b665-47eb-bfc4-297211f8a41b	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa gửi đề xuất hoạt động "flow-db61ca88-0f96-467e-b117-e485390e224e".	system	f	/admin	2026-10-10 15:16:09.022+00
6196c75d-fa3b-424e-8392-b1753df0add3	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 15:22:15.149+00
d2912c8e-1d48-4fb6-9ac6-82420c131468	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 15:22:15.149+00
23327bb2-53e0-46c1-86aa-4e81e892616b	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa gửi đề xuất hoạt động "flow-1443c2ed-b84b-4392-9961-9c18fd011302".	system	f	/admin?tab=activities	2026-10-12 06:54:27.356+00
07f0f4a4-a92c-4e14-a285-0adb7280c4c0	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 15:22:15.149+00
977f37c4-aa3d-4811-b519-782f1bc4ee27	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin	2026-10-10 15:16:08.679+00
d911deea-fd25-4f17-8151-f49300931b5b	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa gửi yêu cầu đăng ký gian hàng flow-db61ca88-0f96-467e-b117-e485390e224e (3a5a3a97-f5d3-47db-b).	system	t	/admin	2026-10-10 15:16:08.803+00
3bc0228e-ac99-47cd-912b-356c5370d0be	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-db61ca88-0f96-467e-b117-e485390e224e" vừa gửi đề xuất hoạt động "flow-db61ca88-0f96-467e-b117-e485390e224e".	system	t	/admin	2026-10-10 15:16:09.022+00
7441c5d0-942d-40f2-bfbc-af3734f7a4d9	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa gửi yêu cầu đăng ký gian hàng flow-1443c2ed-b84b-4392-9961-9c18fd011302 (a30d5e19-95db-4961-a).	system	t	/admin?tab=booths	2026-10-12 06:54:27.048+00
2488b03c-6944-438d-ade8-09fc7ea32635	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:28:14.831+00
b8d3faea-ad90-4f53-a2c2-9880204c34b1	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin	2026-10-10 15:22:15.149+00
acacb1c5-9f66-422a-8c32-9d55ac375673	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa gửi đề xuất hoạt động "flow-1443c2ed-b84b-4392-9961-9c18fd011302".	system	f	/admin?tab=activities	2026-10-12 06:54:27.356+00
899f0492-0db6-41e1-adec-43ffd10a96be	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa gửi yêu cầu đăng ký gian hàng flow-ab2468b8-63d8-42ba-ac67-909e8b31b017 (3a3b3f19-d388-42ee-9).	system	f	/admin	2026-10-10 15:22:15.222+00
f63561b9-cf3f-4510-8c6b-ff1e04ef5b3f	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa gửi yêu cầu đăng ký gian hàng flow-ab2468b8-63d8-42ba-ac67-909e8b31b017 (3a3b3f19-d388-42ee-9).	system	f	/admin	2026-10-10 15:22:15.222+00
163aeeb2-7a57-40a8-86fb-e7f574c6ba18	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa gửi yêu cầu đăng ký gian hàng flow-ab2468b8-63d8-42ba-ac67-909e8b31b017 (3a3b3f19-d388-42ee-9).	system	f	/admin	2026-10-10 15:22:15.222+00
07deaf04-00d5-4281-9b42-849f54530675	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa gửi đề xuất hoạt động "flow-1443c2ed-b84b-4392-9961-9c18fd011302".	system	f	/admin?tab=activities	2026-10-12 06:54:27.356+00
ee25d3e6-762e-4e85-a259-b91ce9ba7b6a	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa gửi yêu cầu đăng ký gian hàng flow-ab2468b8-63d8-42ba-ac67-909e8b31b017 (3a3b3f19-d388-42ee-9).	system	f	/admin	2026-10-10 15:22:15.222+00
4f141b16-4201-40c5-ad03-1d83ac3f1559	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa gửi đề xuất hoạt động "flow-1443c2ed-b84b-4392-9961-9c18fd011302".	system	f	/admin?tab=activities	2026-10-12 06:54:27.356+00
7387b695-a49b-45cd-9d44-88e402d152e8	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:18:50.498+00
2e4b6507-249c-42c3-b7cf-6676b48dafe5	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-1443c2ed-b84b-4392-9961-9c18fd011302" vừa gửi đề xuất hoạt động "flow-1443c2ed-b84b-4392-9961-9c18fd011302".	system	t	/admin?tab=activities	2026-10-12 06:54:27.356+00
e6b3d20f-9a45-4bf6-a4db-384b59ac4f54	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa gửi đề xuất hoạt động "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017".	system	f	/admin	2026-10-10 15:22:15.47+00
f6694224-c67c-413e-a8a5-e8b53ef30303	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa gửi đề xuất hoạt động "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017".	system	f	/admin	2026-10-10 15:22:15.47+00
2d6da8f1-b512-42f2-b371-6bc0424b391d	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 07:30:31.083+00
278f77a4-e6f9-40a0-a67a-412eb21405ef	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa gửi đề xuất hoạt động "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017".	system	f	/admin	2026-10-10 15:22:15.47+00
df8ecc5c-9293-4ddc-9b8d-ea9f0d3be75a	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 07:30:31.083+00
d67bf020-7e15-42a5-b359-0064f3c0293e	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa gửi đề xuất hoạt động "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017".	system	f	/admin	2026-10-10 15:22:15.47+00
929c6ecc-af36-4ec4-bf19-8133cb5eb26d	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:18:50.498+00
b28b5d63-9516-496e-853f-f37ed1a4150a	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin	2026-10-10 15:22:15.149+00
1adce137-8dc8-4c31-9a9d-47357acc693b	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa gửi yêu cầu đăng ký gian hàng flow-ab2468b8-63d8-42ba-ac67-909e8b31b017 (3a3b3f19-d388-42ee-9).	system	t	/admin	2026-10-10 15:22:15.222+00
9205b06a-2777-43d5-b680-09e5efcc8b53	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017" vừa gửi đề xuất hoạt động "flow-ab2468b8-63d8-42ba-ac67-909e8b31b017".	system	t	/admin	2026-10-10 15:22:15.47+00
c4aeaf1b-6646-4ec8-8fc2-9ae68b925d4f	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 07:30:31.083+00
63cce402-9d0e-46ca-a067-5f06b4df6b8a	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 07:30:31.083+00
258e8a22-1538-455a-8911-1abcaf0b3c28	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa gửi yêu cầu đăng ký gian hàng flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f (1655a445-ae61-41cc-a).	system	f	/admin?tab=booths	2026-10-12 13:28:14.911+00
0c8a3bec-8701-48c9-88a6-1fcb6aa81be8	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa gửi yêu cầu đăng ký gian hàng flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85 (1c2f74df-e306-4a72-b).	system	f	/admin?tab=booths	2026-10-12 07:30:31.175+00
1bec3c82-0ad8-4fc8-90b4-fa16e33bcd3b	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa gửi yêu cầu đăng ký gian hàng flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85 (1c2f74df-e306-4a72-b).	system	f	/admin?tab=booths	2026-10-12 07:30:31.175+00
de269faa-0386-4214-a4fd-233b93f79bed	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động cập nhật	Đối tác "Nhà Xuất Bản Trẻ" vừa cập nhật đề xuất hoạt động "ádasdas".	system	f	/admin?tab=activities	2026-10-12 07:58:05.094+00
f2584607-f2a9-487b-aba9-7851bf60d44c	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động cập nhật	Đối tác "Nhà Xuất Bản Trẻ" vừa cập nhật đề xuất hoạt động "ádasdas".	system	f	/admin?tab=activities	2026-10-12 07:58:05.094+00
a66e039d-6564-4e19-9db3-d9883d22e394	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động cập nhật	Đối tác "Nhà Xuất Bản Trẻ" vừa cập nhật đề xuất hoạt động "ádasdas".	system	f	/admin?tab=activities	2026-10-12 07:58:05.094+00
3baafb49-25cf-4005-ade4-c44b519b596d	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 08:13:00.077+00
18fb9643-0d2e-4a98-8b3f-87939df76dd1	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 08:13:00.077+00
a248dcc1-d462-45e0-a53a-d93914e4ebea	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 08:13:00.077+00
09f49652-8ef3-4665-b88f-0fa5c011008e	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đơn đăng ký sự kiện mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:18:50.498+00
aee22885-9105-4404-adc0-10e5a390548a	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 08:13:00.077+00
e4db3476-747c-4ab8-9087-4796d5d46689	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:18:50.498+00
69781ad7-bdca-4896-8c63-fc00dd75eb9e	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa gửi yêu cầu đăng ký gian hàng flow-c5090f99-5f0d-4e61-8203-18fb40d9f808 (7617643e-71c9-480a-a).	system	f	/admin?tab=booths	2026-10-12 08:13:00.175+00
0657a535-f541-484a-a79b-12e8c935f2e1	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa gửi yêu cầu đăng ký gian hàng flow-c5090f99-5f0d-4e61-8203-18fb40d9f808 (7617643e-71c9-480a-a).	system	f	/admin?tab=booths	2026-10-12 08:13:00.175+00
8398af73-efe1-4d63-9c0b-bca99f07e729	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa gửi yêu cầu đăng ký gian hàng flow-c5090f99-5f0d-4e61-8203-18fb40d9f808 (7617643e-71c9-480a-a).	system	f	/admin?tab=booths	2026-10-12 08:13:00.175+00
bf248993-c96c-49f0-8465-80d6d94505fe	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:18:50.498+00
7210e040-6e00-4194-bd00-8010ab5a1e70	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa gửi yêu cầu đăng ký gian hàng flow-c5090f99-5f0d-4e61-8203-18fb40d9f808 (7617643e-71c9-480a-a).	system	f	/admin?tab=booths	2026-10-12 08:13:00.175+00
85cbb2a4-21d9-4d63-a06a-40de4a4c8fca	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa gửi đề xuất hoạt động "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808".	system	f	/admin?tab=activities	2026-10-12 08:13:00.437+00
b950ec1a-23b4-4d82-8505-371f5ce8f174	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa gửi đề xuất hoạt động "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808".	system	f	/admin?tab=activities	2026-10-12 08:13:00.437+00
1f345de1-a2a3-419a-90fa-9e49dec72300	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa gửi đề xuất hoạt động "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808".	system	f	/admin?tab=activities	2026-10-12 08:13:00.437+00
8238cfcb-17cf-4f39-9c6a-82db5e8dbbae	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa gửi đề xuất hoạt động "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808".	system	f	/admin?tab=activities	2026-10-12 08:13:00.437+00
6b3ab1e5-f9e1-4ec2-9db7-318c60dd23a8	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 12:42:17.855+00
26a16d5f-b9d7-4913-9ba5-54a69d5fe7f4	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 12:42:17.855+00
ae5ae7fa-bb9f-4251-a73a-83c13a268349	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 12:42:17.855+00
da57cb3b-50ea-402c-91a6-be174597eb2e	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 12:42:17.855+00
4cf34027-d0d8-470e-ac63-32fff2cccdc4	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa gửi yêu cầu đăng ký gian hàng flow-7cfb3efd-740d-45e0-8d25-37908df40514 (de921b1e-c77f-4844-a).	system	f	/admin?tab=booths	2026-10-12 13:18:50.602+00
11dc78d2-a146-4684-90e9-b8d0641f13f1	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa gửi yêu cầu đăng ký gian hàng flow-7cfb3efd-740d-45e0-8d25-37908df40514 (de921b1e-c77f-4844-a).	system	f	/admin?tab=booths	2026-10-12 13:18:50.602+00
eb6be775-5df5-4f2e-a3ff-eefa795762c3	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa gửi yêu cầu đăng ký gian hàng flow-d6c304ab-c371-433d-a97b-b65ec4e54059 (4b0054d9-2719-4751-8).	system	f	/admin?tab=booths	2026-10-12 12:42:17.939+00
f78d20aa-0d6f-48b3-953c-5a0a96db917c	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin?tab=event-applications	2026-10-12 08:13:00.077+00
a8be6e93-6352-4d1e-81e4-349068d51a1a	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin?tab=event-applications	2026-10-12 13:18:50.498+00
905bb679-ae82-4867-8ecd-e6b9ae3f0a64	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa gửi đề xuất hoạt động "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808".	system	t	/admin?tab=activities	2026-10-12 08:13:00.437+00
8591b58e-9a4d-44d1-9c4f-869d3ca2eb6a	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa gửi yêu cầu đăng ký gian hàng flow-d6c304ab-c371-433d-a97b-b65ec4e54059 (4b0054d9-2719-4751-8).	system	f	/admin?tab=booths	2026-10-12 12:42:17.939+00
283b491f-55c0-4d80-96b4-2b07be590c25	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa gửi yêu cầu đăng ký gian hàng flow-d6c304ab-c371-433d-a97b-b65ec4e54059 (4b0054d9-2719-4751-8).	system	f	/admin?tab=booths	2026-10-12 12:42:17.939+00
c1da0a6b-4475-449f-9788-bc99c6f2b7bf	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa gửi yêu cầu đăng ký gian hàng flow-d6c304ab-c371-433d-a97b-b65ec4e54059 (4b0054d9-2719-4751-8).	system	f	/admin?tab=booths	2026-10-12 12:42:17.939+00
8bf287b2-96a2-41f5-a9aa-d5dbb228160f	a7b263a9-8578-447a-857b-ef4f1a885cbf	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa gửi yêu cầu đăng ký gian hàng flow-7cfb3efd-740d-45e0-8d25-37908df40514 (de921b1e-c77f-4844-a).	system	f	/admin?tab=booths	2026-10-12 13:18:50.602+00
4d27daf7-1bfd-41d4-8423-c741d77158ef	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa gửi đề xuất hoạt động "flow-d6c304ab-c371-433d-a97b-b65ec4e54059".	system	f	/admin?tab=activities	2026-10-12 12:42:18.195+00
d873c123-aed8-4273-9be0-e0d7e839f604	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa gửi đề xuất hoạt động "flow-d6c304ab-c371-433d-a97b-b65ec4e54059".	system	f	/admin?tab=activities	2026-10-12 12:42:18.195+00
7ac7b6b4-2f84-4d90-9f07-68f49892ef00	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa gửi đề xuất hoạt động "flow-d6c304ab-c371-433d-a97b-b65ec4e54059".	system	f	/admin?tab=activities	2026-10-12 12:42:18.195+00
8a4c46cf-2f8c-4158-b505-444500aa0d8b	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa gửi đề xuất hoạt động "flow-d6c304ab-c371-433d-a97b-b65ec4e54059".	system	f	/admin?tab=activities	2026-10-12 12:42:18.195+00
131ab999-7523-49dd-bf7b-525244d65da9	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 12:43:26.443+00
ca5975a7-fc33-4bb4-a704-c8ea2d5c564a	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 12:43:26.443+00
5065ffde-0b03-4234-ae1c-4d7199022916	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 12:43:26.443+00
aa8258fe-8f2a-4c0d-9425-04a9e5e2f6ec	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa gửi yêu cầu đăng ký gian hàng flow-7cfb3efd-740d-45e0-8d25-37908df40514 (de921b1e-c77f-4844-a).	system	f	/admin?tab=booths	2026-10-12 13:18:50.602+00
a6a6645b-a8ac-4464-a20f-7d18e311add5	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 12:43:26.443+00
6855956b-84a5-4e1c-a8ea-ace0806c21ad	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa gửi yêu cầu đăng ký gian hàng flow-7cfb3efd-740d-45e0-8d25-37908df40514 (de921b1e-c77f-4844-a).	system	f	/admin?tab=booths	2026-10-12 13:18:50.602+00
c66b9068-3612-45e6-a25e-ae0bb2b72074	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa gửi yêu cầu đăng ký gian hàng flow-47588180-2a77-4e39-b335-3d7305c2a7d8 (7d693e8f-a185-4522-8).	system	f	/admin?tab=booths	2026-10-12 12:43:26.5+00
e2436ec5-d507-4c52-8d20-6cb7db2a7d3d	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa gửi yêu cầu đăng ký gian hàng flow-47588180-2a77-4e39-b335-3d7305c2a7d8 (7d693e8f-a185-4522-8).	system	f	/admin?tab=booths	2026-10-12 12:43:26.5+00
4872c146-a6fb-4aa9-be92-57b62b853509	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa gửi yêu cầu đăng ký gian hàng flow-47588180-2a77-4e39-b335-3d7305c2a7d8 (7d693e8f-a185-4522-8).	system	f	/admin?tab=booths	2026-10-12 12:43:26.5+00
037c631d-df04-404c-a54e-a291c4ca3542	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa gửi yêu cầu đăng ký gian hàng flow-47588180-2a77-4e39-b335-3d7305c2a7d8 (7d693e8f-a185-4522-8).	system	f	/admin?tab=booths	2026-10-12 12:43:26.5+00
1e5680dd-7153-4f19-a920-81fa83b2aee5	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa gửi yêu cầu đăng ký gian hàng flow-d6c304ab-c371-433d-a97b-b65ec4e54059 (4b0054d9-2719-4751-8).	system	t	/admin?tab=booths	2026-10-12 12:42:17.939+00
a924c70a-4c2b-4b05-a2bc-0f0ab699c610	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa gửi đề xuất hoạt động "flow-47588180-2a77-4e39-b335-3d7305c2a7d8".	system	f	/admin?tab=activities	2026-10-12 12:43:26.648+00
7b0f7e40-0cf6-4998-81ad-7be3c149a1f7	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa gửi đề xuất hoạt động "flow-47588180-2a77-4e39-b335-3d7305c2a7d8".	system	f	/admin?tab=activities	2026-10-12 12:43:26.648+00
9ec05477-808f-4f73-ac8a-ad0fc336f354	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa gửi đề xuất hoạt động "flow-47588180-2a77-4e39-b335-3d7305c2a7d8".	system	f	/admin?tab=activities	2026-10-12 12:43:26.648+00
63a93733-9821-40cf-ac05-c04609ffb2b7	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa gửi đề xuất hoạt động "flow-47588180-2a77-4e39-b335-3d7305c2a7d8".	system	f	/admin?tab=activities	2026-10-12 12:43:26.648+00
241cd09a-08af-4c7c-b4d8-35c7809e8d97	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 12:59:09.863+00
b4d87dfe-5111-4f5f-8551-84e3af84a33a	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 12:59:09.863+00
2eaa10bb-66dc-42d7-bd00-c2babd11df3e	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 12:59:09.863+00
ea003677-ae89-4a9a-a5c6-b212b698c052	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 12:59:09.863+00
9843a6c5-ef9b-44d8-95d0-af2c1ec01f2e	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm reject-pending 1791811146072" không được duyệt. Ghi chú của Ban Quản Lý: Chủ đề không phù hợp với định hướng tuần lễ sách	activity	f	/partner/activities	2026-10-12 13:19:06.099+00
62fb473f-4957-46a7-bcb1-76c5311f78f9	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm reject-need-rev 1791811146109" không được duyệt. Ghi chú của Ban Quản Lý: Hết hạn nộp bổ sung nhưng đối tác không phản hồi	activity	f	/partner/activities	2026-10-12 13:19:06.137+00
23bf44d7-0deb-466f-aa56-f7687f230b4d	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa gửi yêu cầu đăng ký gian hàng flow-65d23335-ee24-4e01-b518-c06473069a93 (ed4fb308-00b8-4b37-a).	system	f	/admin?tab=booths	2026-10-12 12:59:09.957+00
9efea09a-e1f0-4840-8a76-cf2c8d2b92aa	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa gửi yêu cầu đăng ký gian hàng flow-65d23335-ee24-4e01-b518-c06473069a93 (ed4fb308-00b8-4b37-a).	system	f	/admin?tab=booths	2026-10-12 12:59:09.957+00
3a4236ee-61e6-4584-9116-36da08d33faa	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa gửi yêu cầu đăng ký gian hàng flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f (1655a445-ae61-41cc-a).	system	f	/admin?tab=booths	2026-10-12 13:28:14.911+00
8e0ba8a9-2271-468b-9280-f06d35f40799	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa gửi yêu cầu đăng ký gian hàng flow-65d23335-ee24-4e01-b518-c06473069a93 (ed4fb308-00b8-4b37-a).	system	f	/admin?tab=booths	2026-10-12 12:59:09.957+00
79c8ddb8-bd32-4664-ae11-919a2b1a5477	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa gửi yêu cầu đăng ký gian hàng flow-65d23335-ee24-4e01-b518-c06473069a93 (ed4fb308-00b8-4b37-a).	system	f	/admin?tab=booths	2026-10-12 12:59:09.957+00
0f8b07a1-bd46-43ef-96de-d38faf670fb5	a7b263a9-8578-447a-857b-ef4f1a885cbf	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa gửi yêu cầu đăng ký gian hàng flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f (1655a445-ae61-41cc-a).	system	f	/admin?tab=booths	2026-10-12 13:28:14.911+00
66df719d-3f74-41ea-a219-7f09c3adda8b	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa gửi yêu cầu đăng ký gian hàng flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f (1655a445-ae61-41cc-a).	system	f	/admin?tab=booths	2026-10-12 13:28:14.911+00
eb36fd4c-56c6-4fc5-896b-ed0bd5b96648	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin?tab=event-applications	2026-10-12 12:59:09.863+00
bfab3047-7c3e-4e4f-864a-b3300d57e495	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa gửi đề xuất hoạt động "flow-65d23335-ee24-4e01-b518-c06473069a93".	system	f	/admin?tab=activities	2026-10-12 12:59:10.277+00
c926a5c8-c0f5-4637-8324-ad6ae8525789	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa gửi đề xuất hoạt động "flow-65d23335-ee24-4e01-b518-c06473069a93".	system	f	/admin?tab=activities	2026-10-12 12:59:10.277+00
c969b231-51a5-4b30-83eb-fb21336d7677	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa gửi đề xuất hoạt động "flow-65d23335-ee24-4e01-b518-c06473069a93".	system	f	/admin?tab=activities	2026-10-12 12:59:10.277+00
d9f83343-cc11-4759-b3b2-c310e70151b1	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa gửi đề xuất hoạt động "flow-65d23335-ee24-4e01-b518-c06473069a93".	system	f	/admin?tab=activities	2026-10-12 12:59:10.277+00
53256eac-d044-43c2-b81b-9d35418a61de	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:06:00.508+00
d90be9bb-b14e-4ac8-8f5e-2472c85d036b	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:06:00.508+00
a264d86c-9519-4d8d-9e4e-c45936776057	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:06:00.508+00
74afa786-a7cf-4285-9806-cce51a453eb9	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:06:00.508+00
91190179-7524-4785-b452-99a0f7db8dad	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11" vừa gửi yêu cầu đăng ký gian hàng flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11 (e12caa56-3a5b-4d68-b).	system	f	/admin?tab=booths	2026-10-12 13:06:00.611+00
18d041c5-2d78-4090-b0f3-d3ec8bc94d25	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11" vừa gửi yêu cầu đăng ký gian hàng flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11 (e12caa56-3a5b-4d68-b).	system	f	/admin?tab=booths	2026-10-12 13:06:00.611+00
eac321c2-2177-4715-9649-11a1ca0d65cf	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa gửi đề xuất hoạt động "flow-7cfb3efd-740d-45e0-8d25-37908df40514".	system	f	/admin?tab=activities	2026-10-12 13:18:50.898+00
b751ebe4-66dd-4d1c-9b5f-e6950c8bd912	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11" vừa gửi yêu cầu đăng ký gian hàng flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11 (e12caa56-3a5b-4d68-b).	system	f	/admin?tab=booths	2026-10-12 13:06:00.611+00
bc588261-8865-4781-a3a9-85003d7c7457	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11" vừa gửi yêu cầu đăng ký gian hàng flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11 (e12caa56-3a5b-4d68-b).	system	f	/admin?tab=booths	2026-10-12 13:06:00.611+00
18376e47-021f-4b56-a849-0b3b3dea9647	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa gửi đề xuất hoạt động "flow-7cfb3efd-740d-45e0-8d25-37908df40514".	system	f	/admin?tab=activities	2026-10-12 13:18:50.898+00
216e9862-6e16-43d6-94c9-f2c5555b6ede	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm req-supp-valid 1791810360823" không được duyệt. Ghi chú của Ban Quản Lý: Vui lòng bổ sung danh sách diễn giả và kịch bản chi tiết	activity	f	/partner/activities	2026-10-12 13:06:00.851+00
2f98d203-1ff6-413d-824e-2706a4080ce4	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm supp-not-pending 1791810360860" không được duyệt. Ghi chú của Ban Quản Lý: Yêu cầu tiếp	activity	f	/partner/activities	2026-10-12 13:06:00.884+00
6e9e2032-cf11-4442-b7be-680eea44f002	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm reject-pending 1791810360899" không được duyệt. Ghi chú của Ban Quản Lý: Chủ đề không phù hợp với định hướng tuần lễ sách	activity	f	/partner/activities	2026-10-12 13:06:00.923+00
63b32b6d-1b29-4f8d-aba3-7c6b3a1e73ad	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm reject-need-rev 1791810360930" không được duyệt. Ghi chú của Ban Quản Lý: Hết hạn nộp bổ sung nhưng đối tác không phản hồi	activity	f	/partner/activities	2026-10-12 13:06:00.953+00
8c456eef-79bc-4420-b077-9f552085bb46	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:07:59.552+00
e4a414a3-9931-4f29-b562-313dbea362dd	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:07:59.552+00
22f327ed-6d17-448c-beb7-2978fc8ac9d0	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đề xuất hoạt động mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa gửi đề xuất hoạt động "flow-7cfb3efd-740d-45e0-8d25-37908df40514".	system	f	/admin?tab=activities	2026-10-12 13:18:50.898+00
14714406-9579-414e-bbfc-1b96f70740e1	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:07:59.552+00
2fdea24d-b70e-4c18-98df-fce8bd76eda4	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa gửi đề xuất hoạt động "flow-7cfb3efd-740d-45e0-8d25-37908df40514".	system	f	/admin?tab=activities	2026-10-12 13:18:50.898+00
6f47c02d-8bd9-4543-9718-b6b6169a55e0	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:07:59.552+00
b4847300-bad6-4905-ba6c-73a265270735	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa gửi đề xuất hoạt động "flow-7cfb3efd-740d-45e0-8d25-37908df40514".	system	f	/admin?tab=activities	2026-10-12 13:18:50.898+00
131ef9af-a653-49fb-af21-e779d201c886	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa gửi yêu cầu đăng ký gian hàng flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf (4b9e604e-afdb-42df-b).	system	f	/admin?tab=booths	2026-10-12 13:07:59.65+00
bfb8b3c0-af02-4ad8-9c6b-6e12b7c3526a	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa gửi yêu cầu đăng ký gian hàng flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf (4b9e604e-afdb-42df-b).	system	f	/admin?tab=booths	2026-10-12 13:07:59.65+00
d3188624-adec-42b0-a216-bfc7c1fedd3c	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa gửi yêu cầu đăng ký gian hàng flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf (4b9e604e-afdb-42df-b).	system	f	/admin?tab=booths	2026-10-12 13:07:59.65+00
2729f0fe-8cc8-49e2-aeff-91fc539c65c1	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11" vừa gửi yêu cầu đăng ký gian hàng flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11 (e12caa56-3a5b-4d68-b).	system	t	/admin?tab=booths	2026-10-12 13:06:00.611+00
403ac009-b34f-4ab1-8812-0d838be231f9	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa gửi đề xuất hoạt động "flow-7cfb3efd-740d-45e0-8d25-37908df40514".	system	t	/admin?tab=activities	2026-10-12 13:18:50.898+00
cf509c5e-309a-4d83-a87a-c8ba16032258	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin?tab=event-applications	2026-10-12 13:07:59.552+00
a3b60e3f-58f4-4b9c-b019-c97a6180ca73	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa gửi yêu cầu đăng ký gian hàng flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf (4b9e604e-afdb-42df-b).	system	f	/admin?tab=booths	2026-10-12 13:07:59.65+00
2f234ea3-3d07-4be4-bd72-5867a3546b66	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động cập nhật	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa cập nhật đề xuất hoạt động "flow-7cfb3efd-740d-45e0-8d25-37908df40514 updated".	system	f	/admin?tab=activities	2026-10-12 13:18:51.097+00
0c2e1123-1305-4600-91e2-d66b4a6a30ed	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa gửi đề xuất hoạt động "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf".	system	f	/admin?tab=activities	2026-10-12 13:07:59.984+00
339edaad-8667-43ec-a29f-9da12d153866	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa gửi đề xuất hoạt động "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf".	system	f	/admin?tab=activities	2026-10-12 13:07:59.984+00
3e04f71b-e6e8-4a44-b255-6b898465d035	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động cập nhật	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa cập nhật đề xuất hoạt động "flow-7cfb3efd-740d-45e0-8d25-37908df40514 updated".	system	f	/admin?tab=activities	2026-10-12 13:18:51.097+00
826a0b89-419c-4fd9-9dd7-24189c54b4ab	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa gửi đề xuất hoạt động "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf".	system	f	/admin?tab=activities	2026-10-12 13:07:59.984+00
eee13174-27ae-4fe1-a9cf-1f9187139684	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đề xuất hoạt động cập nhật	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa cập nhật đề xuất hoạt động "flow-7cfb3efd-740d-45e0-8d25-37908df40514 updated".	system	f	/admin?tab=activities	2026-10-12 13:18:51.097+00
7e024da6-53a3-4040-b69f-4758adbf3715	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa gửi đề xuất hoạt động "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf".	system	f	/admin?tab=activities	2026-10-12 13:07:59.984+00
cd6d6eb2-6985-4b5f-a2c1-b539704de500	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm reject-pending 1791810479963" không được duyệt. Ghi chú của Ban Quản Lý: Chủ đề không phù hợp với định hướng tuần lễ sách	activity	f	/partner/activities	2026-10-12 13:08:00.034+00
2768874a-942f-4f26-886b-79154d2b74a4	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm reject-need-rev 1791810480042" không được duyệt. Ghi chú của Ban Quản Lý: Hết hạn nộp bổ sung nhưng đối tác không phản hồi	activity	f	/partner/activities	2026-10-12 13:08:00.084+00
59296434-d71e-421e-a8aa-9185db48326d	33c2a21d-4a71-4820-a171-97df600f78ce	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-e41c2cc6-b107-4c09-93b6-ee8abdefd3e2.	system	f	/admin?tab=events	2026-10-12 13:09:44.276+00
fb666db2-0220-44ec-9d25-0b7edd5bebb6	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-e41c2cc6-b107-4c09-93b6-ee8abdefd3e2.	system	f	/admin?tab=events	2026-10-12 13:09:44.276+00
af3407d7-65b6-492f-995b-dce107e69531	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-e41c2cc6-b107-4c09-93b6-ee8abdefd3e2.	system	f	/admin?tab=events	2026-10-12 13:09:44.276+00
8fec610e-5313-49d1-b471-ccc39556b96a	87427bb9-732b-44b3-aed9-18938ae98fe9	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-e41c2cc6-b107-4c09-93b6-ee8abdefd3e2.	system	f	/admin?tab=events	2026-10-12 13:09:44.276+00
8c2e164c-809f-4eb6-bfff-fd7b5081a6e4	33c2a21d-4a71-4820-a171-97df600f78ce	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-2c14ff52-3a94-4976-ae2d-4a13886836a1.	system	f	/admin?tab=events	2026-10-12 13:13:09.16+00
61c57029-a9cc-46f6-baea-0b181d87855f	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-2c14ff52-3a94-4976-ae2d-4a13886836a1.	system	f	/admin?tab=events	2026-10-12 13:13:09.16+00
bdc5ecc4-4cfc-4299-b370-67d16eb99dca	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-2c14ff52-3a94-4976-ae2d-4a13886836a1.	system	f	/admin?tab=events	2026-10-12 13:13:09.16+00
cd8f9c03-976a-4bbf-82ab-89879bc50637	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-2c14ff52-3a94-4976-ae2d-4a13886836a1.	system	f	/admin?tab=events	2026-10-12 13:13:09.16+00
27915ace-0dc0-4891-836d-b0b5e76df0af	87427bb9-732b-44b3-aed9-18938ae98fe9	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-2c14ff52-3a94-4976-ae2d-4a13886836a1.	system	f	/admin?tab=events	2026-10-12 13:13:09.16+00
f95be14d-9eba-41cf-b749-4f8ec21296cf	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm reject-pending 1791810791825" không được duyệt. Ghi chú của Ban Quản Lý: Chủ đề không phù hợp với định hướng tuần lễ sách	activity	f	/partner/activities	2026-10-12 13:13:11.851+00
fe27dba4-7c38-4935-a4db-64f43e05bd8e	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm reject-need-rev 1791810791858" không được duyệt. Ghi chú của Ban Quản Lý: Hết hạn nộp bổ sung nhưng đối tác không phản hồi	activity	f	/partner/activities	2026-10-12 13:13:11.879+00
cde13ee3-54c6-4415-bb0f-2bc622231dec	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:13:13.462+00
0ecead0a-05b1-4391-83c0-c6f08d738a80	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:13:13.462+00
8e8c7641-e126-414c-94c5-7e7d3a3ce60c	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đơn đăng ký sự kiện mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:13:13.462+00
d4f67773-5beb-4590-b8ca-bbc37713bec7	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:13:13.462+00
93895ffe-1476-4a50-ad9b-0b8c569e2e02	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:13:13.462+00
21e6b708-b394-43b1-8572-576056559ef4	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa gửi yêu cầu đăng ký gian hàng flow-e2d3b182-a1ba-47c7-855a-56d61c562866 (fe09b094-463e-494c-9).	system	f	/admin?tab=booths	2026-10-12 13:13:13.528+00
f278452c-7b2d-4a87-a945-69c7456a00ad	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa gửi yêu cầu đăng ký gian hàng flow-e2d3b182-a1ba-47c7-855a-56d61c562866 (fe09b094-463e-494c-9).	system	f	/admin?tab=booths	2026-10-12 13:13:13.528+00
1997223c-d366-4783-81b0-69c99586a184	a7b263a9-8578-447a-857b-ef4f1a885cbf	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa gửi yêu cầu đăng ký gian hàng flow-e2d3b182-a1ba-47c7-855a-56d61c562866 (fe09b094-463e-494c-9).	system	f	/admin?tab=booths	2026-10-12 13:13:13.528+00
b4ac7fe0-c3e2-4c9a-8b26-8602908e5d8e	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa gửi yêu cầu đăng ký gian hàng flow-e2d3b182-a1ba-47c7-855a-56d61c562866 (fe09b094-463e-494c-9).	system	f	/admin?tab=booths	2026-10-12 13:13:13.528+00
7dedc15a-39f5-438d-8a40-4725e25e4e01	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa gửi yêu cầu đăng ký gian hàng flow-e2d3b182-a1ba-47c7-855a-56d61c562866 (fe09b094-463e-494c-9).	system	f	/admin?tab=booths	2026-10-12 13:13:13.528+00
f784c46b-2bc2-4266-8dc7-bfa61b417b64	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động cập nhật	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa cập nhật đề xuất hoạt động "flow-7cfb3efd-740d-45e0-8d25-37908df40514 updated".	system	f	/admin?tab=activities	2026-10-12 13:18:51.097+00
380f09ab-db03-4dcc-b49a-d14257416d88	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa gửi đề xuất hoạt động "flow-e2d3b182-a1ba-47c7-855a-56d61c562866".	system	f	/admin?tab=activities	2026-10-12 13:13:13.731+00
61b6d6e1-7b26-4e61-83ce-3ebc8d7eba9a	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa gửi đề xuất hoạt động "flow-e2d3b182-a1ba-47c7-855a-56d61c562866".	system	f	/admin?tab=activities	2026-10-12 13:13:13.731+00
a2baaf8b-8d57-4b2e-8704-62bba10516d1	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đề xuất hoạt động mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa gửi đề xuất hoạt động "flow-e2d3b182-a1ba-47c7-855a-56d61c562866".	system	f	/admin?tab=activities	2026-10-12 13:13:13.731+00
789ec529-63d1-4fa4-87a5-afdc8ce16125	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động cập nhật	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa cập nhật đề xuất hoạt động "flow-7cfb3efd-740d-45e0-8d25-37908df40514 updated".	system	f	/admin?tab=activities	2026-10-12 13:18:51.097+00
fe616546-8437-4dd5-aedc-fb60586045d0	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa gửi đề xuất hoạt động "flow-e2d3b182-a1ba-47c7-855a-56d61c562866".	system	f	/admin?tab=activities	2026-10-12 13:13:13.731+00
5dc340cd-26bc-4718-885f-d959e18f36ec	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa gửi đề xuất hoạt động "flow-e2d3b182-a1ba-47c7-855a-56d61c562866".	system	f	/admin?tab=activities	2026-10-12 13:13:13.731+00
249981b7-2a81-473f-a700-a2190c9a3669	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động cập nhật	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa cập nhật đề xuất hoạt động "flow-e2d3b182-a1ba-47c7-855a-56d61c562866 updated".	system	f	/admin?tab=activities	2026-10-12 13:13:13.872+00
fb4a6baa-3042-4065-9123-c6306debbf7a	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động cập nhật	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa cập nhật đề xuất hoạt động "flow-e2d3b182-a1ba-47c7-855a-56d61c562866 updated".	system	f	/admin?tab=activities	2026-10-12 13:13:13.872+00
8dbbbff3-8a59-4b78-b1f3-4ada73391f6f	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đề xuất hoạt động cập nhật	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa cập nhật đề xuất hoạt động "flow-e2d3b182-a1ba-47c7-855a-56d61c562866 updated".	system	f	/admin?tab=activities	2026-10-12 13:13:13.872+00
c7fed799-8d9d-4ce4-af11-603de9830496	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động cập nhật	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa cập nhật đề xuất hoạt động "flow-e2d3b182-a1ba-47c7-855a-56d61c562866 updated".	system	f	/admin?tab=activities	2026-10-12 13:13:13.872+00
dd1e6db9-9cc6-4aa7-83f7-ebae605b43f1	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động cập nhật	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa cập nhật đề xuất hoạt động "flow-e2d3b182-a1ba-47c7-855a-56d61c562866 updated".	system	f	/admin?tab=activities	2026-10-12 13:13:13.872+00
21b2851c-da89-464c-bfd7-cbe12f8d040b	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:28:14.831+00
a950b75c-09ea-4646-9f35-db8670400462	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:28:14.831+00
12d9d804-72da-43e2-9b27-5740c1252811	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đơn đăng ký sự kiện mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:28:14.831+00
b790901d-4b0e-4cc6-90ec-e6693e419a4a	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:28:14.831+00
ce2b8e95-2402-4cd0-a5fe-77249ebf54ff	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động cập nhật	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa cập nhật đề xuất hoạt động "flow-7cfb3efd-740d-45e0-8d25-37908df40514 updated".	system	t	/admin?tab=activities	2026-10-12 13:18:51.097+00
a94f230d-caf1-449f-93de-0dad6dbf927f	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa gửi yêu cầu đăng ký gian hàng flow-e2d3b182-a1ba-47c7-855a-56d61c562866 (fe09b094-463e-494c-9).	system	t	/admin?tab=booths	2026-10-12 13:13:13.528+00
fb97181f-f3c3-4ddf-a5d3-86c819b08d7b	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa gửi yêu cầu đăng ký gian hàng flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f (1655a445-ae61-41cc-a).	system	f	/admin?tab=booths	2026-10-12 13:28:14.911+00
68f395f8-486d-4623-bf8b-f207252bbfa0	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa gửi đề xuất hoạt động "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f".	system	f	/admin?tab=activities	2026-10-12 13:28:15.12+00
974598da-0018-47a2-854d-37dd2e2b8d73	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa gửi đề xuất hoạt động "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f".	system	f	/admin?tab=activities	2026-10-12 13:28:15.12+00
ed407fcd-5f2d-48b8-a551-1cd3cfee6b92	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đề xuất hoạt động mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa gửi đề xuất hoạt động "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f".	system	f	/admin?tab=activities	2026-10-12 13:28:15.12+00
4777c624-0d01-4683-a3d8-337fefe51099	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa gửi đề xuất hoạt động "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f".	system	f	/admin?tab=activities	2026-10-12 13:28:15.12+00
07b3a22e-c3b7-4d0b-8a7f-884d205706c7	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa gửi đề xuất hoạt động "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f".	system	f	/admin?tab=activities	2026-10-12 13:28:15.12+00
fe6b6803-a377-4def-b039-55529e606765	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động cập nhật	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa cập nhật đề xuất hoạt động "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f updated".	system	f	/admin?tab=activities	2026-10-12 13:28:15.257+00
1b6bcb81-ce27-4f46-9652-d6ac589b98b8	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động cập nhật	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa cập nhật đề xuất hoạt động "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f updated".	system	f	/admin?tab=activities	2026-10-12 13:28:15.257+00
13154400-d61e-4b86-98ad-9a2a98c79c8f	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đề xuất hoạt động cập nhật	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa cập nhật đề xuất hoạt động "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f updated".	system	f	/admin?tab=activities	2026-10-12 13:28:15.257+00
11932af7-6a4d-4f8b-b8f3-64d70a69bd12	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động cập nhật	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa cập nhật đề xuất hoạt động "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f updated".	system	f	/admin?tab=activities	2026-10-12 13:28:15.257+00
7af6be39-343e-44d8-93ee-528b48200cd8	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động cập nhật	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa cập nhật đề xuất hoạt động "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f updated".	system	f	/admin?tab=activities	2026-10-12 13:28:15.257+00
33c87298-551a-43a5-8ca2-e521722db3f2	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa gửi đề xuất hoạt động "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f".	system	t	/admin?tab=activities	2026-10-12 13:28:15.12+00
0e73bf5e-5162-48dc-9558-480cb5bfe043	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động cập nhật	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa cập nhật đề xuất hoạt động "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f updated".	system	t	/admin?tab=activities	2026-10-12 13:28:15.257+00
940b94eb-52fb-4c54-8b02-79e7bc47f715	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm reject-pending 1791811703429" không được duyệt. Ghi chú của Ban Quản Lý: Chủ đề không phù hợp với định hướng tuần lễ sách	activity	f	/partner/activities	2026-10-12 13:28:23.447+00
bcdc6689-3bf2-474e-aa5f-988cc8ce450c	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm reject-need-rev 1791811703454" không được duyệt. Ghi chú của Ban Quản Lý: Hết hạn nộp bổ sung nhưng đối tác không phản hồi	activity	f	/partner/activities	2026-10-12 13:28:23.47+00
4d395a68-d51e-484f-91db-9f30923ab90f	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:33:29.953+00
c87e959f-447e-4199-a474-f5598dce04bf	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:33:29.953+00
3c41efff-fd4f-488a-83fb-5689a04868a7	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đơn đăng ký sự kiện mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:33:29.953+00
93c2de7a-bf26-4401-ab5d-8d6d560f8bc5	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:33:29.953+00
a9e76f69-4f24-4e6c-a4ba-29da1ac17a54	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 13:33:29.953+00
86cb5937-937e-4834-bd0c-b962dcff19d5	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa gửi yêu cầu đăng ký gian hàng flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb (b8f7b033-4194-4066-9).	system	f	/admin?tab=booths	2026-10-12 13:33:30.019+00
02901a1f-f9e0-4dc1-8242-e063e48cd621	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa gửi yêu cầu đăng ký gian hàng flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb (b8f7b033-4194-4066-9).	system	f	/admin?tab=booths	2026-10-12 13:33:30.019+00
7873bd98-cf86-4bca-91bf-fefe61b4c090	a7b263a9-8578-447a-857b-ef4f1a885cbf	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa gửi yêu cầu đăng ký gian hàng flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb (b8f7b033-4194-4066-9).	system	f	/admin?tab=booths	2026-10-12 13:33:30.019+00
d5822126-1749-4cc1-a298-be82b2f1fb2e	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa gửi yêu cầu đăng ký gian hàng flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb (b8f7b033-4194-4066-9).	system	f	/admin?tab=booths	2026-10-12 13:33:30.019+00
b63b536c-6752-4eed-9e37-8fd569ab03fc	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa gửi yêu cầu đăng ký gian hàng flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb (b8f7b033-4194-4066-9).	system	f	/admin?tab=booths	2026-10-12 13:33:30.019+00
d1832287-16b4-412e-8e5a-7c63c5fcfb50	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa gửi đề xuất hoạt động "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb".	system	f	/admin?tab=activities	2026-10-12 13:33:30.289+00
12c8b9e6-0a51-4514-8c71-5dbbf1fe5f38	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa gửi đề xuất hoạt động "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb".	system	f	/admin?tab=activities	2026-10-12 13:33:30.289+00
2aaebd81-7d30-42c5-9be2-40a3de1a5aae	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đề xuất hoạt động mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa gửi đề xuất hoạt động "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb".	system	f	/admin?tab=activities	2026-10-12 13:33:30.289+00
3fae4683-470c-413f-be1f-41b02f5e5c57	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa gửi đề xuất hoạt động "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb".	system	f	/admin?tab=activities	2026-10-12 13:33:30.289+00
87749bd6-437e-4f4a-af7f-d94b1fe72222	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa gửi đề xuất hoạt động "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb".	system	f	/admin?tab=activities	2026-10-12 13:33:30.289+00
be829c75-4a95-4a6a-b306-0f654d1de9d1	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động cập nhật	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa cập nhật đề xuất hoạt động "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb updated".	system	f	/admin?tab=activities	2026-10-12 13:33:30.486+00
ba130ae0-58ed-4bea-83cc-c1be4e6532fb	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động cập nhật	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa cập nhật đề xuất hoạt động "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb updated".	system	f	/admin?tab=activities	2026-10-12 13:33:30.486+00
896848a6-a774-4d78-aefb-e9221caa35f5	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin?tab=event-applications	2026-10-12 13:33:29.953+00
320c6889-9f31-4683-99b7-722d31d0451e	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa gửi yêu cầu đăng ký gian hàng flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb (b8f7b033-4194-4066-9).	system	t	/admin?tab=booths	2026-10-12 13:33:30.019+00
4c80e09d-a70e-4d39-9d6f-5f0f36e3894d	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa gửi đề xuất hoạt động "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb".	system	t	/admin?tab=activities	2026-10-12 13:33:30.289+00
c425033a-f2be-405c-9d0f-448e67edb3ab	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đề xuất hoạt động cập nhật	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa cập nhật đề xuất hoạt động "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb updated".	system	f	/admin?tab=activities	2026-10-12 13:33:30.486+00
ec9fbf0c-d133-49ea-a821-70df7cba446a	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động cập nhật	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa cập nhật đề xuất hoạt động "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb updated".	system	f	/admin?tab=activities	2026-10-12 13:33:30.486+00
ccbd6f34-da0e-4cae-98eb-f48178040e3f	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động cập nhật	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa cập nhật đề xuất hoạt động "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb updated".	system	f	/admin?tab=activities	2026-10-12 13:33:30.486+00
5aadc3b2-7482-4aed-97cd-c0db26a708e1	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm reject-pending 1791812029413" không được duyệt. Ghi chú của Ban Quản Lý: Chủ đề không phù hợp với định hướng tuần lễ sách	activity	f	/partner/activities	2026-10-12 13:33:49.434+00
baaf594c-a010-4779-9b2f-e631881e1ea0	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm reject-need-rev 1791812029441" không được duyệt. Ghi chú của Ban Quản Lý: Hết hạn nộp bổ sung nhưng đối tác không phản hồi	activity	f	/partner/activities	2026-10-12 13:33:49.461+00
6ad7893e-6e15-45b9-854e-430e455cee0b	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm reject-empty-note 1791812029406" không được duyệt.	activity	f	/partner/activities	2026-10-12 13:43:55.445+00
9cd26d55-51a3-4d4e-ac2d-738e24fca536	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm supp-empty-note 1791812029367" không được duyệt. Ghi chú của Ban Quản Lý: ád	activity	f	/partner/activities	2026-10-12 13:44:06.586+00
167d77c6-14e2-4393-b459-9db08a8d4150	a1997704-8ccd-4838-ab09-31be558bf632	Đề xuất hoạt động không được duyệt	Đề xuất "Đề xuất thử nghiệm detail-test 1791812029248" không được duyệt. Ghi chú của Ban Quản Lý: áda	activity	f	/partner/activities	2026-10-12 13:44:16.901+00
f980ff3b-d734-4587-afb8-2d6a863a29c3	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa gửi yêu cầu đăng ký gian hàng flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85 (1c2f74df-e306-4a72-b).	system	t	/admin?tab=booths	2026-10-12 07:30:31.175+00
976c7df6-2e32-4c65-b90e-ca55664c347f	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa gửi đề xuất hoạt động "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85".	system	t	/admin?tab=activities	2026-10-12 07:30:31.456+00
0ff46bcb-f211-4fc7-ac0e-a1dbb11680ea	b9d37b50-942d-430a-a45f-0e303739b400	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-e8f59d93-c484-42c0-9809-0888d2c9655f.	system	t	/admin?tab=events	2026-10-12 13:18:48.172+00
2f09c18a-3cef-46ce-885c-2f429bf205d2	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-ca049c45-b0d2-41a8-8c7e-ee46e32ecd85" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin?tab=event-applications	2026-10-12 07:30:31.083+00
fca39c02-0239-4943-9a03-ee93eeaab2bc	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động cập nhật	Đối tác "Nhà Xuất Bản Trẻ" vừa cập nhật đề xuất hoạt động "ádasdas".	system	t	/admin?tab=activities	2026-10-12 07:58:05.094+00
edca4b4f-aa19-4788-b245-7041a9dfedb8	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-c5090f99-5f0d-4e61-8203-18fb40d9f808" vừa gửi yêu cầu đăng ký gian hàng flow-c5090f99-5f0d-4e61-8203-18fb40d9f808 (7617643e-71c9-480a-a).	system	t	/admin?tab=booths	2026-10-12 08:13:00.175+00
55ccb092-2ad8-4c1c-aacf-2f65463d881c	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin?tab=event-applications	2026-10-12 12:42:17.855+00
444717a5-4253-4477-8f00-0293bb9b2442	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động cập nhật	Đối tác "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb" vừa cập nhật đề xuất hoạt động "flow-d2bbd016-2ab1-4633-b325-ee5c480d74bb updated".	system	t	/admin?tab=activities	2026-10-12 13:33:30.486+00
96f22e6a-ca70-42f8-83ef-2edab3ee5ebd	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	Đề xuất hoạt động không được duyệt	Đề xuất "ádasd" không được duyệt.	activity	t	/partner/activities	2026-10-11 14:18:12.368+00
6ba2c260-c47d-497d-a5fc-e226287e0045	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-7cfb3efd-740d-45e0-8d25-37908df40514" vừa gửi yêu cầu đăng ký gian hàng flow-7cfb3efd-740d-45e0-8d25-37908df40514 (de921b1e-c77f-4844-a).	system	t	/admin?tab=booths	2026-10-12 13:18:50.602+00
2dc2d094-019f-4656-97b1-b0ecb0693129	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-d6c304ab-c371-433d-a97b-b65ec4e54059" vừa gửi đề xuất hoạt động "flow-d6c304ab-c371-433d-a97b-b65ec4e54059".	system	t	/admin?tab=activities	2026-10-12 12:42:18.195+00
a4cb7646-c479-4b2d-9da5-0acab961e549	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin?tab=event-applications	2026-10-12 12:43:26.443+00
99b40946-4231-4386-89b9-899fec8751f4	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa gửi yêu cầu đăng ký gian hàng flow-47588180-2a77-4e39-b335-3d7305c2a7d8 (7d693e8f-a185-4522-8).	system	t	/admin?tab=booths	2026-10-12 12:43:26.5+00
b101af9d-6f28-4ce4-ba06-e5fea9fd3d5d	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-47588180-2a77-4e39-b335-3d7305c2a7d8" vừa gửi đề xuất hoạt động "flow-47588180-2a77-4e39-b335-3d7305c2a7d8".	system	t	/admin?tab=activities	2026-10-12 12:43:26.648+00
672dcddf-180e-45ec-b7d6-68a94962cd61	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa gửi yêu cầu đăng ký gian hàng flow-65d23335-ee24-4e01-b518-c06473069a93 (ed4fb308-00b8-4b37-a).	system	t	/admin?tab=booths	2026-10-12 12:59:09.957+00
000e93fe-b12c-4fa4-9409-0842b6780502	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa gửi yêu cầu đăng ký gian hàng flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f (1655a445-ae61-41cc-a).	system	t	/admin?tab=booths	2026-10-12 13:28:14.911+00
3dd59d12-6f98-4071-9cea-594f7fd4c774	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-65d23335-ee24-4e01-b518-c06473069a93" vừa gửi đề xuất hoạt động "flow-65d23335-ee24-4e01-b518-c06473069a93".	system	t	/admin?tab=activities	2026-10-12 12:59:10.277+00
20c23e63-db2e-43bb-be07-7d6eda811f5b	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-ad6038c5-6823-40a7-98a7-fafab6ef3a11" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin?tab=event-applications	2026-10-12 13:06:00.508+00
22da671c-d7d2-4f76-9ac5-8878d7809598	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa gửi yêu cầu đăng ký gian hàng flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf (4b9e604e-afdb-42df-b).	system	t	/admin?tab=booths	2026-10-12 13:07:59.65+00
8e3ce650-e35a-4433-b121-bada357fadf4	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf" vừa gửi đề xuất hoạt động "flow-07bb965d-8ec8-4e6d-ae3f-1785a1eb4abf".	system	t	/admin?tab=activities	2026-10-12 13:07:59.984+00
c8bd3a65-c147-46f4-ac66-9219eab0e753	b9d37b50-942d-430a-a45f-0e303739b400	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-e41c2cc6-b107-4c09-93b6-ee8abdefd3e2.	system	t	/admin?tab=events	2026-10-12 13:09:44.276+00
10689aca-1a27-4650-b4d8-475921a1f2a2	b9d37b50-942d-430a-a45f-0e303739b400	Đăng ký sự kiện mới	Khách đăng ký đăng ký 1000 người tham dự guest-2c14ff52-3a94-4976-ae2d-4a13886836a1.	system	t	/admin?tab=events	2026-10-12 13:13:09.16+00
3db098eb-3bc5-4efb-84b6-51ff416ff628	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin?tab=event-applications	2026-10-12 13:13:13.462+00
e117bd55-33e8-4978-a2df-45a387958870	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa gửi đề xuất hoạt động "flow-e2d3b182-a1ba-47c7-855a-56d61c562866".	system	t	/admin?tab=activities	2026-10-12 13:13:13.731+00
206190d3-45de-4e3f-89f6-e2a096a051c4	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động cập nhật	Đối tác "flow-e2d3b182-a1ba-47c7-855a-56d61c562866" vừa cập nhật đề xuất hoạt động "flow-e2d3b182-a1ba-47c7-855a-56d61c562866 updated".	system	t	/admin?tab=activities	2026-10-12 13:13:13.872+00
5c10ccad-4139-4be9-ae76-5e07bda4627a	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-72062ee8-5c8a-4db5-a8c5-d19a3ec69d3f" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin?tab=event-applications	2026-10-12 13:28:14.831+00
5952eaaf-9230-4e35-8cdd-ed3634c618c7	33c2a21d-4a71-4820-a171-97df600f78ce	Đơn đăng ký sự kiện mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 14:06:55.928+00
7abf66d6-5988-435c-ac90-69c3c3dc9c8a	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đơn đăng ký sự kiện mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 14:06:55.928+00
e64d6b25-511a-4314-8c03-876cb5cfc48a	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đơn đăng ký sự kiện mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 14:06:55.928+00
f0535b29-a6fc-4586-b561-091e703e8130	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đơn đăng ký sự kiện mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 14:06:55.928+00
c6bc7874-230f-46e2-a094-39171af1dc39	87427bb9-732b-44b3-aed9-18938ae98fe9	Đơn đăng ký sự kiện mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	f	/admin?tab=event-applications	2026-10-12 14:06:55.928+00
64df501f-0d69-4822-b6d7-8500fa2076a8	33c2a21d-4a71-4820-a171-97df600f78ce	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa gửi yêu cầu đăng ký gian hàng flow-f0c958d2-b372-4806-bd8f-a28cac576ab9 (cf6b4d19-5104-460b-8).	system	f	/admin?tab=booths	2026-10-12 14:06:55.988+00
806e877c-1ca1-4e67-bc3c-04db0774c60b	28b86971-83f1-47de-a8dc-7bf083bfffe8	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa gửi yêu cầu đăng ký gian hàng flow-f0c958d2-b372-4806-bd8f-a28cac576ab9 (cf6b4d19-5104-460b-8).	system	f	/admin?tab=booths	2026-10-12 14:06:55.988+00
b4526210-48db-482d-8509-0d54cbf6c23d	a7b263a9-8578-447a-857b-ef4f1a885cbf	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa gửi yêu cầu đăng ký gian hàng flow-f0c958d2-b372-4806-bd8f-a28cac576ab9 (cf6b4d19-5104-460b-8).	system	f	/admin?tab=booths	2026-10-12 14:06:55.988+00
29f58783-53ae-41e4-a3e7-2c11867833d8	b9d37b50-942d-430a-a45f-0e303739b400	Đơn đăng ký sự kiện mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa nộp hồ sơ đăng ký tham gia sự kiện.	system	t	/admin?tab=event-applications	2026-10-12 14:06:55.928+00
8a1f7a8d-4438-4838-8ea5-86572b1390d3	b9d37b50-942d-430a-a45f-0e303739b400	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa gửi yêu cầu đăng ký gian hàng flow-f0c958d2-b372-4806-bd8f-a28cac576ab9 (cf6b4d19-5104-460b-8).	system	t	/admin?tab=booths	2026-10-12 14:06:55.988+00
94f967bc-bffe-42ec-99da-e3455ccada7b	7d1be1fc-f868-4402-a1b9-dc90260860dc	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa gửi yêu cầu đăng ký gian hàng flow-f0c958d2-b372-4806-bd8f-a28cac576ab9 (cf6b4d19-5104-460b-8).	system	f	/admin?tab=booths	2026-10-12 14:06:55.988+00
24c76754-be89-4120-a8ce-144a0cbeb2cc	87427bb9-732b-44b3-aed9-18938ae98fe9	Yêu cầu đăng ký gian hàng mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa gửi yêu cầu đăng ký gian hàng flow-f0c958d2-b372-4806-bd8f-a28cac576ab9 (cf6b4d19-5104-460b-8).	system	f	/admin?tab=booths	2026-10-12 14:06:55.988+00
9ba0124b-4638-4ab4-a26c-023f4b86c5c7	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa gửi đề xuất hoạt động "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9".	system	f	/admin?tab=activities	2026-10-12 14:06:56.17+00
d73d2a82-541e-4243-9fbe-f80e4a3f5019	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa gửi đề xuất hoạt động "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9".	system	f	/admin?tab=activities	2026-10-12 14:06:56.17+00
22755d40-b6ea-4b65-b968-e525e2279806	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đề xuất hoạt động mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa gửi đề xuất hoạt động "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9".	system	f	/admin?tab=activities	2026-10-12 14:06:56.17+00
b0bfc131-59ce-42de-8d7c-6d970c66c538	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa gửi đề xuất hoạt động "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9".	system	f	/admin?tab=activities	2026-10-12 14:06:56.17+00
6d0149b3-51ea-415f-8f91-916ed10780a4	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa gửi đề xuất hoạt động "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9".	system	f	/admin?tab=activities	2026-10-12 14:06:56.17+00
df3b10f8-363a-4ad8-a58e-73db92192194	33c2a21d-4a71-4820-a171-97df600f78ce	Đề xuất hoạt động cập nhật	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa cập nhật đề xuất hoạt động "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9 updated".	system	f	/admin?tab=activities	2026-10-12 14:06:56.31+00
1c377fec-0e15-4e2f-bd5f-5f3519e2c0bb	28b86971-83f1-47de-a8dc-7bf083bfffe8	Đề xuất hoạt động cập nhật	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa cập nhật đề xuất hoạt động "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9 updated".	system	f	/admin?tab=activities	2026-10-12 14:06:56.31+00
7ff9cdb3-5ffe-461e-84f8-f39e05fb39c6	a7b263a9-8578-447a-857b-ef4f1a885cbf	Đề xuất hoạt động cập nhật	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa cập nhật đề xuất hoạt động "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9 updated".	system	f	/admin?tab=activities	2026-10-12 14:06:56.31+00
fe10d552-30e4-4dbd-a5fd-ba678703c43e	7d1be1fc-f868-4402-a1b9-dc90260860dc	Đề xuất hoạt động cập nhật	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa cập nhật đề xuất hoạt động "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9 updated".	system	f	/admin?tab=activities	2026-10-12 14:06:56.31+00
64a7da22-3837-4c56-afa2-f9afde93e823	87427bb9-732b-44b3-aed9-18938ae98fe9	Đề xuất hoạt động cập nhật	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa cập nhật đề xuất hoạt động "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9 updated".	system	f	/admin?tab=activities	2026-10-12 14:06:56.31+00
39128531-88fc-423f-a653-9b2d011bc04b	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động mới	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa gửi đề xuất hoạt động "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9".	system	t	/admin?tab=activities	2026-10-12 14:06:56.17+00
18a2294e-0235-418c-bfeb-6fe3e2ffd750	b9d37b50-942d-430a-a45f-0e303739b400	Đề xuất hoạt động cập nhật	Đối tác "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9" vừa cập nhật đề xuất hoạt động "flow-f0c958d2-b372-4806-bd8f-a28cac576ab9 updated".	system	t	/admin?tab=activities	2026-10-12 14:06:56.31+00
\.


--
-- Data for Name: organization_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organization_members (id, organization_id, user_id, role_in_org, created_at) FROM stdin;
672ecf8d-7b28-48d2-a485-4270de113b21	099484c0-25dc-40ab-a189-91d8ab2005bd	a1997704-8ccd-4838-ab09-31be558bf632	owner	2026-10-10 02:52:55.190932+00
763b90d3-bb82-48cd-a250-bee0724c5bc0	f4b638e5-2712-46b6-a6eb-ae50077cb0e3	bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	owner	2026-10-10 02:52:55.190932+00
35761ce7-7e46-431c-b2bd-d74e95de27c9	b85174ff-d92a-4e43-af7a-abd64e0ac3d6	6e7e64dc-0aa6-4bba-b597-161177545e12	owner	2026-10-10 11:38:29.597+00
823a85f0-fd96-4bc7-9987-b990a0b3a028	a0d31fd8-f849-4040-a088-fa919189f072	7025101e-b82c-4def-8629-b18a2121c1ad	owner	2026-10-10 11:38:29.607+00
7a88e403-aa4b-4faf-b582-1d079d16cfd2	e8b8bf53-96c2-458c-a09d-7ce75017cded	180526ad-0f27-4d92-b773-a23eafdb5351	owner	2026-10-11 10:21:49.3+00
d31e2348-8a04-4d0c-ba04-87ed76c0e2c6	29b0bc58-7e9b-4043-aef2-aad09e2a0626	5fbd98d8-008f-43a5-be13-662db889602e	owner	2026-10-11 13:50:32.749+00
59f0fd76-8c35-4fa3-abce-ec46bc8ffc66	13a58e03-c09e-48de-bdd7-7453755568ea	4a6ffe36-5759-4daa-b3bf-211c726c828e	member	2026-10-12 13:13:09.07+00
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizations (id, name, short_desc, logo_url, representative_name, email, phone, address, website, categories, is_verified, created_at, updated_at, is_deleted) FROM stdin;
099484c0-25dc-40ab-a189-91d8ab2005bd	Nhà Sách Bình Minh	Nhà Sách Bình Minh mang đến những cuốn sách chất lượng, lan tỏa tri thức và văn hóa đọc cho mọi người.	https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80	Nguyễn Văn B	binhminh@books.com	0909 123 456	123 Nguyễn Văn Cừ, Quận 1, TP.HCM	https://binhminhbooks.vn	{}	t	2026-10-10 02:52:39.39424+00	2026-10-10 02:52:39.39424+00	f
f4b638e5-2712-46b6-a6eb-ae50077cb0e3	Nhà Xuất Bản Trẻ	Nhà Xuất Bản Trẻ - Đồng hành cùng độc giả trẻ tuổi và văn học đương đại Việt Nam suốt hơn 30 năm.	https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=200&q=80	Trần Văn C	nxbtre@partner.duongsach.vn	0903 456 789	161B Lý Chính Thắng, Quận 3, TP.HCM	https://nxbtre.com.vn	{}	t	2026-10-10 02:52:39.39424+00	2026-10-10 02:52:39.39424+00	f
b85174ff-d92a-4e43-af7a-abd64e0ac3d6	Nhà Xuất Bản Kim Đồng	Nhà xuất bản chuyên dòng sách tranh, truyện thiếu nhi và văn học tuổi thơ hàng đầu Việt Nam.	https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=200&q=80	Lê Thị D	kimdong@partner.duongsach.vn	0908 765 432	248 Cống Quỳnh, Quận 1, TP.HCM	https://nxbkimdong.com.vn	{}	t	2026-10-10 02:52:39.39424+00	2026-10-10 02:52:39.39424+00	f
a0d31fd8-f849-4040-a088-fa919189f072	Công ty Cổ phần Văn hóa & Truyền thông Nhã Nam	Nhã Nam - Đưa tinh hoa văn học thế giới đến độc giả Việt Nam với thiết kế bìa tinh tế và bản dịch chất lượng.	https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=200&q=80	Phạm Hoàng E	nhanam@partner.duongsach.vn	0912 345 678	59 Đỗ Quang, Cầu Giấy, Hà Nội	https://nhanam.com.vn	{}	t	2026-10-10 02:52:39.39424+00	2026-10-10 02:52:39.39424+00	f
e8b8bf53-96c2-458c-a09d-7ce75017cded	Lâm Minh Khải	\N	\N	Lâm Minh Khải	Khai262005@gmail.com	0961795758	\N	\N	{}	f	2026-10-11 10:21:49.3+00	2026-10-11 10:21:49.3+00	f
29b0bc58-7e9b-4043-aef2-aad09e2a0626	Lâm minh khải	\N	\N	Lâm minh khải	Khai2023@gmail.com	09123342342	\N	\N	{}	f	2026-10-11 13:50:32.749+00	2026-10-11 13:50:32.749+00	f
13a58e03-c09e-48de-bdd7-7453755568ea	guest-2c14ff52-3a94-4976-ae2d-4a13886836a1	\N	\N	guest-2c14ff52-3a94-4976-ae2d-4a13886836a1	partner-guest-2c14ff52-3a94-4976-ae2d-4a13886836a1@example.test	0901234567	\N	\N	{}	f	2026-10-12 13:13:09.07+00	2026-10-12 13:13:09.07+00	f
\.


--
-- Data for Name: partner_applications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partner_applications (id, event_id, organization_id, status, step, submitted_at, reviewed_at, reviewed_by, review_note, created_at, updated_at) FROM stdin;
b556e577-d159-41c6-a60d-9711c2ae0083	daa1f312-395e-43a2-a91c-00f3a3d50bbb	099484c0-25dc-40ab-a189-91d8ab2005bd	approved	3	2026-10-05 02:52:56.552338+00	2026-10-07 02:52:56.552338+00	\N	Hồ sơ pháp lý và kế hoạch tham gia đầy đủ, hợp lệ	2026-10-10 02:52:56.552338+00	2026-10-10 02:52:56.552338+00
067a053f-b60d-4e26-a124-5310db0ee8bc	daa1f312-395e-43a2-a91c-00f3a3d50bbb	f4b638e5-2712-46b6-a6eb-ae50077cb0e3	approved	3	2026-10-04 02:52:56.552338+00	2026-10-06 02:52:56.552338+00	\N	NXB Trẻ được phê duyệt tham gia khu gian hàng trung tâm	2026-10-10 02:52:56.552338+00	2026-10-10 02:52:56.552338+00
5369dfca-a75f-4996-b558-da7477e1a583	daa1f312-395e-43a2-a91c-00f3a3d50bbb	e8b8bf53-96c2-458c-a09d-7ce75017cded	submitted	1	2026-10-11 10:22:42.483+00	\N	\N	\N	2026-10-11 10:22:42.484+00	2026-10-11 10:22:42.484+00
\.


--
-- Data for Name: partner_withdrawals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partner_withdrawals (id, event_id, organization_id, application_id, requested_by, reviewed_by, reason, status, reviewed_at, review_note, created_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, code, name, module, description, created_at) FROM stdin;
9fb8226b-b6bc-4f91-aede-cebba0a60a58	account.login	Đăng nhập hệ thống	account	\N	2026-10-10 02:52:53.042099+00
59594cd0-3c43-48e0-a95a-e8347ee177ed	account.profile	Quản lý hồ sơ cá nhân	account	\N	2026-10-10 02:52:53.042099+00
d2683da5-8521-48ad-a76c-ff8d8ba4ab3a	account.password	Đổi mật khẩu bảo mật	account	\N	2026-10-10 02:52:53.042099+00
cc4581ca-ce40-4e05-a78f-503b7ca80ed2	events.view	Xem danh sách sự kiện	events	\N	2026-10-10 02:52:53.042099+00
0ef0dd1f-3cf1-42d4-a505-b113b6b58696	events.manage	Tạo & Điều phối sự kiện	events	\N	2026-10-10 02:52:53.042099+00
06a35a6d-40a5-4e8b-a50e-b1062612ef89	events.apply	Nộp hồ sơ tham gia sự kiện	events	\N	2026-10-10 02:52:53.042099+00
5b144221-b2c6-4eab-a1f1-85d824133de0	booths.view	Xem sơ đồ mặt bằng gian hàng	booths	\N	2026-10-10 02:52:53.042099+00
28762d28-e6b8-40b9-af28-2fa2b84085c2	booths.register	Đăng ký chọn gian hàng	booths	\N	2026-10-10 02:52:53.042099+00
1adf46c2-8892-41ea-aa85-e78fe3856a26	booths.approve	Phê duyệt & phân bổ gian	booths	\N	2026-10-10 02:52:53.042099+00
1a5b6377-8541-4783-a756-0aba034996e1	activities.participate	Đăng ký tham gia hoạt động	activities	\N	2026-10-10 02:52:53.042099+00
694fb2b9-9929-442a-a7ba-bab6d3087984	activities.propose	Đề xuất hoạt động/tọa đàm	activities	\N	2026-10-10 02:52:53.042099+00
6109b509-47a4-40c7-acb4-2fe2f96e12dc	activities.review	Thẩm định & duyệt hoạt động	activities	\N	2026-10-10 02:52:53.042099+00
91d72db3-0e33-4b47-a1c1-b157c18cd02c	activities.checkin	Quét mã Check-in điểm danh	activities	\N	2026-10-10 02:52:53.042099+00
8e32ca9d-75e5-40a1-a135-3013b64e25a3	content.heritage.view	Xem câu chuyện di sản	content	\N	2026-10-10 02:52:53.042099+00
86efcfd9-80cd-4ba9-a232-ddb491ddc59e	content.heritage.edit	Biên tập nội dung di sản	content	\N	2026-10-10 02:52:53.042099+00
4361ae5f-ba13-4e8d-a1a8-c5dd0074a7d4	content.badges.manage	Cấu hình quy tắc huy hiệu	content	\N	2026-10-10 02:52:53.042099+00
639b6d74-7987-4468-a610-34f1d27bf40d	reports.partner	Xem báo cáo đối tác	reports	\N	2026-10-10 02:52:53.042099+00
6cab90bb-a2f4-4177-ac1f-46a9d57a129b	reports.organizer	Báo cáo điều hành tổng quan	reports	\N	2026-10-10 02:52:53.042099+00
712bf20d-125a-42f6-a944-b670c0da5f35	reports.system	Báo cáo toàn diện hệ thống	reports	\N	2026-10-10 02:52:53.042099+00
e6f261ec-ab9b-4789-a549-cbf869797ac1	system.users.manage	Quản lý tài khoản người dùng	system	\N	2026-10-10 02:52:53.042099+00
a194d622-e818-4206-a338-f8219586b9a9	system.roles.manage	Quản lý vai trò & phân quyền	system	\N	2026-10-10 02:52:53.042099+00
bf809b05-8864-4864-a174-e9d291c3a6cb	system.settings.manage	Cài đặt cấu hình nền tảng	system	\N	2026-10-10 02:52:53.042099+00
fe24c2ee-0b18-4afd-ae4a-27ba4611289c	system.logs.view	Xem nhật ký Audit logs	system	\N	2026-10-10 02:52:53.042099+00
bf1b6a8b-9e8d-459f-8aa9-6d70bfcf54ce	library.read	Xem sách trong gian hàng	library	\N	2026-10-10 02:53:08.674465+00
46e62117-65b1-4483-bedf-e3ffc292eb99	library.submit	Gửi nội dung sách để duyệt	library	\N	2026-10-10 02:53:08.674465+00
31a50568-ecbb-4802-b959-dbede1aecaa1	library.inventory.update	Cập nhật tồn kho sách	library	\N	2026-10-10 02:53:08.674465+00
917ff0f3-aa19-496e-a75a-00bec7ea5afe	library.sales.update	Cập nhật số bán sách	library	\N	2026-10-10 02:53:08.674465+00
2696cae8-770e-4e70-9f9d-435b48adf15d	library.moderate	Kiểm duyệt sách	library	\N	2026-10-10 02:53:08.674465+00
b028cabe-ff17-4d8e-a0d1-db90cf0cf961	library.taxonomy.manage	Quản lý phân loại và nhãn sách	library	\N	2026-10-10 02:53:08.674465+00
\.


--
-- Data for Name: point_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.point_transactions (id, user_id, registration_id, booth_visit_id, points, reason, created_at) FROM stdin;
22a6849f-9a07-4d8c-9425-11d0dbefa40e	518a7ba0-302a-4463-a113-f0ca5eb94dd7	9d3a2d20-d390-4498-af87-83017eab53fd	\N	30	Tham gia hoạt động: Tọa đàm Ký ức văn học Sài Gòn - Chợ Lớn	2026-10-10 02:52:59.073601+00
2ad37a95-28aa-49dc-98a9-51d03e2f2edc	518a7ba0-302a-4463-a113-f0ca5eb94dd7	8b2c1d10-d390-4498-af87-83017eab53fe	\N	30	Tham gia hoạt động: Giao lưu tác giả Hành Trình Lan Tỏa Văn Hóa Đọc	2026-10-10 02:52:59.073601+00
\.


--
-- Data for Name: proposal_devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proposal_devices (id, proposal_id, asset_id, name, quantity) FROM stdin;
\.


--
-- Data for Name: public_event_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.public_event_registrations (id, event_id, full_name, email, phone, attendees_count, registration_code, notes, created_at) FROM stdin;
d61852f2-d1b0-4af2-b014-210101a1dcd9	daa1f312-395e-43a2-a91c-00f3a3d50bbb	Nguyễn Thính Giả Test	thinhgia.test@gmail.com	0912345678	2	EVT-H5QZX5	Đăng ký tham gia trải nghiệm	2026-10-10 05:22:17.869+00
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (role_id, permission_id, created_at) FROM stdin;
e40c5e4d-f1c5-494c-a965-06c54956d1f7	9fb8226b-b6bc-4f91-aede-cebba0a60a58	2026-10-10 02:52:53.053016+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	59594cd0-3c43-48e0-a95a-e8347ee177ed	2026-10-10 02:52:53.053756+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	d2683da5-8521-48ad-a76c-ff8d8ba4ab3a	2026-10-10 02:52:53.054625+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	cc4581ca-ce40-4e05-a78f-503b7ca80ed2	2026-10-10 02:52:53.055441+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	06a35a6d-40a5-4e8b-a50e-b1062612ef89	2026-10-10 02:52:53.05621+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	5b144221-b2c6-4eab-a1f1-85d824133de0	2026-10-10 02:52:53.057022+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	28762d28-e6b8-40b9-af28-2fa2b84085c2	2026-10-10 02:52:53.05784+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	1a5b6377-8541-4783-a756-0aba034996e1	2026-10-10 02:52:53.058655+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	694fb2b9-9929-442a-a7ba-bab6d3087984	2026-10-10 02:52:53.059481+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	8e32ca9d-75e5-40a1-a135-3013b64e25a3	2026-10-10 02:52:53.06038+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	639b6d74-7987-4468-a610-34f1d27bf40d	2026-10-10 02:52:53.062008+00
584bddf2-6fe2-40f2-a255-1efb73552b97	9fb8226b-b6bc-4f91-aede-cebba0a60a58	2026-10-10 02:52:53.074949+00
584bddf2-6fe2-40f2-a255-1efb73552b97	59594cd0-3c43-48e0-a95a-e8347ee177ed	2026-10-10 02:52:53.075977+00
584bddf2-6fe2-40f2-a255-1efb73552b97	d2683da5-8521-48ad-a76c-ff8d8ba4ab3a	2026-10-10 02:52:53.076875+00
584bddf2-6fe2-40f2-a255-1efb73552b97	cc4581ca-ce40-4e05-a78f-503b7ca80ed2	2026-10-10 02:52:53.077745+00
584bddf2-6fe2-40f2-a255-1efb73552b97	0ef0dd1f-3cf1-42d4-a505-b113b6b58696	2026-10-10 02:52:53.078649+00
584bddf2-6fe2-40f2-a255-1efb73552b97	06a35a6d-40a5-4e8b-a50e-b1062612ef89	2026-10-10 02:52:53.079452+00
584bddf2-6fe2-40f2-a255-1efb73552b97	5b144221-b2c6-4eab-a1f1-85d824133de0	2026-10-10 02:52:53.080286+00
584bddf2-6fe2-40f2-a255-1efb73552b97	28762d28-e6b8-40b9-af28-2fa2b84085c2	2026-10-10 02:52:53.081161+00
584bddf2-6fe2-40f2-a255-1efb73552b97	1adf46c2-8892-41ea-aa85-e78fe3856a26	2026-10-10 02:52:53.081952+00
584bddf2-6fe2-40f2-a255-1efb73552b97	1a5b6377-8541-4783-a756-0aba034996e1	2026-10-10 02:52:53.082893+00
584bddf2-6fe2-40f2-a255-1efb73552b97	694fb2b9-9929-442a-a7ba-bab6d3087984	2026-10-10 02:52:53.083811+00
584bddf2-6fe2-40f2-a255-1efb73552b97	6109b509-47a4-40c7-acb4-2fe2f96e12dc	2026-10-10 02:52:53.08527+00
584bddf2-6fe2-40f2-a255-1efb73552b97	91d72db3-0e33-4b47-a1c1-b157c18cd02c	2026-10-10 02:52:53.086189+00
584bddf2-6fe2-40f2-a255-1efb73552b97	8e32ca9d-75e5-40a1-a135-3013b64e25a3	2026-10-10 02:52:53.087009+00
584bddf2-6fe2-40f2-a255-1efb73552b97	86efcfd9-80cd-4ba9-a232-ddb491ddc59e	2026-10-10 02:52:53.08833+00
584bddf2-6fe2-40f2-a255-1efb73552b97	4361ae5f-ba13-4e8d-a1a8-c5dd0074a7d4	2026-10-10 02:52:53.089346+00
584bddf2-6fe2-40f2-a255-1efb73552b97	639b6d74-7987-4468-a610-34f1d27bf40d	2026-10-10 02:52:53.090258+00
584bddf2-6fe2-40f2-a255-1efb73552b97	6cab90bb-a2f4-4177-ac1f-46a9d57a129b	2026-10-10 02:52:53.091405+00
584bddf2-6fe2-40f2-a255-1efb73552b97	712bf20d-125a-42f6-a944-b670c0da5f35	2026-10-10 02:52:53.092476+00
584bddf2-6fe2-40f2-a255-1efb73552b97	e6f261ec-ab9b-4789-a549-cbf869797ac1	2026-10-10 02:52:53.093399+00
584bddf2-6fe2-40f2-a255-1efb73552b97	a194d622-e818-4206-a338-f8219586b9a9	2026-10-10 02:52:53.09423+00
584bddf2-6fe2-40f2-a255-1efb73552b97	bf809b05-8864-4864-a174-e9d291c3a6cb	2026-10-10 02:52:53.095049+00
584bddf2-6fe2-40f2-a255-1efb73552b97	fe24c2ee-0b18-4afd-ae4a-27ba4611289c	2026-10-10 02:52:53.095951+00
584bddf2-6fe2-40f2-a255-1efb73552b97	bf1b6a8b-9e8d-459f-8aa9-6d70bfcf54ce	2026-10-10 02:53:08.674465+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	bf1b6a8b-9e8d-459f-8aa9-6d70bfcf54ce	2026-10-10 02:53:08.674465+00
584bddf2-6fe2-40f2-a255-1efb73552b97	46e62117-65b1-4483-bedf-e3ffc292eb99	2026-10-10 02:53:08.674465+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	46e62117-65b1-4483-bedf-e3ffc292eb99	2026-10-10 02:53:08.674465+00
584bddf2-6fe2-40f2-a255-1efb73552b97	31a50568-ecbb-4802-b959-dbede1aecaa1	2026-10-10 02:53:08.674465+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	31a50568-ecbb-4802-b959-dbede1aecaa1	2026-10-10 02:53:08.674465+00
584bddf2-6fe2-40f2-a255-1efb73552b97	917ff0f3-aa19-496e-a75a-00bec7ea5afe	2026-10-10 02:53:08.674465+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	917ff0f3-aa19-496e-a75a-00bec7ea5afe	2026-10-10 02:53:08.674465+00
584bddf2-6fe2-40f2-a255-1efb73552b97	2696cae8-770e-4e70-9f9d-435b48adf15d	2026-10-10 02:53:08.674465+00
584bddf2-6fe2-40f2-a255-1efb73552b97	b028cabe-ff17-4d8e-a0d1-db90cf0cf961	2026-10-10 02:53:08.674465+00
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, code, name, description, created_at, updated_at) FROM stdin;
584bddf2-6fe2-40f2-a255-1efb73552b97	admin	System Administrator	Quản trị hệ thống toàn quyền	2026-10-10 02:52:53.039916+00	2026-10-10 02:52:53.039916+00
e40c5e4d-f1c5-494c-a965-06c54956d1f7	partner	Partner / Exhibitor	Đơn vị xuất bản / Gian hàng đối tác	2026-10-10 02:52:53.039916+00	2026-10-10 02:52:53.039916+00
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (id, key, value, description, updated_at) FROM stdin;
c56818d1-5bf4-4a19-a83a-4092e90fcbb5	public.map	{"venueId": "569210e0-e140-4ece-a8e1-0b67e32a3404", "imageUrl": "/assets/maps/duong-sach-nguyen-van-binh.png"}	Ảnh nền bản đồ công khai trên landing page	2026-10-12 14:06:56.437+00
923d89e2-ebce-4956-afe3-bff275de9914	admin.system	{"general": {"slogan": "Không gian Tri thức & Văn hóa Đọc", "logoUrl": "/assets/logo.png", "systemName": "Đường Sách TP.HCM", "primaryColor": "#059669", "supportEmail": "hotro@duongsach.example.vn", "supportPhone": "028 3822 5555", "physicalAddress": "Đường Nguyễn Văn Bình, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"}, "security": {"twoFactorEnabled": false, "maxFailedAttempts": 5, "minPasswordLength": 8, "requireSpecialChar": true, "sessionTimeoutMinutes": 60}, "notifications": {"dailyDigestEmail": false, "sendWelcomeEmail": true, "notifyRoleChanges": true, "alertOnFailedLogins": true}}	Cấu hình hệ thống quản trị	2026-10-10 04:31:46.12222+00
\.


--
-- Data for Name: site_visits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_visits (id, session_id, day, created_at, last_seen_at) FROM stdin;
9128f50d-6ee9-48d5-af88-3643f98804bc	a22f9274-ff6d-458b-9b78-d113b142b212	2026-10-11	2026-10-11 10:15:00.097+00	2026-10-11 10:16:23.961+00
4b990377-9585-46d6-b65f-7b584fd62ca7	eb93a8c3-7bf1-4de7-8855-5f9750a2661e	2026-10-12	2026-10-12 13:28:57.888+00	2026-10-12 13:29:10.844+00
64de0fe7-f933-4b9e-a36c-35e384de73f7	e50064c0-08e9-42f5-82b7-fef6c6e99752	2026-10-12	2026-10-12 12:34:49.687+00	2026-10-12 14:01:24.938+00
0eeae9e4-8f98-4fd0-9204-0750d3927ddc	666c3ae5-3e04-448b-b527-3763aa92908a	2026-10-12	2026-10-12 13:18:34.843+00	2026-10-12 13:18:34.873+00
ea534979-4bb5-46c3-b945-f045f7d51a20	d732ca37-7c16-451a-9096-564337d0c8f3	2026-10-12	2026-10-12 13:18:34.739+00	2026-10-12 13:18:37.757+00
aac9c73c-59a0-45fa-bb78-eb25d1162fee	69ec0ca1-5827-48dc-a183-a74bce6c5038	2026-10-12	2026-10-12 03:52:53.088+00	2026-10-12 04:24:26.61+00
de39271b-b087-4049-ace8-1fed83f79fa0	8a859115-7531-4535-957f-87cb8f42612f	2026-10-11	2026-10-11 09:56:48.141+00	2026-10-11 10:22:53.727+00
cd4cf1c1-7e66-4b41-b242-26175fea730a	69fb590d-616a-4431-b05c-35b9216e3ee0	2026-10-10	2026-10-10 15:24:55.66+00	2026-10-10 15:51:11.926+00
38b74373-d80e-41c8-af3f-edc6ad724bc4	e0fea3c5-0715-4df4-8d41-547f7a236698	2026-10-11	2026-10-11 13:46:24.846+00	2026-10-11 14:09:10.645+00
a1e6b499-1abf-4cd6-8762-eb1f723a4566	3569cd17-99bd-4103-9aba-1e2fb8eac44d	2026-10-10	2026-10-10 03:48:07.816+00	2026-10-10 03:48:07.816+00
66e77310-e715-4122-9752-8772fa16a1be	f531a620-7f15-46d8-9123-457666d5c8d6	2026-10-10	2026-10-10 04:28:24.312+00	2026-10-10 04:28:24.312+00
2ec86a11-1b6d-441d-b9b4-a7e83a0925f6	7ebc8401-a5fb-4c1f-8388-6cbd639a2475	2026-10-10	2026-10-10 04:43:23.163+00	2026-10-10 04:43:23.163+00
848162bb-05b1-40a9-a57e-d826e3a61e88	b164a5d8-78e5-48c2-b61c-8121b8c777be	2026-10-10	2026-10-10 05:33:31.433+00	2026-10-10 05:33:31.433+00
509c9d78-97f4-4c20-a51f-5ce6de2e46d0	088a9f34-a05e-43d9-bb5a-c3f7fd55dc0a	2026-10-10	2026-10-10 09:17:30.656+00	2026-10-10 09:17:30.656+00
ab361cfa-9a67-4a93-a7a5-abd2c27c22bc	58d57d44-547f-4577-ac2d-7a79eab1802c	2026-10-10	2026-10-10 09:30:14.653+00	2026-10-10 09:30:14.653+00
eac08ee8-dbc4-46a8-920c-0b248bcd48a2	b5a0315b-bee5-4464-879e-1a7cebd82b34	2026-10-10	2026-10-10 09:32:34.138+00	2026-10-10 09:32:34.138+00
f8792818-4043-4235-9acb-43a1efc75856	2bdbd215-97a0-4b4f-9243-e44f1c5f04de	2026-10-10	2026-10-10 10:46:32.809+00	2026-10-10 10:46:32.809+00
2ceadb3f-a29e-4293-8d14-2573ccd15afa	8af5269a-4906-423f-aaa3-cce43573f831	2026-10-10	2026-10-10 15:00:18.859+00	2026-10-10 15:00:18.859+00
9aab6c84-b462-4666-aa58-fc6ffc532f5b	9466bb36-6f26-4b71-a107-ad52e506ec36	2026-10-12	2026-10-12 13:18:39.96+00	2026-10-12 13:18:39.962+00
9af3dbaa-182d-409a-bba1-2d772467a057	5e7d1ddc-d387-4247-b02e-cfe9db65402e	2026-10-10	2026-10-10 15:11:28.864+00	2026-10-10 15:12:15.777+00
2d920f01-9f33-4197-b914-b1d209bf0f2b	d2f6dedc-648c-409f-bc7c-febf4d4fa78d	2026-10-12	2026-10-12 13:18:37.792+00	2026-10-12 13:18:41.393+00
f97f78f6-7c09-4abc-ad1a-7b5c097c69f7	c2f7743d-1d7c-418e-99de-c97a44d25faa	2026-10-12	2026-10-12 13:18:42.127+00	2026-10-12 13:18:42.132+00
81efde7e-85f6-4044-917f-b59c1996cf8a	2be7ee54-74bb-4162-af69-3ad2d24eea65	2026-10-12	2026-10-12 13:18:46.711+00	2026-10-12 13:18:46.755+00
9cae299c-e3bd-4768-9f71-89263a6b458d	a9597a62-e8f8-4343-a80b-05642850da90	2026-10-11	2026-10-11 10:09:16.543+00	2026-10-11 10:29:06.206+00
f6891807-1741-477e-a400-f2c6fe4ed6a8	6c3fd726-c6a3-4243-a42f-74c1589c4fae	2026-10-10	2026-10-10 16:33:42.746+00	2026-10-10 16:34:42.755+00
1887819c-d159-4a45-ad1e-6d763a1a46aa	aa0f639d-9f28-4659-a182-ce8adb0c8dc6	2026-10-12	2026-10-12 07:05:16.663+00	2026-10-12 07:06:12.907+00
b29fa8be-0d3f-4b7e-8f78-33a86190b270	e8fd04ec-533b-4ef4-9916-da5976f59b1c	2026-10-11	2026-10-11 10:35:03.829+00	2026-10-11 10:42:59.003+00
1b1f5183-c3e8-400b-9d68-0e2cadbc9752	d975b55a-6691-4dee-aff6-3047256aa40a	2026-10-10	2026-10-10 14:50:22.256+00	2026-10-10 16:35:21.892+00
69fb7119-c6fc-42c8-b7b2-718484eb6759	3b0dc64c-123c-4437-bad4-2c75ad2d8d14	2026-10-11	2026-10-11 10:53:18.291+00	2026-10-11 10:54:16.525+00
6798cabb-5ff5-4309-b9c2-ce190aa6c9d0	b8937379-a1c7-40e5-9b38-0c8baa793121	2026-10-12	2026-10-12 13:21:10.702+00	2026-10-12 13:21:11.154+00
dd370196-bc9e-42df-90c2-1a90b7d20a94	72803356-4e77-430f-a732-c7bf4ae82701	2026-10-12	2026-10-12 13:21:09.576+00	2026-10-12 13:21:07.729+00
465249ea-4a74-48ae-bec7-21fe0e400494	a1b1c833-cf54-4894-96ea-d6b240a921af	2026-10-12	2026-10-12 13:21:09.577+00	2026-10-12 13:21:09.05+00
2df0a53d-48b8-4845-b6bc-13fee1d83b99	0849e3f2-3483-48b0-a88f-6fa9b100c57e	2026-10-12	2026-10-12 13:21:09.577+00	2026-10-12 13:21:07.777+00
8576d419-0188-4fb1-80da-88678d01e9a4	d061d4fb-6e68-4cfd-9e43-3d76e235e420	2026-10-11	2026-10-11 14:15:06.204+00	2026-10-11 14:15:06.251+00
34006cf4-49c4-4521-a3fb-d667ce96e949	f78607b8-1840-476a-af99-40895218e668	2026-10-12	2026-10-12 13:21:15.046+00	2026-10-12 13:21:15.128+00
80e20a0e-e5ce-48c3-bb8e-7e3c725dcfbf	2b51b513-61ab-4eb1-a295-a735448bc069	2026-10-11	2026-10-11 10:02:17.978+00	2026-10-11 10:05:17.984+00
36fda3ec-e0e9-41b4-8fad-240c4d11535b	8ea69fb0-7378-4a67-a3ae-9fb86266630d	2026-10-12	2026-10-12 13:21:16.728+00	2026-10-12 13:21:16.777+00
9e625b86-2cd3-4daf-b094-5ac0c11864e2	3d18fcf3-478d-4784-b3e4-5afbf677300d	2026-10-11	2026-10-11 10:58:51.066+00	2026-10-11 10:59:51.069+00
148486c2-96e4-444e-a033-304e2e62ea5f	018f20d4-d7d7-4feb-8cfa-cf3e9101c8ec	2026-10-12	2026-10-12 13:21:47.227+00	2026-10-12 13:21:47.272+00
189b3c3d-2c93-4bf3-a724-8f0668e60c15	136a9f7e-c045-498a-91ed-7b84b60ee492	2026-10-11	2026-10-11 13:50:51.325+00	2026-10-11 14:23:54.915+00
ab7c388b-79d1-46bb-b573-15287e6c3727	d28846e1-6d43-4345-b482-bdc3bebe1ce1	2026-10-11	2026-10-11 10:55:02.195+00	2026-10-11 11:04:02.196+00
8f4bf2ca-762e-4f3c-9d2d-86dcf8c758e9	93eb56f3-9cde-4bf4-beba-bcde3a89d661	2026-10-12	2026-10-12 07:00:27.138+00	2026-10-12 08:14:19.318+00
bfd0a454-1c06-4e82-a413-52656520e8e9	c9b6bc1b-4997-4896-8e51-f282c345705d	2026-10-12	2026-10-12 13:21:51.067+00	2026-10-12 13:21:52.068+00
2f2f7294-fd51-43fd-97e5-f95df04bb331	82e327f4-d5a1-44d5-8816-2bf1e0fa93d5	2026-10-11	2026-10-11 13:46:21.804+00	2026-10-11 13:48:18.281+00
5a2f59e7-aa23-4259-ae6f-496d16fbb01f	909011ac-25ce-4b03-bf5c-cfe5ef5d377b	2026-10-12	2026-10-12 13:22:46.901+00	2026-10-12 13:22:46.932+00
271b73bc-8e3e-4b26-9e78-6cffbf7a7513	dc82ce0d-df1a-4500-a857-e9d32739430f	2026-10-12	2026-10-12 13:22:46.813+00	2026-10-12 13:22:50.436+00
19355c96-85d3-4a21-b112-b9082efc8c6e	ea5b38af-510b-47de-b499-bfa4b9697217	2026-10-12	2026-10-12 03:33:19.469+00	2026-10-12 04:05:52.966+00
1bf238da-2e32-4ab3-9cf1-3669b0a170da	28d8830d-a134-4459-b6fd-08d64fe80317	2026-10-12	2026-10-12 13:13:00.028+00	2026-10-12 13:13:02.184+00
838a813e-dcd3-4107-8d56-9b742dd5b209	bf1d5a03-d164-49d0-9963-38dc998368f2	2026-10-12	2026-10-12 13:13:00.615+00	2026-10-12 13:13:00.527+00
bdff02c2-34cc-433f-af85-0a00e6755f15	8338d7fb-16a9-4a78-9975-7f6e7aa51d6c	2026-10-12	2026-10-12 13:22:52.783+00	2026-10-12 13:22:52.786+00
a772df20-6800-4dcf-bd82-74ecb74f3557	c7adb320-6ccd-4b50-86ef-5a80e36b9d9d	2026-10-12	2026-10-12 13:22:50.123+00	2026-10-12 13:22:53.453+00
02ab2991-58bb-413f-8dc8-8a58ffdb10cc	9a61d8cd-abb7-4dc6-a886-2fd817198296	2026-10-12	2026-10-12 13:13:28.48+00	2026-10-12 13:13:28.5+00
183516f5-2274-4ce0-9abe-3c7ea2d05839	ae8e18e9-451c-431e-82cb-0628c3937a2e	2026-10-12	2026-10-12 13:22:55.164+00	2026-10-12 13:22:55.165+00
b8feaa1a-e999-43b5-bdd1-44bbb4b51610	80ae1000-b910-4917-adab-6d4740b6f58c	2026-10-12	2026-10-12 13:13:28.356+00	2026-10-12 13:13:29.871+00
2498fd43-1789-4823-b41d-101a6c8466cb	977e38a2-39e7-4986-a872-1562ceee77b2	2026-10-12	2026-10-12 13:13:42.413+00	2026-10-12 13:13:42.448+00
bd90c68a-b42e-4bf0-8e99-2c246692b5ab	c30aad7c-db35-468f-b2d5-f622a7b2c279	2026-10-12	2026-10-12 13:22:59.393+00	2026-10-12 13:22:59.438+00
ffaad089-d7fc-47e8-91de-a2c10f157ab5	72602cd7-f262-4baf-aad4-8bb51a839736	2026-10-12	2026-10-12 13:14:14.756+00	2026-10-12 13:14:14.803+00
8e4609b1-2abe-403b-b4ff-f91470d57488	625aacbb-7c4c-4752-bf0a-ff62b0ea2649	2026-10-12	2026-10-12 13:25:31.492+00	2026-10-12 13:25:29.631+00
30e088a6-fd52-46ae-9191-6262cd3ec9a0	964a1a21-359b-4658-80c0-d763ef2a5651	2026-10-12	2026-10-12 13:14:17.241+00	2026-10-12 13:14:17.304+00
1a5ea0c2-9917-4df7-9df5-be1c57f92148	4cae4eb9-eb73-4488-9ede-c8c54222b9dd	2026-10-12	2026-10-12 13:25:31.492+00	2026-10-12 13:25:30.886+00
a359febf-a480-4c8c-84e7-ff6b24d875c1	aad19f6f-7374-4926-8b28-a2f40da5b040	2026-10-12	2026-10-12 13:14:21.313+00	2026-10-12 13:14:21.363+00
4702e400-2f3b-4453-a831-ae9fa6fc50ee	11f6b5b2-8016-42f8-8209-e3fc8799687e	2026-10-12	2026-10-12 13:25:31.491+00	2026-10-12 13:25:29.622+00
518126b6-89a4-478b-b0fa-08696d2525d0	abda75cf-1a8c-41a6-ac21-8371d0f2ced9	2026-10-12	2026-10-12 13:25:33.955+00	2026-10-12 13:25:34.019+00
fbe1f576-bfdb-4cc8-ad95-a73934df33e8	b32cc43b-7740-4684-9ff2-e3415192eeda	2026-10-12	2026-10-12 13:25:33.724+00	2026-10-12 13:25:33.414+00
2688e207-e848-49a4-92cc-36d6a00af7f9	961e3967-35f5-483e-8e20-652dd0b7fbcd	2026-10-12	2026-10-12 13:14:23.902+00	2026-10-12 13:14:24.978+00
c7382bc3-0819-4988-b442-9159ccb757d9	aad74321-c42c-4c7d-8403-4601466635f0	2026-10-12	2026-10-12 13:25:36.707+00	2026-10-12 13:25:36.782+00
3bf53964-cccc-499e-a147-dee0a4c90af8	de1557d3-4811-4423-8fbd-94a6aab85489	2026-10-12	2026-10-12 13:28:29.474+00	2026-10-12 13:28:27.635+00
2d9186ef-53be-4281-8b1e-183f2adc404b	a8835419-ac9a-4e03-a8af-68a05f4db8ef	2026-10-12	2026-10-12 13:14:30.38+00	2026-10-12 13:14:30.437+00
7636e0cb-5541-42a2-aef6-568d92436742	03820105-b4be-4789-ae6e-85d18fec0ab6	2026-10-12	2026-10-12 13:14:29.943+00	2026-10-12 13:14:31.694+00
5e66d42b-daf3-457f-ae41-6b57160b0102	346766f0-039d-4f05-8feb-b184d970a5d5	2026-10-12	2026-10-12 13:15:03.01+00	2026-10-12 13:15:03.061+00
7ea9f07d-6476-4679-bbce-7b12fcd20c70	a5b47c6a-baaa-4c58-8060-a89b77463214	2026-10-12	2026-10-12 13:15:18.214+00	2026-10-12 13:15:18.241+00
ca4cf7fe-02dc-4a47-8cbe-98f0f80c2653	074a3e5a-8aa4-43f5-aa1d-f98a5002d949	2026-10-12	2026-10-12 13:15:52.379+00	2026-10-12 13:15:50.576+00
4dc197ec-077d-46d2-93f2-52783ee1405a	b26afd8b-e944-456a-a873-ea29e28a49c4	2026-10-12	2026-10-12 13:15:52.379+00	2026-10-12 13:15:52.166+00
3a41dfde-ce8d-4e99-9627-59db09248ab0	9249cef5-506c-49d9-8a1d-8b84575d3a04	2026-10-12	2026-10-12 13:15:52.445+00	2026-10-12 13:15:54.487+00
f49d8796-2607-4110-9d70-fdb2c347e97d	c8b7d43c-681f-497d-82ea-feb3719a6918	2026-10-12	2026-10-12 13:15:55.731+00	2026-10-12 13:15:56.426+00
944d712c-a103-4778-aff4-59e743b7dd6d	0cfa87f0-865b-43a3-95f0-10f10bb32d83	2026-10-12	2026-10-12 13:16:35.986+00	2026-10-12 13:16:34.17+00
3aa14875-cc15-43c8-ac60-37935ecb9912	8a3b35a2-dd1d-466b-99d6-7479e5ceffb1	2026-10-12	2026-10-12 13:28:29.473+00	2026-10-12 13:28:33.566+00
99621dbe-11ac-4f50-b71a-59509061b858	b2acc44f-7962-45a7-9275-185946d7e9d3	2026-10-12	2026-10-12 13:16:35.986+00	2026-10-12 13:16:38.686+00
f760b26d-b365-40c0-b6fc-3a63943eb5e9	c36c5ebc-48ac-4606-be30-d18b5ffdae14	2026-10-12	2026-10-12 13:28:29.75+00	2026-10-12 13:28:34.39+00
57907550-9f3c-43b0-a249-13241e5ec584	13d48a50-d447-4c06-bc15-24400f2f4903	2026-10-12	2026-10-12 13:16:36.218+00	2026-10-12 13:16:40.741+00
53786eeb-0fc5-44dc-a7b2-83c62a6d10c0	be7ac208-b3ba-4fb7-b7af-0a3ae4c3dc75	2026-10-12	2026-10-12 13:16:42.608+00	2026-10-12 13:16:42.61+00
82d7bada-61ae-4bff-bf05-ab398b7ff7ec	82eef26d-bd15-4b3b-bf97-78c75a2d9808	2026-10-12	2026-10-12 13:16:44.324+00	2026-10-12 13:16:44.328+00
301e3eb6-6cdd-4aab-8960-98a307ba770d	5429a3d0-7733-4e4c-8a09-bb82d2ead36f	2026-10-12	2026-10-12 13:28:36.082+00	2026-10-12 13:28:36.089+00
f99a71d6-0c17-42f3-aead-abcd4b2c15ed	00e6a78e-09a7-44dc-bdbd-8fda4ca136f2	2026-10-12	2026-10-12 13:28:36.793+00	2026-10-12 13:28:36.794+00
5167d115-27d9-4b44-94cc-9bc543b572f0	0048bc38-eb6d-4dcf-8ccc-44baf36c99a4	2026-10-12	2026-10-12 13:16:49.983+00	2026-10-12 13:16:50.713+00
b7d9e55d-097a-45b9-81ab-9bac606b4f9f	be6adeb2-6a0e-48f7-9713-1da04f55c94a	2026-10-12	2026-10-12 13:28:41.562+00	2026-10-12 13:28:41.604+00
ce1632fd-d212-4bd7-9947-73fa0b2ae948	708544e0-7740-41ff-b1c8-49a4db198463	2026-10-12	2026-10-12 13:16:56.322+00	2026-10-12 13:16:56.336+00
cdf9b3ec-3aa2-40ef-ab26-86701f03619d	dbdb7a4b-d3fd-46db-b637-968b9c06375e	2026-10-12	2026-10-12 13:28:41.67+00	2026-10-12 13:28:41.718+00
e14d357c-5c06-44b6-b029-08cff1850e15	f95b7647-478a-487e-bfc4-bf420a55d060	2026-10-12	2026-10-12 13:28:44.991+00	2026-10-12 13:28:45.043+00
72204866-d6fb-4977-9415-fce3b3d507fb	2f71fc3e-f30c-4f96-a7be-63ee53b422f7	2026-10-12	2026-10-12 13:28:47.462+00	2026-10-12 13:28:48.622+00
b1d38e24-4b89-4b7a-aadf-21597dbec8c5	ed8cb4c4-0a1f-40d2-941d-3cb824385f00	2026-10-12	2026-10-12 13:28:53.963+00	2026-10-12 13:28:53.971+00
98f8f20c-aafe-4232-b374-4e1b022c303a	05516f06-30f2-46d3-a04b-ecad835f944e	2026-10-12	2026-10-12 13:28:52.545+00	2026-10-12 13:28:55.586+00
7fecb741-25ac-4853-ad68-2c3a7f0f414b	1970ebe2-c2c0-4d62-aabb-e074929d1d4e	2026-10-12	2026-10-12 13:28:58.766+00	2026-10-12 13:28:58.769+00
b3dc950b-2d9a-4f0d-9718-d3f44686135c	8a9e5a6f-77ab-4f13-9961-415592ef0005	2026-10-12	2026-10-12 13:29:01.25+00	2026-10-12 13:29:01.25+00
273e87c2-d88f-4566-a7a0-5d3e6907fb51	fabe15cc-7666-4ddb-8d02-004b3aca70b0	2026-10-12	2026-10-12 13:29:12.324+00	2026-10-12 13:29:12.387+00
adcd9609-87a2-4eef-a771-e91cddd54086	682bc769-685c-427d-a68b-a0194b9ade21	2026-10-12	2026-10-12 13:29:09.037+00	2026-10-12 13:29:09.085+00
f470ae07-f058-4bfa-b3fb-8fee28797cae	73ed3dee-1eef-4e3f-9c2c-f8fe5b2f3cab	2026-10-12	2026-10-12 13:29:13.417+00	2026-10-12 13:29:13.469+00
f63ccf79-62b4-452f-9458-17663a6ebf77	a170bc1a-a4af-4bd6-850a-27127f0c4532	2026-10-12	2026-10-12 13:29:18.296+00	2026-10-12 13:29:18.859+00
74585d43-1aed-4248-9ecc-381c00ecc6ef	af0418ad-7705-4362-afdd-14d65a7eeae5	2026-10-12	2026-10-12 13:30:20.1+00	2026-10-12 13:30:20.149+00
f745f00f-3892-4b4d-9c94-895bbc7fb927	d0490860-4974-4d7c-88f5-50c47af09a6e	2026-10-12	2026-10-12 13:30:20.172+00	2026-10-12 13:30:20.238+00
708af624-4449-4aa7-ada7-d1bb0e635ac1	d4ce285c-0909-428c-9dfc-61816831b1bc	2026-10-12	2026-10-12 13:30:23.17+00	2026-10-12 13:30:23.221+00
8658853a-db03-4bb4-97b8-bb5fe7608382	1b2e688c-6f09-4809-8539-ca3e71de770d	2026-10-12	2026-10-12 13:30:27.526+00	2026-10-12 13:30:27.569+00
0994cfea-be2f-43df-b1dc-dac741cfeca8	e86287e0-d316-42b9-a830-43feccba1268	2026-10-12	2026-10-12 13:30:30.914+00	2026-10-12 13:30:30.965+00
f8c983b3-7281-4bdd-96ff-79472e76022d	df02357b-d31a-4a1c-8f64-aa04debee9d6	2026-10-12	2026-10-12 13:30:44.596+00	2026-10-12 13:30:44.641+00
f5f0d164-bc87-48f8-92e2-b82aa45bf86a	0f5137f6-2fba-4aed-bf05-4cb15134014c	2026-10-12	2026-10-12 13:31:02.017+00	2026-10-12 13:31:02.054+00
8329483f-2155-47a5-b97f-2c82d533fb25	c7451074-d8e3-47ac-b07b-e09703323f4c	2026-10-12	2026-10-12 13:31:02.106+00	2026-10-12 13:31:02.156+00
615f155f-6e7a-4840-ba10-b35471d1ad60	2f3ab9c5-fbce-4785-b571-8660779d6927	2026-10-12	2026-10-12 13:31:04.893+00	2026-10-12 13:31:04.937+00
d19f0582-04d7-4771-9d53-404a73168562	14c038ab-ae99-4f0c-aab7-a6ed0eb75a0b	2026-10-12	2026-10-12 13:31:06.868+00	2026-10-12 13:31:06.931+00
22e5d090-7ee8-4caa-9421-3fc218e5fa01	2622a30e-4e26-47ee-a968-dfe2ba83b750	2026-10-12	2026-10-12 13:31:08.624+00	2026-10-12 13:31:08.659+00
e3c46d3f-5103-43a7-9b26-210ccd22d744	b3ee8765-0b7a-4ad5-9ab7-e3ceac8aaf9b	2026-10-13	2026-10-13 02:31:41.514+00	2026-10-13 02:39:52.651+00
5307b395-f214-4ce3-b399-3ac35c3493ba	23de8b78-351c-4721-9d5a-a43945fb955c	2026-10-12	2026-10-12 13:31:10.237+00	2026-10-12 13:31:10.289+00
0d73d321-460e-45e8-a982-d2fae2a9d82f	0c7a3fd7-3ae9-4da9-aad3-48deb4491ea1	2026-10-12	2026-10-12 13:36:04.193+00	2026-10-12 13:36:02.328+00
68de10b2-c102-44f9-8fb7-190148193908	32bb4dc6-d83c-4344-89db-a47b1bd0b644	2026-10-12	2026-10-12 13:36:04.193+00	2026-10-12 13:36:08.173+00
a23050be-2dc0-48d4-b598-54746aae10a7	183f37a6-f017-4ef6-a906-9c7fff520dfc	2026-10-12	2026-10-12 13:36:04.401+00	2026-10-12 13:36:08.98+00
c1b82433-1f5d-4034-9721-dd882fb847fe	0eaeeb77-f967-47ee-a31b-d4126e419d0d	2026-10-12	2026-10-12 13:36:10.894+00	2026-10-12 13:36:10.897+00
e2383314-ba3f-49c6-80a7-9d55c82b0444	efa193af-54aa-40c7-bb6a-29761ce94366	2026-10-12	2026-10-12 13:36:11.115+00	2026-10-12 13:36:11.122+00
8589e238-cb3b-4b30-9de2-9a1515acc1ba	477d921e-2d0f-4667-88bd-3c97bfb13e5d	2026-10-12	2026-10-12 13:36:16.011+00	2026-10-12 13:36:16.074+00
50103430-0269-425b-8055-8b3343e08620	bdfae9c2-d619-4db7-916e-d733fd0196a5	2026-10-12	2026-10-12 13:36:16.197+00	2026-10-12 13:36:16.286+00
38d6dde9-8122-4683-9fb0-666ed94aa105	6c4b08d6-9a35-414d-b950-b3735e82756c	2026-10-12	2026-10-12 13:36:18.858+00	2026-10-12 13:36:18.914+00
cc2fc79d-a24f-44be-a84e-02f6ed120451	91c809a9-3a50-4376-9b52-cf367dbb96af	2026-10-13	2026-10-13 02:30:24.772+00	2026-10-13 02:58:49.129+00
3863fadc-6a05-4bf4-8d05-dabeadda4b5e	e15c9da8-ca66-4a1d-a582-0efe0860a97e	2026-10-12	2026-10-12 13:36:20.454+00	2026-10-12 13:36:21.473+00
d1b85051-2b71-4811-a77f-557d0e9aeca0	e5ad21b8-b13b-4f7d-910c-74f4662247b2	2026-10-12	2026-10-12 13:36:27.444+00	2026-10-12 13:36:27.503+00
c736aee3-3bdd-428c-ba44-b85c58dcf971	0233b387-67df-4d9b-a792-f2429ae510f2	2026-10-12	2026-10-12 13:36:26.459+00	2026-10-12 13:36:30.104+00
77f943cd-bddb-498f-add5-f1bab8acee0b	176f7faa-e6e1-41fc-990d-2c9153c1e803	2026-10-13	2026-10-13 03:38:03.182+00	2026-10-13 03:39:54.965+00
5daab306-2328-4677-bd12-20e2adabea2d	8742d2e8-017e-4c29-8ca8-81cf7b8a7899	2026-10-12	2026-10-12 13:36:32.665+00	2026-10-12 13:36:32.666+00
08923322-95dd-4dbd-a01f-49801f037e87	4857b188-97fb-40e7-8ffa-8332595fc5ca	2026-10-12	2026-10-12 13:36:30.702+00	2026-10-12 13:36:34.708+00
1b9b27b3-b76f-4af8-941f-ee65845a82b4	7ef3b7fa-1c70-45c4-8942-9d85d871aee3	2026-10-12	2026-10-12 13:36:35.462+00	2026-10-12 13:36:35.464+00
a6944584-a56d-4dbe-8c80-435e49bbea61	128e8c6c-684c-4029-a894-37eb2b238d9a	2026-10-12	2026-10-12 13:36:40.698+00	2026-10-12 13:36:40.758+00
97552504-4b31-47d2-9829-a2af04231d17	6a717b6a-812c-449e-bbb2-f2811d1f4496	2026-10-12	2026-10-12 13:36:41.055+00	2026-10-12 13:36:41.118+00
8e1983b2-1de0-4c6b-83e4-e14cf35fadcf	77b9705b-9d7b-4426-9788-75fdf6a7f0b1	2026-10-12	2026-10-12 13:36:43.757+00	2026-10-12 13:36:43.847+00
60672d7a-d823-40cd-ab03-d7cb6cc3dc13	a9c38c51-d2a5-453a-b4dc-72ef67567454	2026-10-12	2026-10-12 13:36:46.133+00	2026-10-12 13:36:47.093+00
2fcf3873-3d8d-4f3e-8571-100a74a502a8	e869e4d8-c22f-461e-9695-1a37c8780c23	2026-10-12	2026-10-12 13:52:17.439+00	2026-10-12 13:56:23.658+00
35fa2508-7954-424e-b93a-16618f96b451	faa0ce48-5bab-42fa-83a0-ebf427408f3d	2026-10-13	2026-10-13 03:59:51.648+00	2026-10-13 04:13:51.642+00
330451ab-d3d6-4bf7-87cb-2f94cb0427ff	59b926d8-f914-444b-be0d-4eee62bc564e	2026-10-13	2026-10-13 04:21:38.24+00	2026-10-13 04:21:40.301+00
\.


--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_badges (id, user_id, rule_id, earned_at) FROM stdin;
0011a250-fd00-4dfc-ae8b-34451225e69c	518a7ba0-302a-4463-a113-f0ca5eb94dd7	e909a516-4bac-4835-a8cd-ccc516be3f97	2026-10-09 02:52:59.067998+00
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (user_id, role_id, created_at) FROM stdin;
782f71b1-5350-491a-aaa9-16d54998964f	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 02:52:53.547541+00
e5396e24-6c7b-45c1-a24e-ef63aad57c0f	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 02:52:53.552475+00
7d1be1fc-f868-4402-a1b9-dc90260860dc	584bddf2-6fe2-40f2-a255-1efb73552b97	2026-10-10 02:52:53.555193+00
b9d37b50-942d-430a-a45f-0e303739b400	584bddf2-6fe2-40f2-a255-1efb73552b97	2026-10-10 02:52:53.556857+00
bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 02:52:53.558775+00
a1997704-8ccd-4838-ab09-31be558bf632	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 02:52:53.559537+00
518a7ba0-302a-4463-a113-f0ca5eb94dd7	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 04:08:24.0352+00
33c2a21d-4a71-4820-a171-97df600f78ce	584bddf2-6fe2-40f2-a255-1efb73552b97	2026-10-10 04:08:24.038111+00
7b927425-34c8-480f-ae43-c5b44e602026	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 04:08:24.038891+00
1d646476-a477-4895-ab3b-319e24ce7115	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 04:08:24.039701+00
28b86971-83f1-47de-a8dc-7bf083bfffe8	584bddf2-6fe2-40f2-a255-1efb73552b97	2026-10-10 04:08:24.040492+00
b7e60b7b-fd9b-4c53-a7d6-f2e435c399ac	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 04:08:24.04143+00
ac24ce99-3fd9-47f7-a852-09262fe07c7b	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 04:08:24.042494+00
87427bb9-732b-44b3-aed9-18938ae98fe9	584bddf2-6fe2-40f2-a255-1efb73552b97	2026-10-10 04:08:24.043722+00
6e7e64dc-0aa6-4bba-b597-161177545e12	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 10:54:37.815+00
7025101e-b82c-4def-8629-b18a2121c1ad	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 10:54:37.829+00
92b29826-5af0-4ae3-b24c-729f74ce6f9a	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 10:54:37.839+00
45484fe1-aedd-4dd4-82bb-ce2108ae7551	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 10:54:37.849+00
f89013a9-f11e-44bb-81e5-9e2b4d66fe96	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 10:54:37.857+00
b682e52c-019f-4bf7-a1ef-0d11356f3c82	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 10:54:37.865+00
b961f086-82ff-45b4-a76d-3ec4a626a0b0	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 10:54:37.875+00
129ee2fd-b27f-4a3a-9e56-55e535c62c16	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 10:54:37.882+00
8f97cf46-eff2-4c9c-b30b-e197e17430d4	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 10:54:37.891+00
38e0e59f-cd48-4af5-b715-fbbba143a1de	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 10:54:37.9+00
b743530b-b7f4-498a-8085-238a235af472	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 10:54:37.907+00
eee679c3-fe3f-4035-ba62-e8e38ff0296a	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 10:54:37.948+00
fd18932e-cc91-45cf-832e-fcd4ae7cb93e	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-10 10:54:37.959+00
bb9a1b3a-d697-4f19-af16-81075497b198	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-11 10:19:09.794+00
180526ad-0f27-4d92-b773-a23eafdb5351	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-11 10:21:49.297+00
5fbd98d8-008f-43a5-be13-662db889602e	e40c5e4d-f1c5-494c-a965-06c54956d1f7	2026-10-11 13:50:32.745+00
\.


--
-- Data for Name: user_stall_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_stall_assignments (user_id, stall_id, version) FROM stdin;
bf05d4d3-4e8f-44cc-a3ba-ad22be6c4deb	c5966a62-03fe-4093-ae26-4faa7a102a8b	1
a1997704-8ccd-4838-ab09-31be558bf632	cff5ef63-f6a2-48a9-ae8e-e805566ea654	1
6e7e64dc-0aa6-4bba-b597-161177545e12	e757df4c-4212-4f50-af7f-bb2c38f6a9cf	1
7025101e-b82c-4def-8629-b18a2121c1ad	2291365a-10b9-445c-a44b-ad5f0261d2d1	1
92b29826-5af0-4ae3-b24c-729f74ce6f9a	6388f756-c9b9-4e73-ae58-1d4d078e82be	1
45484fe1-aedd-4dd4-82bb-ce2108ae7551	aa6bd434-33ae-4e7b-aee6-0bfd2e8553c6	1
f89013a9-f11e-44bb-81e5-9e2b4d66fe96	ee1bade5-6dae-44b5-a453-9b670698d819	1
b682e52c-019f-4bf7-a1ef-0d11356f3c82	6d2df04d-8992-4959-a787-6fdbf3c55804	1
b961f086-82ff-45b4-a76d-3ec4a626a0b0	88266c1a-e23b-4235-a1da-7652da4b4639	1
129ee2fd-b27f-4a3a-9e56-55e535c62c16	5b8481d3-dc49-4669-a850-0a21d33d8982	1
8f97cf46-eff2-4c9c-b30b-e197e17430d4	7fc55ea4-e4c7-46f6-ac99-41aa8a149d42	1
38e0e59f-cd48-4af5-b715-fbbba143a1de	035e284f-91e7-4f0a-ae81-a3dc356c7fef	1
b743530b-b7f4-498a-8085-238a235af472	3ceb8da4-e4ba-44aa-a518-707afa32e515	1
eee679c3-fe3f-4035-ba62-e8e38ff0296a	c1110001-dc96-4189-a78e-5485c84f8349	1
fd18932e-cc91-45cf-832e-fcd4ae7cb93e	c2220002-20ad-4073-af91-1ccd7e3987c0	1
\.


--
-- Data for Name: venues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.venues (id, name, facility, capacity, address, is_active, is_deleted, deleted_at, deleted_by, created_at, updated_at) FROM stdin;
569210e0-e140-4ece-a8e1-0b67e32a3404	Đường Sách TP.HCM	Đường Nguyễn Văn Bình, Bến Nghé, Quận 1	3000	Đường Nguyễn Văn Bình, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh	t	f	\N	\N	2026-10-10 02:52:53.985035+00	2026-10-10 02:52:53.985035+00
a1112222-e140-4ece-a8e1-0b67e32a3405	Đường Sách TP. Thủ Đức	Đường Hồ Thị Tư, Hiệp Phú, TP. Thủ Đức	1200	Đường Hồ Thị Tư, Phường Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh	t	f	\N	\N	2026-10-10 02:52:53.985035+00	2026-10-10 02:52:53.985035+00
7da5f224-fb4a-4564-b597-2628b31b1d38	Sân Khấu Đã Xóa 1791602849340	Đường Sách Test	100	\N	t	t	\N	\N	2026-10-10 03:27:29.341+00	2026-10-10 03:27:29.341+00
e35a0720-f7f6-41d2-8660-2cda3c38433b	Sân Khấu Đã Xóa 1791603681546	Đường Sách Test	100	\N	t	t	\N	\N	2026-10-10 03:41:21.547+00	2026-10-10 03:41:21.547+00
20ca0877-e736-403f-bb7f-4472f9e461fd	Sân Khấu Đã Xóa 1791604595958	Đường Sách Test	100	\N	t	t	\N	\N	2026-10-10 03:56:35.96+00	2026-10-10 03:56:35.96+00
fdfb1c18-0c09-4e51-a90a-9c6bcaae6dc4	Sân Khấu Đã Xóa 1791810358384	Đường Sách Test	100	\N	t	t	\N	\N	2026-10-12 13:05:58.385+00	2026-10-12 13:05:58.385+00
8025de82-7df0-4328-a28f-5c7292d2482d	Sân Khấu Đã Xóa 1791810477402	Đường Sách Test	100	\N	t	t	\N	\N	2026-10-12 13:07:57.403+00	2026-10-12 13:07:57.403+00
79978f73-dec7-47aa-b2a2-7bd165250888	guest-2c14ff52-3a94-4976-ae2d-4a13886836a1	guest-2c14ff52-3a94-4976-ae2d-4a13886836a1	10	\N	t	f	\N	\N	2026-10-12 13:13:09.081+00	2026-10-12 13:13:09.081+00
5013d6b0-bc53-4698-9fb0-c93045bcce63	Sân Khấu Đã Xóa 1791810789347	Đường Sách Test	100	\N	t	t	\N	\N	2026-10-12 13:13:09.348+00	2026-10-12 13:13:09.348+00
0b59ab5a-4a20-4add-aa50-d646fc05ee1d	Sân Khấu Đã Xóa 1791811149401	Đường Sách Test	100	\N	t	t	\N	\N	2026-10-12 13:19:09.403+00	2026-10-12 13:19:09.403+00
8f75fd46-8e26-49c5-acd1-0c9a6971252a	Sân Khấu Đã Xóa 1791811712353	Đường Sách Test	100	\N	t	t	\N	\N	2026-10-12 13:28:32.354+00	2026-10-12 13:28:32.354+00
f7ad99e0-7476-4421-ae06-bd4c0838a01b	Sân Khấu Đã Xóa 1791812022187	Đường Sách Test	100	\N	t	t	\N	\N	2026-10-12 13:33:42.188+00	2026-10-12 13:33:42.188+00
\.


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: activity_cancellation_requests activity_cancellation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_cancellation_requests
    ADD CONSTRAINT activity_cancellation_requests_pkey PRIMARY KEY (id);


--
-- Name: activity_change_requests activity_change_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_change_requests
    ADD CONSTRAINT activity_change_requests_pkey PRIMARY KEY (id);


--
-- Name: activity_proposals activity_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_proposals
    ADD CONSTRAINT activity_proposals_pkey PRIMARY KEY (id);


--
-- Name: activity_ratings activity_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_ratings
    ADD CONSTRAINT activity_ratings_pkey PRIMARY KEY (id);


--
-- Name: activity_registrations activity_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_registrations
    ADD CONSTRAINT activity_registrations_pkey PRIMARY KEY (id);


--
-- Name: activity_reviews activity_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_reviews
    ADD CONSTRAINT activity_reviews_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: attendance_sessions attendance_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_sessions
    ADD CONSTRAINT attendance_sessions_pkey PRIMARY KEY (id);


--
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: badge_rules badge_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_rules
    ADD CONSTRAINT badge_rules_pkey PRIMARY KEY (id);


--
-- Name: book_categories book_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_pkey PRIMARY KEY (id);


--
-- Name: book_label_assignments book_label_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_label_assignments
    ADD CONSTRAINT book_label_assignments_pkey PRIMARY KEY (book_id, label_id);


--
-- Name: book_labels book_labels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_labels
    ADD CONSTRAINT book_labels_pkey PRIMARY KEY (id);


--
-- Name: book_rankings book_rankings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_rankings
    ADD CONSTRAINT book_rankings_pkey PRIMARY KEY (id);


--
-- Name: book_rankings book_rankings_type_book_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_rankings
    ADD CONSTRAINT book_rankings_type_book_key UNIQUE (ranking_type, book_id);


--
-- Name: book_rankings book_rankings_type_rank_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_rankings
    ADD CONSTRAINT book_rankings_type_rank_key UNIQUE (ranking_type, rank);


--
-- Name: book_sales book_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_sales
    ADD CONSTRAINT book_sales_pkey PRIMARY KEY (id);


--
-- Name: book_stalls book_stalls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_stalls
    ADD CONSTRAINT book_stalls_pkey PRIMARY KEY (id);


--
-- Name: book_submissions book_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_submissions
    ADD CONSTRAINT book_submissions_pkey PRIMARY KEY (id);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: booth_assignments booth_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_assignments
    ADD CONSTRAINT booth_assignments_pkey PRIMARY KEY (id);


--
-- Name: booth_cancellation_requests booth_cancellation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_cancellation_requests
    ADD CONSTRAINT booth_cancellation_requests_pkey PRIMARY KEY (id);


--
-- Name: booth_change_requests booth_change_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_change_requests
    ADD CONSTRAINT booth_change_requests_pkey PRIMARY KEY (id);


--
-- Name: booth_holds booth_holds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_holds
    ADD CONSTRAINT booth_holds_pkey PRIMARY KEY (id);


--
-- Name: booth_requests booth_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_requests
    ADD CONSTRAINT booth_requests_pkey PRIMARY KEY (id);


--
-- Name: booth_visits booth_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_visits
    ADD CONSTRAINT booth_visits_pkey PRIMARY KEY (id);


--
-- Name: booths booths_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booths
    ADD CONSTRAINT booths_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: content_entries content_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_entries
    ADD CONSTRAINT content_entries_pkey PRIMARY KEY (id);


--
-- Name: event_locations event_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_locations
    ADD CONSTRAINT event_locations_pkey PRIMARY KEY (event_id, location_id);


--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);


--
-- Name: event_settings event_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_settings
    ADD CONSTRAINT event_settings_pkey PRIMARY KEY (event_id);


--
-- Name: event_suggestions event_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_suggestions
    ADD CONSTRAINT event_suggestions_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: feedbacks feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_pkey PRIMARY KEY (id);


--
-- Name: heritage_qr_codes heritage_qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heritage_qr_codes
    ADD CONSTRAINT heritage_qr_codes_pkey PRIMARY KEY (id);


--
-- Name: heritages heritages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heritages
    ADD CONSTRAINT heritages_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: map_hotspots map_hotspots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.map_hotspots
    ADD CONSTRAINT map_hotspots_pkey PRIMARY KEY (id);


--
-- Name: news_article_reads news_article_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_article_reads
    ADD CONSTRAINT news_article_reads_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organization_members organization_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: partner_applications partner_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_applications
    ADD CONSTRAINT partner_applications_pkey PRIMARY KEY (id);


--
-- Name: partner_withdrawals partner_withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_withdrawals
    ADD CONSTRAINT partner_withdrawals_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: point_transactions point_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT point_transactions_pkey PRIMARY KEY (id);


--
-- Name: proposal_devices proposal_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_devices
    ADD CONSTRAINT proposal_devices_pkey PRIMARY KEY (id);


--
-- Name: public_event_registrations public_event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_event_registrations
    ADD CONSTRAINT public_event_registrations_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: site_visits site_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_visits
    ADD CONSTRAINT site_visits_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: user_stall_assignments user_stall_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_stall_assignments
    ADD CONSTRAINT user_stall_assignments_pkey PRIMARY KEY (user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);


--
-- Name: activities_qr_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX activities_qr_token_key ON public.activities USING btree (qr_token);


--
-- Name: activity_ratings_registration_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX activity_ratings_registration_id_key ON public.activity_ratings USING btree (registration_id);


--
-- Name: activity_registrations_qr_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX activity_registrations_qr_token_key ON public.activity_registrations USING btree (qr_token);


--
-- Name: activity_registrations_registration_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX activity_registrations_registration_code_key ON public.activity_registrations USING btree (registration_code);


--
-- Name: attendances_registration_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX attendances_registration_id_key ON public.attendances USING btree (registration_id);


--
-- Name: badge_rules_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX badge_rules_code_key ON public.badge_rules USING btree (code);


--
-- Name: book_categories_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX book_categories_name_key ON public.book_categories USING btree (name);


--
-- Name: book_labels_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX book_labels_name_key ON public.book_labels USING btree (name);


--
-- Name: book_rankings_type_rank_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX book_rankings_type_rank_idx ON public.book_rankings USING btree (ranking_type, rank);


--
-- Name: book_sales_booth_id_sold_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX book_sales_booth_id_sold_date_idx ON public.book_sales USING btree (booth_id, sold_date);


--
-- Name: book_stalls_book_id_stall_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX book_stalls_book_id_stall_id_key ON public.book_stalls USING btree (book_id, stall_id);


--
-- Name: book_submissions_stall_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX book_submissions_stall_id_status_idx ON public.book_submissions USING btree (stall_id, status);


--
-- Name: books_isbn_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX books_isbn_key ON public.books USING btree (isbn);


--
-- Name: booth_assignments_qr_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX booth_assignments_qr_token_key ON public.booth_assignments USING btree (qr_token);


--
-- Name: booth_assignments_source_hold_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX booth_assignments_source_hold_id_key ON public.booth_assignments USING btree (source_hold_id);


--
-- Name: booth_change_requests_replacement_hold_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX booth_change_requests_replacement_hold_id_key ON public.booth_change_requests USING btree (replacement_hold_id);


--
-- Name: booth_change_requests_result_assignment_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX booth_change_requests_result_assignment_id_key ON public.booth_change_requests USING btree (result_assignment_id);


--
-- Name: booth_visits_event_registration_id_booth_assignment_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX booth_visits_event_registration_id_booth_assignment_id_key ON public.booth_visits USING btree (event_registration_id, booth_assignment_id);


--
-- Name: booths_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX booths_code_key ON public.booths USING btree (code);


--
-- Name: booths_location_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX booths_location_id_key ON public.booths USING btree (location_id);


--
-- Name: certificates_attendance_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX certificates_attendance_id_key ON public.certificates USING btree (attendance_id);


--
-- Name: certificates_certificate_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX certificates_certificate_code_key ON public.certificates USING btree (certificate_code);


--
-- Name: certificates_registration_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX certificates_registration_id_key ON public.certificates USING btree (registration_id);


--
-- Name: content_entries_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX content_entries_slug_key ON public.content_entries USING btree (slug);


--
-- Name: event_registrations_event_id_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX event_registrations_event_id_user_id_key ON public.event_registrations USING btree (event_id, user_id);


--
-- Name: events_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX events_slug_key ON public.events USING btree (slug);


--
-- Name: feedbacks_event_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feedbacks_event_id_created_at_idx ON public.feedbacks USING btree (event_id, created_at DESC);


--
-- Name: heritages_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX heritages_code_key ON public.heritages USING btree (code);


--
-- Name: heritages_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX heritages_slug_key ON public.heritages USING btree (slug);


--
-- Name: locations_venue_id_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX locations_venue_id_code_key ON public.locations USING btree (venue_id, code);


--
-- Name: map_hotspots_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX map_hotspots_code_key ON public.map_hotspots USING btree (code);


--
-- Name: news_article_reads_content_entry_id_article_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX news_article_reads_content_entry_id_article_id_idx ON public.news_article_reads USING btree (content_entry_id, article_id);


--
-- Name: news_article_reads_content_entry_id_article_id_session_id_day_k; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX news_article_reads_content_entry_id_article_id_session_id_day_k ON public.news_article_reads USING btree (content_entry_id, article_id, session_id, day);


--
-- Name: news_article_reads_day_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX news_article_reads_day_idx ON public.news_article_reads USING btree (day);


--
-- Name: organization_members_organization_id_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX organization_members_organization_id_user_id_key ON public.organization_members USING btree (organization_id, user_id);


--
-- Name: partner_applications_event_id_organization_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX partner_applications_event_id_organization_id_key ON public.partner_applications USING btree (event_id, organization_id);


--
-- Name: password_resets_token_hash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX password_resets_token_hash_key ON public.password_resets USING btree (token_hash);


--
-- Name: permissions_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_code_key ON public.permissions USING btree (code);


--
-- Name: point_transactions_booth_visit_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX point_transactions_booth_visit_id_key ON public.point_transactions USING btree (booth_visit_id);


--
-- Name: point_transactions_registration_id_reason_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX point_transactions_registration_id_reason_key ON public.point_transactions USING btree (registration_id, reason);


--
-- Name: public_event_registrations_event_id_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX public_event_registrations_event_id_email_key ON public.public_event_registrations USING btree (event_id, email);


--
-- Name: public_event_registrations_registration_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX public_event_registrations_registration_code_key ON public.public_event_registrations USING btree (registration_code);


--
-- Name: refresh_tokens_token_hash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX refresh_tokens_token_hash_key ON public.refresh_tokens USING btree (token_hash);


--
-- Name: roles_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_code_key ON public.roles USING btree (code);


--
-- Name: settings_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX settings_key_key ON public.settings USING btree (key);


--
-- Name: site_visits_day_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_visits_day_idx ON public.site_visits USING btree (day);


--
-- Name: site_visits_last_seen_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX site_visits_last_seen_at_idx ON public.site_visits USING btree (last_seen_at);


--
-- Name: site_visits_session_id_day_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX site_visits_session_id_day_key ON public.site_visits USING btree (session_id, day);


--
-- Name: user_badges_user_id_rule_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_badges_user_id_rule_id_key ON public.user_badges USING btree (user_id, rule_id);


--
-- Name: user_stall_assignments_stall_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_stall_assignments_stall_id_key ON public.user_stall_assignments USING btree (stall_id);


--
-- Name: users_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_code_key ON public.users USING btree (code);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: venues_name_facility_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX venues_name_facility_key ON public.venues USING btree (name, facility);


--
-- Name: activities activities_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activities activities_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activities activities_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.activity_proposals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_cancellation_requests activity_cancellation_requests_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_cancellation_requests
    ADD CONSTRAINT activity_cancellation_requests_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activity_cancellation_requests activity_cancellation_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_cancellation_requests
    ADD CONSTRAINT activity_cancellation_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_cancellation_requests activity_cancellation_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_cancellation_requests
    ADD CONSTRAINT activity_cancellation_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_change_requests activity_change_requests_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_change_requests
    ADD CONSTRAINT activity_change_requests_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activity_change_requests activity_change_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_change_requests
    ADD CONSTRAINT activity_change_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_change_requests activity_change_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_change_requests
    ADD CONSTRAINT activity_change_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_change_requests activity_change_requests_target_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_change_requests
    ADD CONSTRAINT activity_change_requests_target_location_id_fkey FOREIGN KEY (target_location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_proposals activity_proposals_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_proposals
    ADD CONSTRAINT activity_proposals_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activity_proposals activity_proposals_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_proposals
    ADD CONSTRAINT activity_proposals_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activity_proposals activity_proposals_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_proposals
    ADD CONSTRAINT activity_proposals_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activity_ratings activity_ratings_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_ratings
    ADD CONSTRAINT activity_ratings_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activity_ratings activity_ratings_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_ratings
    ADD CONSTRAINT activity_ratings_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.activity_registrations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activity_ratings activity_ratings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_ratings
    ADD CONSTRAINT activity_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activity_registrations activity_registrations_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_registrations
    ADD CONSTRAINT activity_registrations_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activity_registrations activity_registrations_event_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_registrations
    ADD CONSTRAINT activity_registrations_event_registration_id_fkey FOREIGN KEY (event_registration_id) REFERENCES public.event_registrations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activity_registrations activity_registrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_registrations
    ADD CONSTRAINT activity_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activity_reviews activity_reviews_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_reviews
    ADD CONSTRAINT activity_reviews_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.activity_proposals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: activity_reviews activity_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_reviews
    ADD CONSTRAINT activity_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendance_sessions attendance_sessions_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_sessions
    ADD CONSTRAINT attendance_sessions_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendance_sessions attendance_sessions_override_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_sessions
    ADD CONSTRAINT attendance_sessions_override_by_fkey FOREIGN KEY (override_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendance_sessions attendance_sessions_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_sessions
    ADD CONSTRAINT attendance_sessions_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.activity_registrations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendance_sessions attendance_sessions_scanned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_sessions
    ADD CONSTRAINT attendance_sessions_scanned_by_fkey FOREIGN KEY (scanned_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendance_sessions attendance_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_sessions
    ADD CONSTRAINT attendance_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendances attendances_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendances attendances_overridden_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_overridden_by_fkey FOREIGN KEY (overridden_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendances attendances_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.activity_registrations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendances attendances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: book_label_assignments book_label_assignments_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_label_assignments
    ADD CONSTRAINT book_label_assignments_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: book_label_assignments book_label_assignments_label_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_label_assignments
    ADD CONSTRAINT book_label_assignments_label_id_fkey FOREIGN KEY (label_id) REFERENCES public.book_labels(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: book_rankings book_rankings_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_rankings
    ADD CONSTRAINT book_rankings_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_rankings book_rankings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_rankings
    ADD CONSTRAINT book_rankings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: book_sales book_sales_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_sales
    ADD CONSTRAINT book_sales_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: book_sales book_sales_booth_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_sales
    ADD CONSTRAINT book_sales_booth_id_fkey FOREIGN KEY (booth_id) REFERENCES public.booths(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: book_stalls book_stalls_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_stalls
    ADD CONSTRAINT book_stalls_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: book_stalls book_stalls_stall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_stalls
    ADD CONSTRAINT book_stalls_stall_id_fkey FOREIGN KEY (stall_id) REFERENCES public.booths(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: book_submissions book_submissions_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_submissions
    ADD CONSTRAINT book_submissions_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: book_submissions book_submissions_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_submissions
    ADD CONSTRAINT book_submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: book_submissions book_submissions_stall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_submissions
    ADD CONSTRAINT book_submissions_stall_id_fkey FOREIGN KEY (stall_id) REFERENCES public.booths(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: book_submissions book_submissions_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.book_submissions
    ADD CONSTRAINT book_submissions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: books books_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.book_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: booth_assignments booth_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_assignments
    ADD CONSTRAINT booth_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: booth_assignments booth_assignments_booth_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_assignments
    ADD CONSTRAINT booth_assignments_booth_id_fkey FOREIGN KEY (booth_id) REFERENCES public.booths(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_assignments booth_assignments_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_assignments
    ADD CONSTRAINT booth_assignments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_assignments booth_assignments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_assignments
    ADD CONSTRAINT booth_assignments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_assignments booth_assignments_source_hold_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_assignments
    ADD CONSTRAINT booth_assignments_source_hold_id_fkey FOREIGN KEY (source_hold_id) REFERENCES public.booth_holds(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: booth_cancellation_requests booth_cancellation_requests_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_cancellation_requests
    ADD CONSTRAINT booth_cancellation_requests_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.booth_assignments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_cancellation_requests booth_cancellation_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_cancellation_requests
    ADD CONSTRAINT booth_cancellation_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_cancellation_requests booth_cancellation_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_cancellation_requests
    ADD CONSTRAINT booth_cancellation_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: booth_change_requests booth_change_requests_current_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_change_requests
    ADD CONSTRAINT booth_change_requests_current_assignment_id_fkey FOREIGN KEY (current_assignment_id) REFERENCES public.booth_assignments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_change_requests booth_change_requests_replacement_hold_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_change_requests
    ADD CONSTRAINT booth_change_requests_replacement_hold_id_fkey FOREIGN KEY (replacement_hold_id) REFERENCES public.booth_holds(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: booth_change_requests booth_change_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_change_requests
    ADD CONSTRAINT booth_change_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_change_requests booth_change_requests_result_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_change_requests
    ADD CONSTRAINT booth_change_requests_result_assignment_id_fkey FOREIGN KEY (result_assignment_id) REFERENCES public.booth_assignments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: booth_change_requests booth_change_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_change_requests
    ADD CONSTRAINT booth_change_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: booth_change_requests booth_change_requests_target_booth_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_change_requests
    ADD CONSTRAINT booth_change_requests_target_booth_id_fkey FOREIGN KEY (target_booth_id) REFERENCES public.booths(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_holds booth_holds_booth_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_holds
    ADD CONSTRAINT booth_holds_booth_id_fkey FOREIGN KEY (booth_id) REFERENCES public.booths(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_holds booth_holds_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_holds
    ADD CONSTRAINT booth_holds_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_requests booth_requests_booth_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_requests
    ADD CONSTRAINT booth_requests_booth_id_fkey FOREIGN KEY (booth_id) REFERENCES public.booths(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_requests booth_requests_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_requests
    ADD CONSTRAINT booth_requests_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_requests booth_requests_hold_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_requests
    ADD CONSTRAINT booth_requests_hold_id_fkey FOREIGN KEY (hold_id) REFERENCES public.booth_holds(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: booth_requests booth_requests_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_requests
    ADD CONSTRAINT booth_requests_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_requests booth_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_requests
    ADD CONSTRAINT booth_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: booth_visits booth_visits_booth_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_visits
    ADD CONSTRAINT booth_visits_booth_assignment_id_fkey FOREIGN KEY (booth_assignment_id) REFERENCES public.booth_assignments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_visits booth_visits_event_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_visits
    ADD CONSTRAINT booth_visits_event_registration_id_fkey FOREIGN KEY (event_registration_id) REFERENCES public.event_registrations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booth_visits booth_visits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booth_visits
    ADD CONSTRAINT booth_visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booths booths_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booths
    ADD CONSTRAINT booths_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: certificates certificates_attendance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_attendance_id_fkey FOREIGN KEY (attendance_id) REFERENCES public.attendances(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: certificates certificates_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.activity_registrations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: certificates certificates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: event_locations event_locations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_locations
    ADD CONSTRAINT event_locations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_locations event_locations_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_locations
    ADD CONSTRAINT event_locations_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: event_registrations event_registrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: event_settings event_settings_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_settings
    ADD CONSTRAINT event_settings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: events events_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: feedbacks feedbacks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: feedbacks feedbacks_booth_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_booth_id_fkey FOREIGN KEY (booth_id) REFERENCES public.booths(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: feedbacks feedbacks_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: feedbacks feedbacks_heritage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_heritage_id_fkey FOREIGN KEY (heritage_id) REFERENCES public.heritages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: heritage_qr_codes heritage_qr_codes_heritage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heritage_qr_codes
    ADD CONSTRAINT heritage_qr_codes_heritage_id_fkey FOREIGN KEY (heritage_id) REFERENCES public.heritages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: locations locations_venue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: news_article_reads news_article_reads_content_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_article_reads
    ADD CONSTRAINT news_article_reads_content_entry_id_fkey FOREIGN KEY (content_entry_id) REFERENCES public.content_entries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_members organization_members_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_members organization_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: partner_applications partner_applications_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_applications
    ADD CONSTRAINT partner_applications_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: partner_applications partner_applications_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_applications
    ADD CONSTRAINT partner_applications_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: partner_applications partner_applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_applications
    ADD CONSTRAINT partner_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: partner_withdrawals partner_withdrawals_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_withdrawals
    ADD CONSTRAINT partner_withdrawals_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.partner_applications(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: partner_withdrawals partner_withdrawals_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_withdrawals
    ADD CONSTRAINT partner_withdrawals_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: partner_withdrawals partner_withdrawals_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_withdrawals
    ADD CONSTRAINT partner_withdrawals_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: partner_withdrawals partner_withdrawals_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_withdrawals
    ADD CONSTRAINT partner_withdrawals_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: partner_withdrawals partner_withdrawals_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_withdrawals
    ADD CONSTRAINT partner_withdrawals_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: point_transactions point_transactions_booth_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT point_transactions_booth_visit_id_fkey FOREIGN KEY (booth_visit_id) REFERENCES public.booth_visits(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: point_transactions point_transactions_registration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT point_transactions_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.activity_registrations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: point_transactions point_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_transactions
    ADD CONSTRAINT point_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: proposal_devices proposal_devices_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_devices
    ADD CONSTRAINT proposal_devices_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: proposal_devices proposal_devices_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_devices
    ADD CONSTRAINT proposal_devices_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.activity_proposals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: public_event_registrations public_event_registrations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_event_registrations
    ADD CONSTRAINT public_event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_badges user_badges_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.badge_rules(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_stall_assignments user_stall_assignments_stall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_stall_assignments
    ADD CONSTRAINT user_stall_assignments_stall_id_fkey FOREIGN KEY (stall_id) REFERENCES public.booths(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_stall_assignments user_stall_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_stall_assignments
    ADD CONSTRAINT user_stall_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict h6TZnf1Ia2ocs5tr0HP666EZDBMrw8ST0mhuWYrNclHYDl8PjQBMZmh02MDhVap

