-- RNMCOM initial database schema
-- Apply once to a new Supabase project. All exposed application tables use RLS.
-- Auth roles are stored in user_roles; user-editable user_metadata is never used for authorization.

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;

create type public.app_role as enum ('admin', 'teacher', 'homeroom_teacher', 'student', 'parent');
create type public.attendance_status as enum ('present', 'absent', 'late', 'leave');
create type public.assignment_status as enum ('draft', 'published', 'closed');
create type public.submission_status as enum ('submitted', 'late', 'grading', 'graded', 'returned');
create type public.approval_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
create unique index user_roles_single_primary_idx on public.user_roles(user_id) where is_primary;

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade_level text not null,
  academic_year text not null,
  homeroom_teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (name, academic_year)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete restrict,
  student_code text not null unique,
  first_name text not null,
  last_name text not null,
  grade_level text not null,
  class_id uuid references public.classes(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'inactive', 'graduated', 'transferred')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index students_class_id_idx on public.students(class_id);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  employee_code text unique,
  department text,
  title text,
  created_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  grade_level text,
  created_at timestamptz not null default now()
);

create table public.teaching_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  academic_year text not null,
  term text not null,
  created_at timestamptz not null default now(),
  unique (teacher_id, class_id, subject_id, academic_year, term)
);
create index teaching_assignments_teacher_class_idx on public.teaching_assignments(teacher_id, class_id);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete restrict,
  academic_year text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'withdrawn')),
  created_at timestamptz not null default now(),
  unique (student_id, academic_year)
);
create index enrollments_class_year_idx on public.enrollments(class_id, academic_year);

create table public.student_guardians (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  guardian_user_id uuid not null references public.profiles(id) on delete cascade,
  relationship text not null default 'guardian',
  can_view_profile boolean not null default true,
  can_view_attendance boolean not null default true,
  can_view_academic boolean not null default true,
  can_view_finance boolean not null default false,
  created_at timestamptz not null default now(),
  unique (student_id, guardian_user_id)
);
create index student_guardians_guardian_idx on public.student_guardians(guardian_user_id, student_id);

create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  subject_id uuid references public.subjects(id) on delete set null,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  session_date date not null default current_date,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  qr_token_hash text,
  created_at timestamptz not null default now()
);
create index attendance_sessions_class_date_idx on public.attendance_sessions(class_id, session_date);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status public.attendance_status not null,
  note text,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);
create index attendance_records_student_idx on public.attendance_records(student_id, recorded_at desc);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  due_at timestamptz not null,
  status public.assignment_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assignments_class_due_idx on public.assignments(class_id, due_at);
