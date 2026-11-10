-- Harden TCAS policies and isolate grading implementation in private schema.
create index if not exists tcas_attempt_answers_question_id_idx on public.tcas_attempt_answers(question_id);
create index if not exists tcas_attempt_results_question_id_idx on public.tcas_attempt_results(question_id);
create index if not exists tcas_attempts_exam_set_id_idx on public.tcas_attempts(exam_set_id);
drop policy if exists tcas_sets_admin on public.tcas_exam_sets;
create policy tcas_sets_admin_insert on public.tcas_exam_sets for insert to authenticated with check(private.has_role('admin'));
create policy tcas_sets_admin_update on public.tcas_exam_sets for update to authenticated using(private.has_role('admin')) with check(private.has_role('admin'));
create policy tcas_sets_admin_delete on public.tcas_exam_sets for delete to authenticated using(private.has_role('admin'));
drop policy if exists tcas_questions_admin on public.tcas_questions;
create policy tcas_questions_admin_insert on public.tcas_questions for insert to authenticated with check(private.has_role('admin'));
create policy tcas_questions_admin_update on public.tcas_questions for update to authenticated using(private.has_role('admin')) with check(private.has_role('admin'));
create policy tcas_questions_admin_delete on public.tcas_questions for delete to authenticated using(private.has_role('admin'));
drop function if exists public.grade_tcas_attempt(uuid);
create or replace function private.grade_tcas_attempt_core(_attempt_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_attempt public.tcas_attempts%rowtype;v_q record;v_earned numeric(8,2):=0;v_max numeric(8,2):=0;v_correct int:=0;v_count int:=0;v_status text;
begin
if v_user is null then raise exception 'Authentication required';end if;
select * into v_attempt from public.tcas_attempts where id=_attempt_id for update;
if not found or v_attempt.user_id<>v_user then raise exception 'Attempt not found';end if;
if v_attempt.status<>'in_progress' then return jsonb_build_object('attempt_id',v_attempt.id,'status',v_attempt.status,'earned_points',v_attempt.earned_points,'max_points',v_attempt.max_points,'correct_count',v_attempt.correct_count,'question_count',v_attempt.question_count);end if;
for v_q in select q.id,q.points,k.correct_answer,k.explanation,k.solution_steps,a.answer from public.tcas_questions q join private.tcas_answer_keys k on k.question_id=q.id left join public.tcas_attempt_answers a on a.question_id=q.id and a.attempt_id=_attempt_id where q.exam_set_id=v_attempt.exam_set_id order by q.sort_order,q.question_no loop
v_count:=v_count+1;v_max:=v_max+v_q.points;
if v_q.answer is not null and v_q.answer=jsonb_build_object('choice',v_q.correct_answer #>> '{}') then v_correct:=v_correct+1;v_earned:=v_earned+v_q.points;end if;
insert into public.tcas_attempt_results(attempt_id,question_id,submitted_answer,correct_answer,is_correct,earned_points,max_points,explanation,solution_steps) values(_attempt_id,v_q.id,v_q.answer,v_q.correct_answer,(v_q.answer is not null and v_q.answer=jsonb_build_object('choice',v_q.correct_answer #>> '{}')),case when v_q.answer=jsonb_build_object('choice',v_q.correct_answer #>> '{}') then v_q.points else 0 end,v_q.points,v_q.explanation,v_q.solution_steps) on conflict(attempt_id,question_id) do update set submitted_answer=excluded.submitted_answer,correct_answer=excluded.correct_answer,is_correct=excluded.is_correct,earned_points=excluded.earned_points,max_points=excluded.max_points,explanation=excluded.explanation,solution_steps=excluded.solution_steps;
end loop;
v_status:=case when now()>v_attempt.started_at+(v_attempt.time_limit_seconds*interval '1 second') then 'expired' else 'submitted' end;
update public.tcas_attempts set status=v_status,submitted_at=now(),earned_points=v_earned,max_points=v_max,correct_count=v_correct,question_count=v_count where id=_attempt_id;
return jsonb_build_object('attempt_id',_attempt_id,'status',v_status,'earned_points',v_earned,'max_points',v_max,'correct_count',v_correct,'question_count',v_count);
end $$;
revoke all on function private.grade_tcas_attempt_core(uuid) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.grade_tcas_attempt_core(uuid) to authenticated;
create or replace function public.grade_tcas_attempt(_attempt_id uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.grade_tcas_attempt_core(_attempt_id); $$;
revoke all on function public.grade_tcas_attempt(uuid) from public,anon;
grant execute on function public.grade_tcas_attempt(uuid) to authenticated;
