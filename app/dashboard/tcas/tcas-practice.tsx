"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, ArrowRight, Award, BookOpen, CheckCircle2, Clock3, Flag, GraduationCap, RotateCcw, Send, Target, Timer, XCircle } from "lucide-react";

type ExamSet = { id: string; slug: string; code: string; title: string; exam_group: string; description: string; duration_minutes: number; formats: string[] };
type Option = { id: string; text: string };
type Question = { id: string; question_no: number; section: string; format: string; prompt: string; passage: string | null; options: Option[]; points: number; answer?: string; explanation?: string; steps?: string[] };
type Result = { question_id: string; submitted_answer: string | null; correct_answer: string; is_correct: boolean; earned_points: number; max_points: number; explanation: string; solution_steps: string[] };

const demoSets: ExamSet[] = [
 { id: "demo-tgat1", slug: "tgat1-communication", code: "TGAT1", title: "การสื่อสารภาษาอังกฤษ", exam_group: "TGAT1", description: "ฝึกถาม-ตอบ บทสนทนา เติมข้อความ และอ่านจับใจความ", duration_minutes: 15, formats: ["ถาม-ตอบ","บทสนทนาสั้น","บทสนทนายาว","เติมข้อความ","อ่านจับใจความ"] },
 { id: "demo-tgat2", slug: "tgat2-reasoning", code: "TGAT2", title: "การคิดอย่างมีเหตุผล", exam_group: "TGAT2", description: "ฝึกภาษา จำนวน มิติสัมพันธ์ และเหตุผล", duration_minutes: 15, formats: ["การสื่อความหมาย","อนุกรมตัวเลข","พับกล่อง","สรุปความ"] },
 { id: "demo-tpat3", slug: "tpat3-aptitude", code: "TPAT3", title: "ความถนัดด้านวิทยาศาสตร์ เทคโนโลยี และวิศวกรรมศาสตร์", exam_group: "TPAT3", description: "ฝึกอนุกรม มิติสัมพันธ์ และกลไกเครื่องกล", duration_minutes: 12, formats: ["อนุกรมตัวเลข","ภาพด้าน 3 มิติ","กลไกเครื่องกล"] },
 { id: "demo-bio", slug: "a-level-biology", code: "A-LEVEL", title: "A-Level ชีววิทยา", exam_group: "A_LEVEL", description: "ทบทวนระบบต่าง ๆ ของร่างกาย", duration_minutes: 12, formats: ["ระบบหายใจ","ระบบหมุนเวียนเลือด","ระบบย่อยอาหาร"] }
];

