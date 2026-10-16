INSERT INTO public_event_registrations (event_id, full_name, email, phone, attendees_count, registration_code, notes, created_at)
SELECT e.id, a.after_data->>'fullName', lower(trim(a.after_data->>'email')), a.after_data->>'phone',
  CASE WHEN (a.after_data->>'attendeesCount') ~ '^[0-9]+$'
    THEN GREATEST(1, LEAST(2147483647, (a.after_data->>'attendeesCount')::numeric))::integer ELSE 1 END,
  COALESCE(NULLIF(a.after_data->>'registrationCode', ''), 'EVT-' || a.id::text), a.after_data->>'notes', a.created_at
FROM audit_logs a JOIN events e ON e.id = a.target_id
WHERE a.action = 'event_registration'
  AND COALESCE(a.after_data->>'fullName', '') <> ''
  AND COALESCE(a.after_data->>'phone', '') <> ''
  AND COALESCE(a.after_data->>'email', '') LIKE '%@%'
ORDER BY a.created_at
ON CONFLICT DO NOTHING;
