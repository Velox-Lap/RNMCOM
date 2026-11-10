-- RNMCOM performance and policy cleanup.
-- Keep administrator write access without duplicating permissive SELECT policies.

drop policy if exists "classes_admin_manage" on public.classes;
create policy "classes_admin_insert" on public.classes for insert to authenticated with check (private.has_role('admin'));
create policy "classes_admin_update" on public.classes for update to authenticated using (private.has_role('admin')) with check (private.has_role('admin'));

drop policy if exists "enrollments_admin_manage" on public.enrollments;
create policy "enrollments_admin_insert" on public.enrollments for insert to authenticated with check (private.has_role('admin'));
create policy "enrollments_admin_update" on public.enrollments for update to authenticated using (private.has_role('admin')) with check (private.has_role('admin'));

drop policy if exists "fee_invoices_admin_manage" on public.fee_invoices;
create policy "fee_invoices_admin_insert" on public.fee_invoices for insert to authenticated with check (private.has_role('admin'));
create policy "fee_invoices_admin_update" on public.fee_invoices for update to authenticated using (private.has_role('admin')) with check (private.has_role('admin'));

drop policy if exists "guardians_admin_manage" on public.student_guardians;
create policy "guardians_admin_insert" on public.student_guardians for insert to authenticated with check (private.has_role('admin'));
create policy "guardians_admin_update" on public.student_guardians for update to authenticated using (private.has_role('admin')) with check (private.has_role('admin'));

drop policy if exists "subjects_admin_manage" on public.subjects;
create policy "subjects_admin_insert" on public.subjects for insert to authenticated with check (private.has_role('admin'));
create policy "subjects_admin_update" on public.subjects for update to authenticated using (private.has_role('admin')) with check (private.has_role('admin'));

drop policy if exists "teachers_admin_manage" on public.teachers;
create policy "teachers_admin_insert" on public.teachers for insert to authenticated with check (private.has_role('admin'));
create policy "teachers_admin_update" on public.teachers for update to authenticated using (private.has_role('admin')) with check (private.has_role('admin'));

drop policy if exists "teaching_assignments_admin_manage" on public.teaching_assignments;
create policy "teaching_assignments_admin_insert" on public.teaching_assignments for insert to authenticated with check (private.has_role('admin'));
create policy "teaching_assignments_admin_update" on public.teaching_assignments for update to authenticated using (private.has_role('admin')) with check (private.has_role('admin'));

create index if not exists announcements_author_id_idx on public.announcements(author_id);
create index if not exists assignments_subject_id_idx on public.assignments(subject_id);
create index if not exists attendance_records_recorded_by_idx on public.attendance_records(recorded_by);
create index if not exists attendance_sessions_subject_id_idx on public.attendance_sessions(subject_id);
create index if not exists attendance_sessions_teacher_id_idx on public.attendance_sessions(teacher_id);
create index if not exists classes_homeroom_teacher_id_idx on public.classes(homeroom_teacher_id);
create index if not exists fee_invoices_student_id_idx on public.fee_invoices(student_id);
create index if not exists grades_recorded_by_idx on public.grades(recorded_by);
create index if not exists grades_subject_id_idx on public.grades(subject_id);
create index if not exists leave_requests_requested_by_idx on public.leave_requests(requested_by);
create index if not exists leave_requests_reviewed_by_idx on public.leave_requests(reviewed_by);
create index if not exists leave_requests_student_id_idx on public.leave_requests(student_id);
create index if not exists merit_points_recorded_by_idx on public.merit_points(recorded_by);
create index if not exists merit_points_student_id_idx on public.merit_points(student_id);
create index if not exists student_support_cases_owner_id_idx on public.student_support_cases(owner_id);
create index if not exists student_support_cases_student_id_idx on public.student_support_cases(student_id);
create index if not exists submissions_student_id_idx on public.submissions(student_id);
create index if not exists teaching_assignments_class_id_idx on public.teaching_assignments(class_id);
create index if not exists teaching_assignments_subject_id_idx on public.teaching_assignments(subject_id);
