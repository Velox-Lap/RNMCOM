-- Remove inherited anonymous and PUBLIC privileges; preserve authenticated grants and RLS.
revoke all on schema public from public, anon;
revoke all on all tables in schema public from public, anon;
revoke all on all sequences in schema public from public, anon;
grant usage on schema public to authenticated;
grant select, insert, update on
  public.profiles, public.user_roles, public.classes, public.students, public.teachers,
  public.subjects, public.teaching_assignments, public.enrollments, public.student_guardians,
  public.attendance_sessions, public.attendance_records, public.assignments, public.submissions,
  public.grades, public.announcements, public.notifications, public.leave_requests,
  public.fee_invoices, public.merit_points, public.student_support_cases, public.audit_logs
to authenticated;
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public revoke all on tables from public, anon;
alter default privileges in schema public revoke all on sequences from public, anon;