const demoQuestions: Record<string, Question[]> = {
 "demo-tgat1": [
  {id:"t1q1",question_no:1,section:"Speaking",format:"ถาม-ตอบ",prompt:"You are invited to a meeting, but you already have another commitment. Which response is the most natural and polite?",passage:null,options:[{id:"A",text:"I do not care about the meeting."},{id:"B",text:"Thanks for inviting me, but I have another commitment. Could we find another time?"},{id:"C",text:"You must change the meeting for me."},{id:"D",text:"Meeting is not my thing."}],points:1,answer:"B",explanation:"คำตอบ B สุภาพและชัดเจน: ขอบคุณสำหรับคำเชิญ แจ้งว่าติดภารกิจ และเสนอเวลาทางเลือก",steps:["A ไม่สุภาพ","B แสดงความขอบคุณและเสนอทางออก","C เป็นการสั่งมากกว่าการตอบรับ","D ไม่เหมาะกับบริบททางการ"]},
  {id:"t1q2",question_no:2,section:"Speaking",format:"บทสนทนาสั้น",prompt:"Choose the best response. A: “Would you mind opening the window?” B: “_____”",passage:null,options:[{id:"A",text:"Not at all."},{id:"B",text:"Yes, I would mind you."},{id:"C",text:"I am not a window."},{id:"D",text:"The window was yesterday."}],points:1,answer:"A",explanation:"Not at all หมายถึงไม่รังเกียจเลย เป็นการตอบรับคำขอที่เป็นธรรมชาติ",steps:["Would you mind ใช้ถามความสมัครใจ","Not at all บอกว่าไม่เป็นไร"]},
  {id:"t1q3",question_no:3,section:"Reading",format:"อ่านจับใจความ",prompt:"What is the main purpose of the passage?",passage:"A community library started a weekend reading club for teenagers. Volunteers help members choose books, discuss stories, and practise presenting their ideas. After three months, the library noticed that more teenagers were borrowing books and attending community events.",options:[{id:"A",text:"To advertise a new commercial bookstore."},{id:"B",text:"To describe how a reading club encourages teenagers to read and participate."},{id:"C",text:"To explain why libraries should close on weekends."},{id:"D",text:"To compare school examinations in different towns."}],points:1,answer:"B",explanation:"ใจความหลักคือการอธิบายว่าชมรมอ่านหนังสือช่วยให้วัยรุ่นอ่านหนังสือและเข้าร่วมกิจกรรมชุมชนมากขึ้น",steps:["หา topic ของย่อหน้า","พิจารณากิจกรรมและผลที่เกิดขึ้น","สรุปจุดประสงค์ของทั้ง passage"]}
 ],
 "demo-tgat2": [
  {id:"t2q1",question_no:1,section:"ภาษา",format:"การสื่อความหมาย",prompt:"สุภาษิต “น้ำขึ้นให้รีบตัก” สื่อความหมายใกล้เคียงกับข้อใดมากที่สุด",passage:null,options:[{id:"A",text:"ทำงานโดยไม่วางแผน"},{id:"B",text:"ใช้โอกาสที่เหมาะสมให้เกิดประโยชน์"},{id:"C",text:"รอให้ผู้อื่นตัดสินใจแทน"},{id:"D",text:"หลีกเลี่ยงความเปลี่ยนแปลง"}],points:1,answer:"B",explanation:"สุภาษิตนี้สอนให้ใช้ประโยชน์จากช่วงเวลาหรือโอกาสที่เอื้ออำนวย",steps:["น้ำขึ้นเปรียบกับโอกาส","รีบตักคือการลงมือใช้โอกาส"]},
  {id:"t2q2",question_no:2,section:"จำนวน",format:"อนุกรมตัวเลข",prompt:"ลำดับ 2, 6, 12, 20, 30, ... จำนวนถัดไปคือข้อใด",passage:null,options:[{id:"A",text:"36"},{id:"B",text:"40"},{id:"C",text:"41"},{id:"D",text:"42"}],points:1,answer:"D",explanation:"ผลต่างคือ 4, 6, 8, 10 ดังนั้นผลต่างถัดไปคือ 12 และ 30 + 12 = 42",steps:["หาผลต่างทีละคู่","ผลต่างเพิ่มขึ้นครั้งละ 2","30 + 12 = 42"]},
  {id:"t2q3",question_no:3,section:"มิติสัมพันธ์",format:"พับกล่อง",prompt:"กำหนดให้หน้าตรงข้ามของลูกบาศก์เป็นคู่ A–D, B–E และ C–F หน้าที่อยู่ตรงข้ามกับ B คือข้อใด",passage:null,options:[{id:"A",text:"A"},{id:"B",text:"C"},{id:"C",text:"D"},{id:"D",text:"E"}],points:1,answer:"D",explanation:"โจทย์กำหนดคู่หน้าตรงข้าม B–E โดยตรง จึงตอบ E",steps:["อ่านคู่หน้าตรงข้ามที่กำหนด","B จับคู่กับ E"]}
 ],
 "demo-tpat3": [
  {id:"p3q1",question_no:1,section:"ตัวเลข",format:"อนุกรมตัวเลข",prompt:"ลำดับ 5, 9, 17, 33, 65, ... จำนวนถัดไปคือข้อใด",passage:null,options:[{id:"A",text:"97"},{id:"B",text:"121"},{id:"C",text:"129"},{id:"D",text:"130"}],points:1,answer:"C",explanation:"แต่ละพจน์คูณ 2 แล้วลบ 1 ดังนั้น 65 × 2 − 1 = 129",steps:["พบรูปแบบคูณสองลบหนึ่ง","คำนวณ 65 × 2 − 1"]},
  {id:"p3q2",question_no:2,section:"มิติสัมพันธ์",format:"ภาพด้านของรูปทรง 3 มิติ",prompt:"วัตถุทรงลูกบาศก์ถูกมองจากด้านบน ภาพฉายพื้นฐานจะมีลักษณะเป็นรูปใด",passage:null,options:[{id:"A",text:"วงกลม"},{id:"B",text:"สี่เหลี่ยมจัตุรัส"},{id:"C",text:"สามเหลี่ยม"},{id:"D",text:"ห้าเหลี่ยม"}],points:1,answer:"B",explanation:"เมื่อมองลูกบาศก์จากด้านบน ภาพฉายพื้นฐานเป็นสี่เหลี่ยมจัตุรัส",steps:["พิจารณาหน้าบนของลูกบาศก์","หน้าของลูกบาศก์เป็นสี่เหลี่ยมจัตุรัส"]},
  {id:"p3q3",question_no:3,section:"กลไก",format:"กลไกเครื่องกล",prompt:"คานชนิดที่ 1 มีจุดหมุนอยู่ระหว่างแรงพยายามกับแรงต้าน ตัวอย่างใดตรงกับหลักการนี้",passage:null,options:[{id:"A",text:"รถเข็นดิน"},{id:"B",text:"แหนบ"},{id:"C",text:"กรรไกร"},{id:"D",text:"ที่เปิดขวด"}],points:1,answer:"C",explanation:"กรรไกรเป็นคานชนิดที่ 1 เพราะจุดหมุนอยู่ระหว่างแรงพยายามที่ด้ามจับกับแรงต้านที่ใบมีด",steps:["หาตำแหน่งจุดหมุน","จุดหมุนอยู่ระหว่างแรงพยายามและแรงต้าน"]}
 ],
 "demo-bio": [
  {id:"bq1",question_no:1,section:"ระบบหายใจ",format:"ระบบหายใจ",prompt:"บริเวณใดของปอดเป็นตำแหน่งหลักที่เกิดการแลกเปลี่ยนแก๊สระหว่างอากาศกับเลือด",passage:null,options:[{id:"A",text:"ถุงลมปอด"},{id:"B",text:"หลอดลมคอ"},{id:"C",text:"กล่องเสียง"},{id:"D",text:"โพรงจมูก"}],points:1,answer:"A",explanation:"ถุงลมปอดมีผนังบางและมีเส้นเลือดฝอยหนาแน่น จึงเป็นบริเวณหลักของการแลกเปลี่ยนแก๊ส",steps:["อากาศเข้าสู่ถุงลม","ออกซิเจนแพร่เข้าสู่เลือด","คาร์บอนไดออกไซด์แพร่ออก"]},
  {id:"bq2",question_no:2,section:"ระบบหมุนเวียนเลือด",format:"ระบบหมุนเวียนเลือด",prompt:"หลอดเลือดชนิดใดทำหน้าที่นำเลือดออกจากหัวใจไปยังส่วนต่าง ๆ ของร่างกาย",passage:null,options:[{id:"A",text:"หลอดเลือดดำ"},{id:"B",text:"หลอดเลือดฝอย"},{id:"C",text:"หลอดเลือดแดง"},{id:"D",text:"ท่อน้ำเหลือง"}],points:1,answer:"C",explanation:"หลอดเลือดแดงนำเลือดออกจากหัวใจไปยังอวัยวะต่าง ๆ",steps:["พิจารณาทิศทางการไหล","หลอดเลือดแดงนำเลือดออกจากหัวใจ"]},
  {id:"bq3",question_no:3,section:"ระบบย่อยอาหาร",format:"ระบบย่อยอาหาร",prompt:"เอนไซม์อะไมเลสในน้ำลายเริ่มย่อยสารอาหารชนิดใด",passage:null,options:[{id:"A",text:"โปรตีน"},{id:"B",text:"แป้ง"},{id:"C",text:"ไขมัน"},{id:"D",text:"กรดนิวคลีอิก"}],points:1,answer:"B",explanation:"อะไมเลสในน้ำลายเริ่มย่อยแป้งให้เป็นน้ำตาลสายสั้น",steps:["อะไมเลสย่อยคาร์โบไฮเดรต","สารตั้งต้นคือแป้ง"]}
 ]
};

