-- TCAS learning center: lesson library, per-user progress, vocabulary and focus sessions.
create table public.tcas_lessons (
 id uuid primary key default gen_random_uuid(),
 exam_set_id uuid not null references public.tcas_exam_sets(id) on delete cascade,
 title text not null, summary text not null default '',
 lesson_type text not null default 'concept' check(lesson_type in ('concept','worked_example','strategy')),
 content text not null, duration_minutes int not null default 10 check(duration_minutes between 1 and 240),
 sort_order int not null default 0, is_published boolean not null default false,
 created_at timestamptz not null default now(), unique(exam_set_id,sort_order)
);
create index tcas_lessons_course_idx on public.tcas_lessons(exam_set_id,is_published,sort_order);
create table public.tcas_lesson_progress (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 lesson_id uuid not null references public.tcas_lessons(id) on delete cascade,
 status text not null default 'not_started' check(status in ('not_started','in_progress','completed')),
 progress_percent int not null default 0 check(progress_percent between 0 and 100),
 last_position_seconds int not null default 0 check(last_position_seconds>=0),
 completed_at timestamptz, updated_at timestamptz not null default now(), unique(user_id,lesson_id)
);
create index tcas_lesson_progress_user_idx on public.tcas_lesson_progress(user_id,updated_at desc);
create table public.tcas_vocabulary (
 id uuid primary key default gen_random_uuid(), exam_set_id uuid references public.tcas_exam_sets(id) on delete cascade,
 term text not null, meaning text not null, example text not null default '', sort_order int not null default 0,
 is_published boolean not null default true, unique(exam_set_id,term)
);
create table public.tcas_study_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 exam_set_id uuid references public.tcas_exam_sets(id) on delete set null, started_at timestamptz not null default now(),
 ended_at timestamptz, duration_seconds int not null default 0 check(duration_seconds>=0), note text not null default ''
);
create index tcas_study_sessions_user_idx on public.tcas_study_sessions(user_id,started_at desc);
alter table public.tcas_lessons enable row level security;
alter table public.tcas_lesson_progress enable row level security;
alter table public.tcas_vocabulary enable row level security;
alter table public.tcas_study_sessions enable row level security;
revoke all on public.tcas_lessons,public.tcas_lesson_progress,public.tcas_vocabulary,public.tcas_study_sessions from anon,public;
grant select on public.tcas_lessons,public.tcas_vocabulary to authenticated;
grant select,insert,update on public.tcas_lesson_progress to authenticated;
grant select,insert,update on public.tcas_study_sessions to authenticated;
create policy tcas_lessons_read on public.tcas_lessons for select to authenticated using(is_published or private.has_role('admin'));
create policy tcas_lessons_admin_insert on public.tcas_lessons for insert to authenticated with check(private.has_role('admin'));
create policy tcas_lessons_admin_update on public.tcas_lessons for update to authenticated using(private.has_role('admin')) with check(private.has_role('admin'));
create policy tcas_lessons_admin_delete on public.tcas_lessons for delete to authenticated using(private.has_role('admin'));
create policy tcas_progress_read on public.tcas_lesson_progress for select to authenticated using(user_id=(select auth.uid()) or private.has_role('admin'));
create policy tcas_progress_insert on public.tcas_lesson_progress for insert to authenticated with check(user_id=(select auth.uid()));
create policy tcas_progress_update on public.tcas_lesson_progress for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy tcas_vocab_read on public.tcas_vocabulary for select to authenticated using(is_published);
create policy tcas_vocab_admin_insert on public.tcas_vocabulary for insert to authenticated with check(private.has_role('admin'));
create policy tcas_vocab_admin_update on public.tcas_vocabulary for update to authenticated using(private.has_role('admin')) with check(private.has_role('admin'));
create policy tcas_vocab_admin_delete on public.tcas_vocabulary for delete to authenticated using(private.has_role('admin'));
create policy tcas_study_sessions_read on public.tcas_study_sessions for select to authenticated using(user_id=(select auth.uid()) or private.has_role('admin'));
create policy tcas_study_sessions_insert on public.tcas_study_sessions for insert to authenticated with check(user_id=(select auth.uid()));
create policy tcas_study_sessions_update on public.tcas_study_sessions for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
insert into public.tcas_lessons(exam_set_id,title,summary,lesson_type,content,duration_minutes,sort_order,is_published)
select s.id,v.title,v.summary,'concept',v.content,v.minutes,v.ord,true from (values
('tgat1-communication','จับหลักบทสนทนาและเจตนาผู้พูด','อ่านบริบท ความสัมพันธ์ และระดับความสุภาพก่อนเลือกคำตอบ','เป้าหมาย: เลือกคำตอบที่สอดคล้องกับสถานการณ์ ไม่ใช่แปลคำต่อคำ\n\n1) อ่านบทบาทและความสัมพันธ์: เพื่อน ครู ผู้สัมภาษณ์ หรือผู้ให้บริการ\n2) ระบุเจตนา: ขอร้อง ปฏิเสธ เสนอความช่วยเหลือ ขอบคุณ หรือแสดงความยินดี\n3) ดูระดับภาษา: สถานการณ์ทางการควรใช้ถ้อยคำสุภาพและชัดเจน\n4) ตัดตัวเลือกที่ไม่ตอบคำถามหรือมีน้ำเสียงไม่เหมาะสม',12,1),
('tgat1-communication','Reading: หาใจความและหลักฐาน','แยก main idea, supporting details และ inference','1) อ่านคำถามก่อนเพื่อรู้ว่ากำลังหาอะไร\n2) อ่านประโยคต้นและท้ายของแต่ละย่อหน้าเพื่อจับประเด็น\n3) ขีดคำเชื่อม เช่น however, therefore, although และ because\n4) เลือกคำตอบที่ครอบคลุมทั้งบท ไม่ใช่รายละเอียดเพียงจุดเดียว\n\nMain idea คือประเด็นหลัก ส่วน inference ต้องอนุมานจากหลักฐานในบทอ่าน',15,2),
('tgat2-reasoning','อนุกรมตัวเลข: มองหารูปแบบ','ฝึกผลต่าง อัตราส่วน และรูปแบบสลับ','1) หาผลต่างระหว่างพจน์ติดกัน\n2) หากผลต่างไม่คงที่ ให้หาผลต่างชั้นที่สอง\n3) ทดลองอัตราส่วนหรือรูปแบบคูณแล้วบวก/ลบ\n4) ตรวจว่ามีสองลำดับสลับตำแหน่งกันหรือไม่\n\nตัวอย่าง 2, 6, 12, 20, 30 ผลต่างคือ 4, 6, 8, 10 ดังนั้นผลต่างถัดไปคือ 12 คำตอบคือ 42',12,1),
('tgat2-reasoning','การสรุปเหตุผลและเงื่อนไข','แยกข้อเท็จจริง สมมติฐาน และข้อสรุปที่ตามได้จริง','1) วงข้อความที่โจทย์กำหนดให้เป็นข้อเท็จจริง\n2) แปลงเงื่อนไขเป็นประโยคสั้น เช่น ทุก A เป็น B\n3) ตรวจว่าข้อสรุปตามจากเงื่อนไขโดยตรงหรือไม่\n4) ระวังการกลับเงื่อนไข เช่น ทุก A เป็น B ไม่ได้แปลว่าทุก B เป็น A\n\nอย่าเติมข้อมูลที่โจทย์ไม่ได้ให้',14,2),
('tpat3-aptitude','มิติสัมพันธ์และภาพฉาย','ฝึกหมุนวัตถุ มองด้าน และเทียบรูปทรง','1) กำหนดด้านหน้า ด้านข้าง และด้านบนให้คงที่\n2) เมื่อต้องหมุนวัตถุ ให้ติดตามจุดสังเกตหนึ่งจุดเสมอ\n3) ภาพฉายด้านบนแสดงความกว้างและความลึก แต่ไม่แสดงความสูง\n4) ตรวจจำนวนช่องหรือส่วนประกอบที่ถูกบัง\n\nฝึกวาดภาพแยกสามมุมมองก่อนตัดสินใจ',14,1),
('tpat3-aptitude','กลไก คาน และแรงบิด','เข้าใจจุดหมุน แรงพยายาม และแรงต้าน','คานชนิดที่ 1: จุดหมุนอยู่ระหว่างแรงพยายามกับแรงต้าน เช่น กรรไกร\nคานชนิดที่ 2: แรงต้านอยู่ระหว่างจุดหมุนกับแรงพยายาม เช่น รถเข็น\nคานชนิดที่ 3: แรงพยายามอยู่ระหว่างจุดหมุนกับแรงต้าน เช่น แหนบ\n\nหลักคิด: วาดตำแหน่งทั้งสามก่อนจำแนกชนิดคาน',12,2),
('a-level-biology','ระบบหายใจและการแลกเปลี่ยนแก๊ส','เชื่อมโครงสร้างถุงลมกับการแพร่ของแก๊ส','เส้นทางอากาศ: โพรงจมูก → คอหอย → กล่องเสียง → หลอดลม → หลอดลมฝอย → ถุงลมปอด\n\nถุงลมเหมาะกับการแลกเปลี่ยนแก๊สเพราะมีพื้นที่ผิวมาก ผนังบางชั้นเดียว และมีเส้นเลือดฝอยห่อหุ้ม\n\nออกซิเจนแพร่จากอากาศในถุงลมเข้าสู่เลือด ส่วนคาร์บอนไดออกไซด์แพร่จากเลือดเข้าสู่ถุงลม',15,1),
('a-level-biology','ระบบย่อยอาหารและเอนไซม์','จับคู่ตำแหน่ง อาหารตั้งต้น และผลิตภัณฑ์','ปาก: อะไมเลสเริ่มย่อยแป้ง\nกระเพาะอาหาร: เพปซินย่อยโปรตีนในสภาพเป็นกรด\nลำไส้เล็ก: เอนไซม์จากตับอ่อนและผนังลำไส้ย่อยสารอาหารต่อจนดูดซึมได้\n\nตับสร้างน้ำดีเพื่อช่วยให้ไขมันแตกเป็นหยดเล็กลง แต่น้ำดีไม่ใช่เอนไซม์',15,2)
) v(slug,title,summary,content,minutes,ord) join public.tcas_exam_sets s on s.slug=v.slug
on conflict(exam_set_id,sort_order) do nothing;
insert into public.tcas_vocabulary(exam_set_id,term,meaning,example,sort_order)
select s.id,v.term,v.meaning,v.example,v.ord from (values
('tgat1-communication','commitment','ภาระหน้าที่หรือสิ่งที่รับปากไว้','I have a prior commitment this afternoon.',1),
('tgat1-communication','would you mind','คุณจะรังเกียจไหม (ใช้ขอร้องอย่างสุภาพ)','Would you mind closing the door?',2),
('tgat1-communication','carry out','ดำเนินการหรือปฏิบัติให้สำเร็จ','The team carried out the survey.',3),
('tgat1-communication','inference','การอนุมานจากหลักฐาน','Choose the inference supported by the passage.',4),
('tgat1-communication','congratulations','คำแสดงความยินดี','Congratulations on your achievement!',5),
('tgat1-communication','although','แม้ว่า (เชื่อมความขัดแย้ง)','Although it rained, we continued.',6),
('tgat1-communication','opportunity','โอกาส','This internship is a great opportunity.',7),
('tgat1-communication','reliable','เชื่อถือได้','Use reliable sources for your research.',8)
) v(slug,term,meaning,example,ord) join public.tcas_exam_sets s on s.slug=v.slug
on conflict(exam_set_id,term) do nothing;