create index assignments_teacher_created_idx on public.assignments(teacher_id, created_at desc);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  submission_text text not null default '',
  file_path text,
  submitted_at timestamptz not null default now(),
  status public.submission_status not null default 'submitted',
  feedback text,
  graded_at timestamptz,
  unique (assignment_id, student_id)
);
create index submissions_assignment_status_idx on public.submissions(assignment_id, status);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  academic_year text not null,
  term text not null,
  score numeric(7,2) not null check (score >= 0),
  max_score numeric(7,2) not null check (max_score > 0 and score <= max_score),
  letter_grade text,
  feedback text,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, subject_id, academic_year, term)
);
create index grades_student_term_idx on public.grades(student_id, academic_year, term);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience public.app_role[] not null default array['admin','teacher','homeroom_teacher','student','parent']::public.app_role[],
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  author_id uuid not null references public.profiles(id) on delete restrict,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index announcements_published_idx on public.announcements(published_at desc) where status = 'published';

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  category text not null default 'general',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  reason text not null,
  start_date date not null,
  end_date date not null,
  status public.approval_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.fee_invoices (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  invoice_number text not null unique,
  description text not null,
  amount numeric(10,2) not null check (amount >= 0),
  due_date date not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.merit_points (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  points integer not null,
  reason text not null,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- Sensitive student-support notes are deliberately restricted to administrators and the
-- student's designated homeroom teacher; they are not visible to students or guardians.
create table public.student_support_cases (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  category text not null,
  summary text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs(created_at desc);
create index audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);

-- Create a display profile when an Auth user is created. No role is copied from user_metadata.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();

-- Narrow helper functions: SECURITY DEFINER is used only to avoid recursive RLS lookups.
-- They accept no caller-selected identity; every decision is bound to auth.uid().
create or replace function private.has_role(_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = (select auth.uid()) and r.role = _role
  );
$$;

create or replace function private.can_access_class(_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.classes c
    where c.id = _class_id
      and (
        private.has_role('admin')
        or (private.has_role('homeroom_teacher') and c.homeroom_teacher_id = (select auth.uid()))
        or (private.has_role('teacher') and exists (
          select 1 from public.teaching_assignments ta
          where ta.class_id = c.id and ta.teacher_id = (select auth.uid())
        ))
        or (private.has_role('student') and exists (
          select 1 from public.students s
          where s.class_id = c.id and s.profile_id = (select auth.uid())
        ))
        or (private.has_role('parent') and exists (
          select 1 from public.students s
          join public.student_guardians g on g.student_id = s.id
          where s.class_id = c.id and g.guardian_user_id = (select auth.uid()) and g.can_view_academic
        ))
      )
  );
$$;

create or replace function private.can_access_student(_student_id uuid, _scope text default 'profile')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.students s
    where s.id = _student_id
      and (
        private.has_role('admin')
        or (private.has_role('student') and _scope in ('profile', 'attendance', 'academic', 'behavior') and s.profile_id = (select auth.uid()))
        or (private.has_role('teacher') and _scope in ('profile', 'attendance', 'academic', 'behavior') and exists (
          select 1 from public.teaching_assignments ta
          where ta.class_id = s.class_id and ta.teacher_id = (select auth.uid())
        ))
        or (private.has_role('homeroom_teacher') and _scope in ('profile', 'attendance', 'academic', 'behavior', 'support') and exists (
          select 1 from public.classes c
          where c.id = s.class_id and c.homeroom_teacher_id = (select auth.uid())
        ))
        or (private.has_role('parent') and exists (
          select 1 from public.student_guardians g
          where g.student_id = s.id
            and g.guardian_user_id = (select auth.uid())
            and case _scope
              when 'attendance' then g.can_view_attendance
              when 'academic' then g.can_view_academic
              when 'finance' then g.can_view_finance
              when 'profile' then g.can_view_profile
              else false
            end
        ))
      )
  );
$$;

create or replace function private.can_manage_class(_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('admin')
    or (private.has_role('teacher') and exists (
      select 1 from public.teaching_assignments ta
      where ta.class_id = _class_id and ta.teacher_id = (select auth.uid())
    ))
    or (private.has_role('homeroom_teacher') and exists (
      select 1 from public.classes c
      where c.id = _class_id and c.homeroom_teacher_id = (select auth.uid())
    ));
$$;

revoke all on function private.has_role(public.app_role) from public, anon;
revoke all on function private.can_access_class(uuid) from public, anon;
revoke all on function private.can_access_student(uuid, text) from public, anon;
revoke all on function private.can_manage_class(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_role(public.app_role) to authenticated;
grant execute on function private.can_access_class(uuid) to authenticated;
grant execute on function private.can_access_student(uuid, text) to authenticated;
grant execute on function private.can_manage_class(uuid) to authenticated;

-- RLS on every exposed application table.
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.subjects enable row level security;
alter table public.teaching_assignments enable row level security;
alter table public.enrollments enable row level security;
alter table public.student_guardians enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.grades enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.leave_requests enable row level security;
alter table public.fee_invoices enable row level security;
alter table public.merit_points enable row level security;
alter table public.student_support_cases enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles and role assignments.
create policy "profiles_read_authorized" on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or private.has_role('admin')
  or exists (select 1 from public.students s where s.profile_id = profiles.id and private.can_access_student(s.id, 'profile'))
);
create policy "profiles_update_self" on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "roles_read_self_or_admin" on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or private.has_role('admin'));
create policy "roles_admin_insert" on public.user_roles for insert to authenticated
with check (private.has_role('admin'));
create policy "roles_admin_update" on public.user_roles for update to authenticated
using (private.has_role('admin')) with check (private.has_role('admin'));
create policy "roles_admin_delete" on public.user_roles for delete to authenticated
using (private.has_role('admin'));

-- School structure.
create policy "classes_read_authorized" on public.classes for select to authenticated
using (private.can_access_class(id));
create policy "classes_admin_manage" on public.classes for all to authenticated
using (private.has_role('admin')) with check (private.has_role('admin'));

create policy "students_read_authorized" on public.students for select to authenticated
using (private.can_access_student(id, 'profile'));
create policy "students_admin_insert" on public.students for insert to authenticated
with check (private.has_role('admin'));
create policy "students_admin_or_homeroom_update" on public.students for update to authenticated
using (private.has_role('admin') or (private.has_role('homeroom_teacher') and private.can_manage_class(class_id)))
with check (private.has_role('admin') or (private.has_role('homeroom_teacher') and private.can_manage_class(class_id)));
create policy "students_admin_delete" on public.students for delete to authenticated
using (private.has_role('admin'));

create policy "teachers_read_authorized" on public.teachers for select to authenticated
using (private.has_role('admin') or profile_id = (select auth.uid()) or private.has_role('teacher'));
create policy "teachers_admin_manage" on public.teachers for all to authenticated
using (private.has_role('admin')) with check (private.has_role('admin'));

create policy "subjects_read_authenticated" on public.subjects for select to authenticated
using (true);
create policy "subjects_admin_manage" on public.subjects for all to authenticated
using (private.has_role('admin')) with check (private.has_role('admin'));

create policy "teaching_assignments_read" on public.teaching_assignments for select to authenticated
using (
  private.has_role('admin')
  or teacher_id = (select auth.uid())
  or private.can_manage_class(class_id)
);
create policy "teaching_assignments_admin_manage" on public.teaching_assignments for all to authenticated
using (private.has_role('admin')) with check (private.has_role('admin'));

create policy "enrollments_read_authorized" on public.enrollments for select to authenticated
using (private.can_access_student(student_id, 'profile'));
create policy "enrollments_admin_manage" on public.enrollments for all to authenticated
using (private.has_role('admin')) with check (private.has_role('admin'));

create policy "guardians_read_related" on public.student_guardians for select to authenticated
using (guardian_user_id = (select auth.uid()) or private.has_role('admin'));
create policy "guardians_admin_manage" on public.student_guardians for all to authenticated
using (private.has_role('admin')) with check (private.has_role('admin'));

-- Attendance.
create policy "attendance_sessions_read_staff" on public.attendance_sessions for select to authenticated
using (private.has_role('admin') or teacher_id = (select auth.uid()) or private.can_manage_class(class_id));
create policy "attendance_sessions_create_staff" on public.attendance_sessions for insert to authenticated
with check (
  private.has_role('admin')
  or (private.has_role('teacher') and teacher_id = (select auth.uid()) and private.can_manage_class(class_id))
);
create policy "attendance_sessions_update_staff" on public.attendance_sessions for update to authenticated
using (private.has_role('admin') or (teacher_id = (select auth.uid()) and private.has_role('teacher')))
with check (private.has_role('admin') or (teacher_id = (select auth.uid()) and private.has_role('teacher')));

create policy "attendance_records_read_related" on public.attendance_records for select to authenticated
using (private.can_access_student(student_id, 'attendance'));
create policy "attendance_records_insert_staff" on public.attendance_records for insert to authenticated
with check (
  recorded_by = (select auth.uid())
  and exists (
    select 1
    from public.attendance_sessions ses
    join public.students s on s.class_id = ses.class_id
    where ses.id = session_id
      and s.id = student_id
      and (private.has_role('admin') or (private.has_role('teacher') and ses.teacher_id = (select auth.uid())))
  )
);
create policy "attendance_records_update_staff" on public.attendance_records for update to authenticated
using (
  exists (
    select 1
    from public.attendance_sessions ses
    join public.students s on s.class_id = ses.class_id
    where ses.id = session_id
      and s.id = student_id
      and (private.has_role('admin') or (private.has_role('teacher') and ses.teacher_id = (select auth.uid())))
  )
)
with check (
  exists (
    select 1
    from public.attendance_sessions ses
    join public.students s on s.class_id = ses.class_id
    where ses.id = session_id
      and s.id = student_id
      and (private.has_role('admin') or (private.has_role('teacher') and ses.teacher_id = (select auth.uid())))
  )
);

-- Academic work.
create policy "assignments_read_class" on public.assignments for select to authenticated
using (
  private.has_role('admin')
  or teacher_id = (select auth.uid())
  or private.can_access_class(class_id)
);
create policy "assignments_create_teacher" on public.assignments for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and (private.has_role('admin') or private.can_manage_class(class_id))
);
create policy "assignments_update_owner" on public.assignments for update to authenticated
using (private.has_role('admin') or teacher_id = (select auth.uid()))
with check (private.has_role('admin') or teacher_id = (select auth.uid()));
create policy "assignments_delete_admin" on public.assignments for delete to authenticated
using (private.has_role('admin'));