const groupColors: Record<string,string> = { TGAT1:"blue", TGAT2:"violet", TPAT3:"amber", A_LEVEL:"green" };
const formatTime = (seconds: number) => `${Math.floor(seconds/60).toString().padStart(2,"0")}:${(seconds%60).toString().padStart(2,"0")}`;

export function TcasPractice({ demoMode }: { demoMode: boolean }) {
 const [sets,setSets] = useState<ExamSet[]>(demoMode ? demoSets : []);
 const [selected,setSelected] = useState<ExamSet|null>(null);
 const [questions,setQuestions] = useState<Question[]>([]);
 const [answers,setAnswers] = useState<Record<string,string>>({});
 const [flags,setFlags] = useState<Record<string,boolean>>({});
 const [index,setIndex] = useState(0);
 const [attemptId,setAttemptId] = useState<string|null>(null);
 const [remaining,setRemaining] = useState(0);
 const [running,setRunning] = useState(false);
 const [results,setResults] = useState<Result[]>([]);
 const [summary,setSummary] = useState<{earned_points:number;max_points:number;correct_count:number;question_count:number;status:string}|null>(null);
 const [history,setHistory] = useState<Array<{id:string;status:string;earned_points:number;max_points:number;correct_count:number;question_count:number;started_at:string}>>([]);
 const [busy,setBusy] = useState(false);
 const [error,setError] = useState("");
 const [tab,setTab] = useState<"practice"|"history">("practice");
 const supabase = useMemo(() => demoMode ? null : createClient(),[demoMode]);

 useEffect(() => {
  if (demoMode || !supabase) return;
  let active = true;
  (async()=>{
   const db = supabase as any;
   const [{data:catalog},{data:userData}] = await Promise.all([
    db.from("tcas_exam_sets").select("id,slug,code,title,exam_group,description,duration_minutes,formats").eq("is_published",true).order("code"),
    supabase.auth.getUser()
   ]);
   if (!active) return;
   if (catalog) setSets(catalog);
   if (userData.user) {
    const {data:attempts} = await db.from("tcas_attempts").select("id,status,earned_points,max_points,correct_count,question_count,started_at").eq("user_id",userData.user.id).order("started_at",{ascending:false}).limit(20);
    if (active && attempts) setHistory(attempts);
   }
  })();
  return ()=>{active=false;};
 },[demoMode,supabase]);

 useEffect(()=>{
  if (!running) return;
  const timer = window.setInterval(()=>setRemaining(v=>Math.max(0,v-1)),1000);
  return ()=>window.clearInterval(timer);
 },[running]);

 useEffect(()=>{
  if (running && remaining===0) void submitExam(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[remaining,running]);

 const startExam = async (set:ExamSet)=>{
  setBusy(true); setError(""); setSelected(set); setResults([]); setSummary(null); setAnswers({}); setFlags({}); setIndex(0);
  if (demoMode) {
   const qs=demoQuestions[set.id] ?? [];
   setQuestions(qs); setAttemptId("demo-"+Date.now()); setRemaining(set.duration_minutes*60); setRunning(true); setBusy(false); return;
  }
  if (!supabase) {setError("Supabase is not configured.");setBusy(false);return;}
  const db=supabase as any;
  const [{data:userData,error:userError},{data:qs,error:qError}] = await Promise.all([
   supabase.auth.getUser(),
   db.from("tcas_questions").select("id,question_no,section,format,prompt,passage,options,points").eq("exam_set_id",set.id).order("sort_order")
  ]);
  if(userError||!userData.user){setError("กรุณาเข้าสู่ระบบด้วยบัญชีนักเรียนก่อนเริ่มทำข้อสอบ");setBusy(false);return;}
  if(qError||!qs?.length){setError(qError?.message??"ยังไม่มีข้อสอบในชุดนี้");setBusy(false);return;}
  const {data:attempt,error:attemptError}=await db.from("tcas_attempts").insert({user_id:userData.user.id,exam_set_id:set.id,status:"in_progress",time_limit_seconds:set.duration_minutes*60,question_count:qs.length}).select("id").single();
  if(attemptError||!attempt){setError(attemptError?.message??"สร้างรอบสอบไม่สำเร็จ");setBusy(false);return;}
  setQuestions(qs);setAttemptId(attempt.id);setRemaining(set.duration_minutes*60);setRunning(true);setBusy(false);
 };

 const saveAnswer = async (question:Question,value:string)=>{
  setAnswers(current=>({...current,[question.id]:value}));
  if(demoMode||!supabase||!attemptId) return;
  const db=supabase as any;
  const {error:saveError}=await db.from("tcas_attempt_answers").upsert({attempt_id:attemptId,question_id:question.id,answer:value,flag_for_review:Boolean(flags[question.id]),answered_at:new Date().toISOString()},{onConflict:"attempt_id,question_id"});
  if(saveError) setError("บันทึกคำตอบไม่สำเร็จ: "+saveError.message);
 };

 const toggleFlag = async (question:Question)=>{
  const next=!flags[question.id]; setFlags(current=>({...current,[question.id]:next}));
  if(!demoMode&&supabase&&attemptId){
   const db=supabase as any;
   const {error:saveError}=await db.from("tcas_attempt_answers").upsert({attempt_id:attemptId,question_id:question.id,answer:answers[question.id]??null,flag_for_review:next},{onConflict:"attempt_id,question_id"});
   if(saveError) setError("บันทึกสถานะข้อสอบไม่สำเร็จ");
  }
 };

 const submitExam = useCallback(async (auto=false)=>{
  if(!selected||!attemptId||!running) return;
  setBusy(true);setError("");setRunning(false);
  if(demoMode){
   const qs=demoQuestions[selected.id]??[];
   const marked=qs.map(q=>({question_id:q.id,submitted_answer:answers[q.id]??null,correct_answer:q.answer??"",is_correct:(answers[q.id]??"")===q.answer,earned_points:(answers[q.id]??"")===q.answer?q.points:0,max_points:q.points,explanation:q.explanation??"",solution_steps:q.steps??[]}));
   const correct=marked.filter(r=>r.is_correct).length;
   setResults(marked);setSummary({earned_points:correct,max_points:qs.length,correct_count:correct,question_count:qs.length,status:auto?"expired":"submitted"});setBusy(false);return;
  }
  if(!supabase){setError("Supabase is not configured.");setBusy(false);return;}
  const db=supabase as any;
  const {data:gradeData,error:gradeError}=await db.rpc("grade_tcas_attempt",{_attempt_id:attemptId});
  if(gradeError){setError(gradeError.message);setRunning(true);setBusy(false);return;}
  const {data:resultRows,error:resultError}=await db.from("tcas_attempt_results").select("question_id,submitted_answer,correct_answer,is_correct,earned_points,max_points,explanation,solution_steps").eq("attempt_id",attemptId);
  if(resultError){setError(resultError.message);setBusy(false);return;}
  setResults((resultRows??[]) as Result[]);setSummary(gradeData);setBusy(false);
  const {data:userData}=await supabase.auth.getUser();
  if(userData.user){const {data:attempts}=await db.from("tcas_attempts").select("id,status,earned_points,max_points,correct_count,question_count,started_at").eq("user_id",userData.user.id).order("started_at",{ascending:false}).limit(20);if(attempts)setHistory(attempts);}
 },[selected,attemptId,running,demoMode,answers,supabase]);

 const reset = ()=>{setSelected(null);setQuestions([]);setAnswers({});setFlags({});setAttemptId(null);setRunning(false);setSummary(null);setResults([]);setError("");};
 const current=questions[index];
 const resultByQuestion=useMemo(()=>new Map(results.map(r=>[r.question_id,r])),[results]);
 const answered=Object.keys(answers).length;
 const progress=questions.length?Math.round(answered/questions.length*100):0;

 return <div className="tcas-shell">
  <div className="tcas-heading">
   <div><div className="tcas-eyebrow"><GraduationCap size={15}/> RNMCOM LEARNING CENTER</div><h1>TCAS Academy</h1><p>ฝึกทำข้อสอบเข้ามหาวิทยาลัย จับเวลา ตรวจคะแนน และทบทวนเฉลยในที่เดียว</p></div>
   <div className="tcas-tabs"><button className={tab==="practice"?"active":""} onClick={()=>{setTab("practice");reset();}}>คลังข้อสอบ</button><button className={tab==="history"?"active":""} onClick={()=>{setTab("history");reset();}}>ประวัติการทำ</button></div>
  </div>
  {error&&<div className="tcas-alert">{error}</div>}
  {tab==="history"? <section className="tcas-panel"><div className="tcas-panel-title"><div><h2>ประวัติการทำข้อสอบ</h2><p>ผลการฝึกย้อนหลัง 20 ครั้งล่าสุด</p></div><BookOpen/></div>{history.length?<div className="tcas-history">{history.map(h=><article key={h.id}><div><strong>{h.status==="submitted"?"ส่งแล้ว":h.status==="expired"?"หมดเวลา":"กำลังทำ"}</strong><span>{new Date(h.started_at).toLocaleString("th-TH")}</span></div><b>{h.max_points?Math.round(h.earned_points/h.max_points*100):0}%</b><span>{h.correct_count}/{h.question_count} ข้อ</span></article>)}</div>:<div className="tcas-empty">ยังไม่มีประวัติการทำข้อสอบ</div>}</section>
  : summary? <section className="tcas-panel">
   <div className="tcas-result-hero"><span className="tcas-result-icon"><Award size={27}/></span><div><span>ผลการสอบ · {selected?.code}</span><h2>{summary.max_points?Math.round(summary.earned_points/summary.max_points*100):0}<small>/100</small></h2><p>ตอบถูก {summary.correct_count} จาก {summary.question_count} ข้อ · {summary.status==="expired"?"หมดเวลา":"ส่งข้อสอบแล้ว"}</p></div></div>
   <div className="tcas-result-grid"><div><span>คะแนนที่ได้</span><strong>{summary.earned_points}/{summary.max_points}</strong></div><div><span>ความถูกต้อง</span><strong>{summary.question_count?Math.round(summary.correct_count/summary.question_count*100):0}%</strong></div><div><span>ข้อที่ตอบ</span><strong>{answered}/{summary.question_count}</strong></div></div>
   <div className="tcas-review-head"><h3>เฉลยและคำอธิบาย</h3><button onClick={reset}><RotateCcw size={15}/> เลือกชุดใหม่</button></div>
   {questions.map((q,i)=>{const r=resultByQuestion.get(q.id);return <article className="tcas-review-item" key={q.id}><div className="tcas-review-q"><b>ข้อ {i+1} · {q.format}</b><span className={r?.is_correct?"correct":"incorrect"}>{r?.is_correct?"ถูกต้อง":"ยังไม่ถูก"}</span></div><p>{q.prompt}</p><div className="tcas-review-answer">คำตอบของคุณ: <b>{r?.submitted_answer??"ไม่ได้ตอบ"}</b> · เฉลย: <b>{r?.correct_answer}</b></div><p className="tcas-explanation">{r?.explanation}</p><ol>{r?.solution_steps?.map((step,j)=><li key={j}>{step}</li>)}</ol></article>})}
  </section>
  : selected&&running&&current? <section className="tcas-panel tcas-exam-layout">
   <div className="tcas-exam-top"><button className="tcas-back" onClick={()=>{if(confirm("ออกจากข้อสอบ? คำตอบที่บันทึกไว้จะยังคงอยู่ แต่รอบสอบยังไม่ถูกส่ง")){setRunning(false);setSelected(null);}}}><ArrowLeft size={15}/> กลับหน้าคลังข้อสอบ</button><div className={remaining<60?"tcas-timer danger":"tcas-timer"}><Timer size={17}/>{formatTime(remaining)}</div></div>
   <div className="tcas-exam-meta"><div><span>{selected.code}</span><h2>{selected.title}</h2><p>{selected.description}</p></div><div className="tcas-progress"><b>{answered}/{questions.length}</b><span>ตอบแล้ว</span><div><i style={{width:progress+"%"}}/></div></div></div>
   <div className="tcas-question-layout"><aside className="tcas-question-nav"><b>รายการข้อสอบ</b><div>{questions.map((q,i)=><button key={q.id} className={i===index?"current":answers[q.id]?"answered":""} onClick={()=>setIndex(i)}>{i+1}{flags[q.id]&&<Flag size={10}/>}</button>)}</div><small><i className="answered-dot"/> ตอบแล้ว <i className="flag-dot"/> ทำเครื่องหมาย</small></aside>
    <div className="tcas-question"><div className="tcas-question-kicker">ข้อ {index+1} จาก {questions.length} <span>{current.section} · {current.format}</span></div>{current.passage&&<div className="tcas-passage">{current.passage}</div>}<h3>{current.prompt}</h3><div className="tcas-options">{current.options.map(option=><button key={option.id} className={answers[current.id]===option.id?"selected":""} onClick={()=>void saveAnswer(current,option.id)}><b>{option.id}</b><span>{option.text}</span>{answers[current.id]===option.id&&<CheckCircle2 size={17}/>}</button>)}</div><div className="tcas-question-actions"><button className={flags[current.id]?"flagged":""} onClick={()=>void toggleFlag(current)}><Flag size={15}/> {flags[current.id]?"ยกเลิกทำเครื่องหมาย":"ทำเครื่องหมายไว้"}</button><div><button disabled={index===0} onClick={()=>setIndex(v=>v-1)}><ArrowLeft size={15}/> ก่อนหน้า</button><button className="next" disabled={index===questions.length-1} onClick={()=>setIndex(v=>v+1)}>ถัดไป <ArrowRight size={15}/></button></div></div></div>
   </div>
   <div className="tcas-submit-row"><span>เหลือ {questions.length-answered} ข้อที่ยังไม่ได้ตอบ</span><button disabled={busy} onClick={()=>{if(confirm("ยืนยันส่งข้อสอบและตรวจคะแนน? หลังส่งจะกลับมาแก้คำตอบไม่ได้"))void submitExam(false);}}><Send size={15}/> {busy?"กำลังตรวจ...":"ส่งข้อสอบ"}</button></div>
  </section>
  : <div className="tcas-catalog">
   <section className="tcas-banner"><div><span>UNIVERSITY ADMISSION PREPARATION</span><h2>ซ้อมให้พร้อม ก่อนลงสนามจริง</h2><p>เลือกชุดข้อสอบ ฝึกทำตามเวลา พร้อมวิเคราะห์ข้อผิดพลาดจากเฉลยทีละขั้น</p></div><div className="tcas-banner-mark"><GraduationCap size={48}/><b>TCAS</b><small>PREPARE · PRACTICE · PROGRESS</small></div></section>
   <div className="tcas-stats"><div><BookOpen/><b>{sets.length}</b><span>ชุดข้อสอบ</span></div><div><Target/><b>{sets.reduce((sum,s)=>sum+(demoMode?(demoQuestions[s.id]??[]).length:0),0)||15}+</b><span>โจทย์ตัวอย่าง</span></div><div><Clock3/><b>จับเวลา</b><span>จำลองสนามสอบ</span></div></div>
   <div className="tcas-section-heading"><div><h2>เลือกวิชาที่ต้องการฝึก</h2><p>ข้อสอบต้นฉบับสำหรับฝึกทักษะ ไม่ใช่ข้อสอบทางการ</p></div></div>
   <div className="tcas-set-grid">{sets.map(set=><article className="tcas-set-card" key={set.id}><div className={"tcas-set-code "+(groupColors[set.exam_group]??"blue")}>{set.code}</div><h3>{set.title}</h3><p>{set.description}</p><div className="tcas-chips">{set.formats.slice(0,4).map(f=><span key={f}>{f}</span>)}</div><div className="tcas-set-footer"><span><Clock3 size={14}/> {set.duration_minutes} นาที</span><span><BookOpen size={14}/> {demoMode?(demoQuestions[set.id]??[]).length:"ชุดโจทย์" } ข้อ</span></div><button disabled={busy} onClick={()=>void startExam(set)}>{busy?"กำลังเตรียม...":"เริ่มทำข้อสอบ"} <ArrowRight size={15}/></button></article>)}</div>
   <div className="tcas-disclaimer">ข้อสอบและเฉลยตัวอย่างจัดทำขึ้นใหม่เพื่อการฝึกฝนโดย RNMCOM ไม่ใช่ข้อสอบจริงหรือบริการอย่างเป็นทางการของ ทปอ.</div>
  </div>}
 </div>;
}
