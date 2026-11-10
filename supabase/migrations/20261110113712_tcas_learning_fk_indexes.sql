-- Add indexes for the learning progress and study session foreign keys.
create index if not exists tcas_lesson_progress_lesson_id_idx on public.tcas_lesson_progress(lesson_id);
create index if not exists tcas_study_sessions_exam_set_id_idx on public.tcas_study_sessions(exam_set_id);