create policy "submissions_read_related" on public.submissions for select to authenticated
using (
  private.has_role('admin')
  or private.can_access_student(student_id, 'academic')
  or exists (
    select 1 from public.assignments a
    where a.id = assignment_id and (a.teacher_id = (select auth.uid()) or private.has_role('admin'))
  )
);
create policy "submissions_insert_student" on public.submissions for insert to authenticated
with check (
  private.has_role('student')
  and exists (select 1 from public.students s where s.id = student_id and s.profile_id = (select auth.uid()))
  and exists (select 1 from public.assignments a where a.id = assignment_id and a.status = 'published')
);
create policy "submissions_update_owner_or_teacher" on public.submissions for update to authenticated
using (
  private.has_role('admin')
  or (private.has_role('student') and exists (select 1 from public.students s where s.id = student_id and s.profile_id = (select auth.uid())))
  or exists (select 1 from public.assignments a where a.id = assignment_id and a.teacher_id = (select auth.uid()))
)
with check (
  private.has_role('admin')
  or (private.has_role('student') and exists (select 1 from public.students s where s.id = student_id and s.profile_id = (select auth.uid())))
  or exists (select 1 from public.assignments a where a.id = assignment_id and a.teacher_id = (select auth.uid()))
);

create policy "grades_read_related" on public.grades for select to authenticated
using (private.can_access_student(student_id, 'academic'));
create policy "grades_insert_staff" on public.grades for insert to authenticated
with check (
  recorded_by = (select auth.uid())
  and (private.has_role('admin') or exists (
    select 1 from public.students s
    join public.teaching_assignments ta on ta.class_id = s.class_id and ta.subject_id = grades.subject_id
    where s.id = student_id and ta.teacher_id = (select auth.uid())
  ))
);
create policy "grades_update_staff" on public.grades for update to authenticated
using (
  private.has_role('admin')
  or (
    recorded_by = (select auth.uid())
    and exists (
      select 1
      from public.students s
      join public.teaching_assignments ta
        on ta.class_id = s.class_id
       and ta.subject_id = grades.subject_id
      where s.id = grades.student_id
        and ta.teacher_id = (select auth.uid())
    )
  )
)
with check (
  private.has_role('admin')
  or (
    recorded_by = (select auth.uid())
    and exists (
      select 1
      from public.students s
      join public.teaching_assignments ta
        on ta.class_id = s.class_id
       and ta.subject_id = grades.subject_id
      where s.id = grades.student_id
        and ta.teacher_id = (select auth.uid())
    )
  )
);

