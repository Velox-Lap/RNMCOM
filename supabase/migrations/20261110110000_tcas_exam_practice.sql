-- RNMCOM TCAS practice schema. Answer keys stay in a private schema.
create schema if not exists private;
create table public.tcas_exam_sets(id uuid primary key default gen_random_uuid(),slug text not null unique,code text not null,title text not null,exam_group text not null check(exam_group in ('TGAT1','TGAT2','TPAT3','A_LEVEL')),description text not null default '',duration_minutes int not null default 30 check(duration_minutes between 1 and 300),formats text[] not null default '{}',is_published boolean not null default false,created_at timestamptz not null default now());
create table public.tcas_questions(id uuid primary key default gen_random_uuid(),exam_set_id uuid not null references public.tcas_exam_sets(id) on delete cascade,question_no int not null check(question_no>0),section text not null,format text not null,question_type text not null default 'single_choice' check(question_type in ('single_choice','multiple_choice','numeric','hotspot')),prompt text not null,passage text,options jsonb not null default '[]'::jsonb,points numeric(7,2) not null default 1 check(points>0),sort_order int not null default 0,unique(exam_set_id,question_no));
create index tcas_questions_exam_order_idx on public.tcas_questions(exam_set_id,sort_order,question_no);
create table private.tcas_answer_keys(question_id uuid primary key references public.tcas_questions(id) on delete cascade,correct_answer jsonb not null,explanation text not null,solution_steps jsonb not null default '[]'::jsonb);
revoke all on private.tcas_answer_keys from public,anon,authenticated;
create table public.tcas_attempts(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,exam_set_id uuid not null references public.tcas_exam_sets(id) on delete restrict,status text not null default 'in_progress' check(status in ('in_progress','submitted','expired')),started_at timestamptz not null default now(),submitted_at timestamptz,time_limit_seconds int not null check(time_limit_seconds>0),earned_points numeric(8,2) not null default 0,max_points numeric(8,2) not null default 0,correct_count int not null default 0,question_count int not null default 0);
create index tcas_attempts_user_idx on public.tcas_attempts(user_id,started_at desc);
create table public.tcas_attempt_answers(id uuid primary key default gen_random_uuid(),attempt_id uuid not null references public.tcas_attempts(id) on delete cascade,question_id uuid not null references public.tcas_questions(id) on delete cascade,answer jsonb,flag_for_review boolean not null default false,answered_at timestamptz not null default now(),unique(attempt_id,question_id));
create index tcas_attempt_answers_attempt_idx on public.tcas_attempt_answers(attempt_id);
create table public.tcas_attempt_results(id uuid primary key default gen_random_uuid(),attempt_id uuid not null references public.tcas_attempts(id) on delete cascade,question_id uuid not null references public.tcas_questions(id) on delete cascade,submitted_answer jsonb,correct_answer jsonb not null,is_correct boolean not null,earned_points numeric(7,2) not null default 0,max_points numeric(7,2) not null,explanation text not null,solution_steps jsonb not null default '[]'::jsonb,unique(attempt_id,question_id));
alter table public.tcas_exam_sets enable row level security;alter table public.tcas_questions enable row level security;alter table public.tcas_attempts enable row level security;alter table public.tcas_attempt_answers enable row level security;alter table public.tcas_attempt_results enable row level security;
revoke all on public.tcas_exam_sets,public.tcas_questions,public.tcas_attempts,public.tcas_attempt_answers,public.tcas_attempt_results from anon,public;
grant select on public.tcas_exam_sets,public.tcas_questions to authenticated;grant select,insert on public.tcas_attempts to authenticated;grant select,insert,update,delete on public.tcas_attempt_answers to authenticated;grant select on public.tcas_attempt_results to authenticated;
create policy tcas_sets_read on public.tcas_exam_sets for select to authenticated using(is_published or private.has_role('admin'));
create policy tcas_sets_admin on public.tcas_exam_sets for all to authenticated using(private.has_role('admin')) with check(private.has_role('admin'));
create policy tcas_questions_read on public.tcas_questions for select to authenticated using(exists(select 1 from public.tcas_exam_sets s where s.id=exam_set_id and (s.is_published or private.has_role('admin'))));
create policy tcas_questions_admin on public.tcas_questions for all to authenticated using(private.has_role('admin')) with check(private.has_role('admin'));
create policy tcas_attempts_read on public.tcas_attempts for select to authenticated using(user_id=(select auth.uid()) or private.has_role('admin'));
create policy tcas_attempts_insert on public.tcas_attempts for insert to authenticated with check(user_id=(select auth.uid()) and status='in_progress' and (private.has_role('student') or private.has_role('admin')));
create policy tcas_answers_read on public.tcas_attempt_answers for select to authenticated using(exists(select 1 from public.tcas_attempts a where a.id=attempt_id and (a.user_id=(select auth.uid()) or private.has_role('admin'))));
create policy tcas_answers_insert on public.tcas_attempt_answers for insert to authenticated with check(exists(select 1 from public.tcas_attempts a join public.tcas_questions q on q.exam_set_id=a.exam_set_id where a.id=attempt_id and q.id=question_id and a.user_id=(select auth.uid()) and a.status='in_progress'));
create policy tcas_answers_update on public.tcas_attempt_answers for update to authenticated using(exists(select 1 from public.tcas_attempts a where a.id=attempt_id and a.user_id=(select auth.uid()) and a.status='in_progress')) with check(exists(select 1 from public.tcas_attempts a join public.tcas_questions q on q.exam_set_id=a.exam_set_id where a.id=attempt_id and q.id=question_id and a.user_id=(select auth.uid()) and a.status='in_progress'));
create policy tcas_answers_delete on public.tcas_attempt_answers for delete to authenticated using(exists(select 1 from public.tcas_attempts a where a.id=attempt_id and a.user_id=(select auth.uid()) and a.status='in_progress'));
create policy tcas_results_read on public.tcas_attempt_results for select to authenticated using(exists(select 1 from public.tcas_attempts a where a.id=attempt_id and a.status in ('submitted','expired') and (a.user_id=(select auth.uid()) or private.has_role('admin'))));
create or replace function public.grade_tcas_attempt(_attempt_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
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
revoke all on function public.grade_tcas_attempt(uuid) from public,anon;grant execute on function public.grade_tcas_attempt(uuid) to authenticated;
insert into public.tcas_exam_sets(slug,code,title,exam_group,description,duration_minutes,formats,is_published) values
('tgat1-communication','TGAT1','การสื่อสารภาษาอังกฤษ','TGAT1','ฝึกถามตอบ บทสนทนา เติมข้อความ และอ่านจับใจความ',15,array['ถาม-ตอบ','บทสนทนา','เติมข้อความ','Reading'],true),
('tgat2-reasoning','TGAT2','การคิดอย่างมีเหตุผล','TGAT2','ฝึกภาษา จำนวน มิติสัมพันธ์ และเหตุผล',15,array['การสื่อความหมาย','อนุกรมตัวเลข','พับกล่อง','สรุปความ'],true),
('tpat3-aptitude','TPAT3','ความถนัดด้านวิทยาศาสตร์ เทคโนโลยี และวิศวกรรมศาสตร์','TPAT3','ฝึกอนุกรม มิติสัมพันธ์ และกลไกเครื่องกล',12,array['อนุกรมตัวเลข','ภาพ 3 มิติ','กลไก'],true),
('a-level-biology','A-LEVEL','A-Level ชีววิทยา','A_LEVEL','ทบทวนระบบต่าง ๆ ของร่างกาย',12,array['ระบบย่อยอาหาร','ระบบหายใจ','ระบบหมุนเวียนเลือด'],true) on conflict(slug) do nothing;
comment on table public.tcas_questions is 'Original RNMCOM practice questions; answer keys are private.';
comment on table private.tcas_answer_keys is 'Private grading keys, never exposed through the Data API.';

-- Original RNMCOM starter questions. These are practice items, not official past papers.
insert into public.tcas_questions(exam_set_id,question_no,section,format,prompt,passage,options,points,sort_order)
select s.id,v.n,v.section,v.format,v.prompt,v.passage,v.options,1,v.n from (values
('tgat1-communication',1,'Speaking','ถาม-ตอบ','You are invited to a meeting, but you already have another commitment. Which response is the most natural and polite?',null,'["I do not care about the meeting.","Thanks for inviting me, but I have another commitment. Could we find another time?","You must change the meeting for me.","Meeting is not my thing."]'::jsonb),
('tgat1-communication',2,'Speaking','บทสนทนาสั้น','Choose the best response. A: “Would you mind opening the window?” B: “_____”',null,'["Not at all.","Yes, I would mind you.","I am not a window.","The window was yesterday."]'::jsonb),
('tgat1-communication',3,'Speaking','บทสนทนายาว','Mina: “I heard you got the internship!” Arun: “Yes, I start next month.” Mina: “_____”',null,'["That sounds like a great opportunity. Congratulations!","You should not have applied.","I do not know what month it is.","Internships are always impossible."]'::jsonb),
('tgat1-communication',4,'Reading','เติมข้อความ','Choose the word that best completes: “Although the weather was poor, the team _____ the outdoor survey.”',null,'["called off","gave up","carried out","looked after"]'::jsonb),
('tgat1-communication',5,'Reading','อ่านจับใจความ','What is the main purpose of the passage?','A community library started a weekend reading club for teenagers. Volunteers help members choose books, discuss stories, and practise presenting their ideas. After three months, the library noticed that more teenagers were borrowing books and attending community events.','["To advertise a new commercial bookstore.","To describe how a reading club encourages teenagers to read and participate.","To explain why libraries should close on weekends.","To compare school examinations in different towns."]'::jsonb),
('tgat2-reasoning',1,'ภาษา','การสื่อความหมาย','สุภาษิต “น้ำขึ้นให้รีบตัก” สื่อความหมายใกล้เคียงกับข้อใดมากที่สุด',null,'["ทำงานโดยไม่วางแผน","ใช้โอกาสที่เหมาะสมให้เกิดประโยชน์","รอให้ผู้อื่นตัดสินใจแทน","หลีกเลี่ยงความเปลี่ยนแปลง"]'::jsonb),
('tgat2-reasoning',2,'จำนวน','อนุกรมตัวเลข','ลำดับ 2, 6, 12, 20, 30, ... จำนวนถัดไปคือข้อใด',null,'["36","40","41","42"]'::jsonb),
('tgat2-reasoning',3,'มิติสัมพันธ์','พับกล่อง','กำหนดให้หน้าตรงข้ามของลูกบาศก์เป็นคู่ A–D, B–E และ C–F หน้าที่อยู่ตรงข้ามกับ B คือข้อใด',null,'["A","C","D","E"]'::jsonb),
('tgat2-reasoning',4,'เหตุผล','สรุปความ','นักเรียนทุกคนในชมรมวิทยาศาสตร์ชอบทดลอง และนิดเป็นสมาชิกชมรมวิทยาศาสตร์ ข้อสรุปใดสมเหตุสมผล',null,'["นิดเป็นครูวิทยาศาสตร์","นักเรียนทุกคนเป็นสมาชิกชมรม","นิดชอบทดลอง","สมาชิกชมรมทุกคนเป็นนักเรียน"]'::jsonb),
('tpat3-aptitude',1,'ตัวเลข','อนุกรมตัวเลข','ลำดับ 5, 9, 17, 33, 65, ... จำนวนถัดไปคือข้อใด',null,'["97","121","129","130"]'::jsonb),
('tpat3-aptitude',2,'มิติสัมพันธ์','ภาพด้าน 3 มิติ','วัตถุทรงลูกบาศก์ถูกมองจากด้านบน ภาพฉายพื้นฐานเป็นรูปใด',null,'["วงกลม","สี่เหลี่ยมจัตุรัส","สามเหลี่ยม","ห้าเหลี่ยม"]'::jsonb),
('tpat3-aptitude',3,'กลไก','กลไกเครื่องกล','คานชนิดที่ 1 มีจุดหมุนอยู่ระหว่างแรงพยายามกับแรงต้าน ตัวอย่างใดตรงกับหลักการนี้',null,'["รถเข็นดิน","แหนบ","กรรไกร","ที่เปิดขวด"]'::jsonb),
('a-level-biology',1,'ระบบหายใจ','ระบบหายใจ','บริเวณใดของปอดเป็นตำแหน่งหลักที่เกิดการแลกเปลี่ยนแก๊สระหว่างอากาศกับเลือด',null,'["ถุงลมปอด","หลอดลมคอ","กล่องเสียง","โพรงจมูก"]'::jsonb),
('a-level-biology',2,'ระบบหมุนเวียนเลือด','ระบบหมุนเวียนเลือด','หลอดเลือดชนิดใดทำหน้าที่นำเลือดออกจากหัวใจไปยังส่วนต่าง ๆ ของร่างกาย',null,'["หลอดเลือดดำ","หลอดเลือดฝอย","หลอดเลือดแดง","ท่อน้ำเหลือง"]'::jsonb),
('a-level-biology',3,'ระบบย่อยอาหาร','ระบบย่อยอาหาร','เอนไซม์อะไมเลสในน้ำลายเริ่มย่อยสารอาหารชนิดใด',null,'["โปรตีน","แป้ง","ไขมัน","กรดนิวคลีอิก"]'::jsonb)
) as v(slug,n,section,format,prompt,passage,options) join public.tcas_exam_sets s on s.slug=v.slug on conflict(exam_set_id,question_no) do nothing;
insert into private.tcas_answer_keys(question_id,correct_answer,explanation)
select q.id,v.answer,v.explanation from (values
('tgat1-communication',1,'"B"'::jsonb,'คำตอบ B สุภาพและชัดเจน: ขอบคุณสำหรับคำเชิญ แจ้งว่าติดภารกิจ และเสนอเวลาทางเลือก','[]'::jsonb),
('tgat1-communication',2,'"A"'::jsonb,'Not at all หมายถึงไม่รังเกียจ เป็นการตอบรับคำขออย่างเป็นธรรมชาติ','[]'::jsonb),
('tgat1-communication',3,'"A"'::jsonb,'เมื่อเพื่อนบอกข่าวดี คำตอบที่เหมาะสมคือแสดงความยินดี','[]'::jsonb),
('tgat1-communication',4,'"C"'::jsonb,'carried out หมายถึงดำเนินการ จึงเข้ากับการสำรวจภาคสนาม','[]'::jsonb),
('tgat1-communication',5,'"B"'::jsonb,'ใจความหลักคือชมรมอ่านหนังสือช่วยให้วัยรุ่นอ่านหนังสือและเข้าร่วมกิจกรรมชุมชนมากขึ้น','[]'::jsonb),
('tgat2-reasoning',1,'"B"'::jsonb,'สุภาษิตนี้สอนให้ใช้ประโยชน์จากโอกาสที่เอื้ออำนวย','[]'::jsonb),
('tgat2-reasoning',2,'"D"'::jsonb,'ผลต่างคือ 4, 6, 8, 10 ดังนั้นผลต่างถัดไปคือ 12 และ 30 + 12 = 42','[]'::jsonb),
('tgat2-reasoning',3,'"D"'::jsonb,'โจทย์กำหนดคู่หน้าตรงข้าม B–E โดยตรง จึงตอบ E','[]'::jsonb),
('tgat2-reasoning',4,'"C"'::jsonb,'เมื่อนิดเป็นสมาชิกชมรมและสมาชิกทุกคนชอบทดลอง จึงสรุปได้ว่านิดชอบทดลอง','[]'::jsonb),
('tpat3-aptitude',1,'"C"'::jsonb,'แต่ละพจน์คูณ 2 แล้วลบ 1 ดังนั้น 65 × 2 − 1 = 129','[]'::jsonb),
('tpat3-aptitude',2,'"B"'::jsonb,'เมื่อมองลูกบาศก์จากด้านบน ภาพฉายพื้นฐานเป็นสี่เหลี่ยมจัตุรัส','[]'::jsonb),
('tpat3-aptitude',3,'"C"'::jsonb,'กรรไกรเป็นคานชนิดที่ 1 เพราะจุดหมุนอยู่ระหว่างแรงพยายามและแรงต้าน','[]'::jsonb),
('a-level-biology',1,'"A"'::jsonb,'ถุงลมปอดมีผนังบางและเส้นเลือดฝอยหนาแน่น จึงเป็นบริเวณแลกเปลี่ยนแก๊ส','[]'::jsonb),
('a-level-biology',2,'"C"'::jsonb,'หลอดเลือดแดงนำเลือดออกจากหัวใจไปยังอวัยวะต่าง ๆ','[]'::jsonb),
('a-level-biology',3,'"B"'::jsonb,'อะไมเลสในน้ำลายเริ่มย่อยแป้งให้เป็นน้ำตาลสายสั้น','[]'::jsonb)
) as v(slug,n,answer,explanation,unused) join public.tcas_exam_sets s on s.slug=v.slug join public.tcas_questions q on q.exam_set_id=s.id and q.question_no=v.n on conflict(question_id) do nothing;