-- Communication.
create policy "announcements_read_audience" on public.announcements for select to authenticated
using (
  private.has_role('admin')
  or (status = 'published' and exists (
    select 1 from public.user_roles r
    where r.user_id = (select auth.uid()) and r.role = any(announcements.audience)
  ))
);
create policy "announcements_create_staff" on public.announcements for insert to authenticated
with check (
  author_id = (select auth.uid())
  and (private.has_role('admin') or private.has_role('teacher') or private.has_role('homeroom_teacher'))
);
create policy "announcements_update_owner_admin" on public.announcements for update to authenticated
using (private.has_role('admin') or author_id = (select auth.uid()))
with check (private.has_role('admin') or author_id = (select auth.uid()));

create policy "notifications_read_own" on public.notifications for select to authenticated
using (user_id = (select auth.uid()));
create policy "notifications_update_own" on public.notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- Leave, finance, merits and confidential student support.
create policy "leave_requests_read_related" on public.leave_requests for select to authenticated
using (
  requested_by = (select auth.uid())
  or private.has_role('admin')
  or (private.has_role('homeroom_teacher') and private.can_access_student(student_id, 'profile'))
  or private.can_access_student(student_id, 'profile')
);
create policy "leave_requests_create_related" on public.leave_requests for insert to authenticated
with check (
  requested_by = (select auth.uid())
  and (private.has_role('student') or private.has_role('parent'))
  and private.can_access_student(student_id, 'profile')
);
create policy "leave_requests_review_staff" on public.leave_requests for update to authenticated
using (private.has_role('admin') or (private.has_role('homeroom_teacher') and private.can_access_student(student_id, 'profile')))
with check (private.has_role('admin') or (private.has_role('homeroom_teacher') and private.can_access_student(student_id, 'profile')));

create policy "fee_invoices_read_authorized" on public.fee_invoices for select to authenticated
using (private.has_role('admin') or private.can_access_student(student_id, 'finance'));
create policy "fee_invoices_admin_manage" on public.fee_invoices for all to authenticated
using (private.has_role('admin')) with check (private.has_role('admin'));

create policy "merit_points_read_related" on public.merit_points for select to authenticated
using (private.can_access_student(student_id, 'profile'));
create policy "merit_points_create_staff" on public.merit_points for insert to authenticated
with check (
  recorded_by = (select auth.uid())
  and (private.has_role('admin') or private.has_role('teacher') or private.has_role('homeroom_teacher'))
);

create policy "support_cases_read_staff_only" on public.student_support_cases for select to authenticated
using (
  private.has_role('admin')
  or (private.has_role('homeroom_teacher') and private.can_access_student(student_id, 'support'))
);
create policy "support_cases_create_staff" on public.student_support_cases for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and (private.has_role('admin') or (private.has_role('homeroom_teacher') and private.can_access_student(student_id, 'support')))
);
create policy "support_cases_update_staff" on public.student_support_cases for update to authenticated
using (
  private.has_role('admin')
  or (owner_id = (select auth.uid()) and private.has_role('homeroom_teacher') and private.can_access_student(student_id, 'profile'))
)
with check (
  private.has_role('admin')
  or (owner_id = (select auth.uid()) and private.has_role('homeroom_teacher') and private.can_access_student(student_id, 'profile'))
);

create policy "audit_logs_read_admin" on public.audit_logs for select to authenticated
using (private.has_role('admin'));
create policy "audit_logs_insert_actor" on public.audit_logs for insert to authenticated
with check (actor_id = (select auth.uid()));

-- Explicit Data API grants; remove inherited anonymous/public access first.
revoke all on schema public from public, anon;
revoke all on all tables in schema public from public, anon;
revoke all on all sequences in schema public from public, anon;
alter default privileges in schema public revoke all on tables from public, anon;
alter default privileges in schema public revoke all on sequences from public, anon;

-- RLS remains the row-level authorization boundary for authenticated users.
grant usage on schema public to authenticated;
grant select, insert, update on
  public.profiles, public.user_roles, public.classes, public.students, public.teachers,
  public.subjects, public.teaching_assignments, public.enrollments, public.student_guardians,
  public.attendance_sessions, public.attendance_records, public.assignments, public.submissions,
  public.grades, public.announcements, public.notifications, public.leave_requests,
  public.fee_invoices, public.merit_points, public.student_support_cases, public.audit_logs
to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Authenticated users can only see their own profile by default. Assign roles to trusted
-- accounts through an administrator workflow; never accept role grants from sign-up metadata.
-- Bootstrap first administrator (run manually after creating the trusted Auth user):
-- insert into public.user_roles (user_id, role, is_primary)
-- values ('<AUTH_USER_UUID>', 'admin', true);
