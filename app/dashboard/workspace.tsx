"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, AlertCircle, ArrowRight, ArrowUpRight, Award, BarChart3,
  Bell, BookOpen, CalendarCheck, CalendarClock, CalendarDays, Check,
  CheckCircle2, ChevronDown, CircleHelp, Clock3, Download, FileCheck,
  Filter, GraduationCap, LayoutDashboard, LogOut, Mail, Menu, MessageSquare,
  MoreHorizontal, Plus, Search, Settings, ShieldCheck, Sparkles, Users,
  Wallet, X, UserRound, ClipboardList, FileText, UserPlus
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  demoAnnouncements, demoAssignments, demoNotifications, demoStudents, roleMetrics
} from "@/lib/demo-data";
import {
  ROLE_DESCRIPTIONS, ROLE_LABELS, isAppRole,
  type AppRole, type AnnouncementRow, type AssignmentRow, type StudentRow, type ViewKey
} from "@/lib/types";

type NavItem = { key: ViewKey; label: string; icon: LucideIcon; badge?: string };
type NavGroup = { title: string; items: NavItem[] };
type ModalKind = "assignment" | "announcement" | "attendance";
type ClassOption = { id: string; name: string };
type SubjectOption = { id: string; name: string };

const navigation: Record<AppRole, NavGroup[]> = {
  admin: [
    { title: "Workspace", items: [{ key: "overview", label: "Overview", icon: LayoutDashboard }] },
    { title: "School management", items: [
      { key: "students", label: "Students", icon: Users },
      { key: "teachers", label: "Teachers", icon: UserRound },
      { key: "classes", label: "Classes & subjects", icon: GraduationCap },
    ] },
    { title: "Operations", items: [
      { key: "attendance", label: "Attendance", icon: CalendarCheck, badge: "8" },
      { key: "assignments", label: "Assignments", icon: ClipboardList },
      { key: "communication", label: "Communication", icon: MessageSquare },
    ] },
    { title: "Insights", items: [
      { key: "grades", label: "Academic results", icon: BookOpen },
      { key: "reports", label: "Reports & analytics", icon: BarChart3 },
      { key: "finance", label: "Finance", icon: Wallet },
    ] },
    { title: "Preferences", items: [{ key: "settings", label: "Settings", icon: Settings }] },
  ],
  teacher: [
    { title: "Workspace", items: [{ key: "overview", label: "Overview", icon: LayoutDashboard }] },
    { title: "Teaching", items: [
      { key: "classes", label: "My classes", icon: GraduationCap },
      { key: "attendance", label: "Attendance", icon: CalendarCheck, badge: "3" },
      { key: "assignments", label: "Assignments", icon: ClipboardList, badge: "6" },
      { key: "grades", label: "Grades & feedback", icon: BookOpen },
    ] },
    { title: "Connect", items: [{ key: "communication", label: "Communication", icon: MessageSquare }] },
    { title: "Preferences", items: [{ key: "settings", label: "Settings", icon: Settings }] },
  ],
  homeroom_teacher: [
    { title: "Workspace", items: [{ key: "overview", label: "Overview", icon: LayoutDashboard }] },
    { title: "Class care", items: [
      { key: "students", label: "My students", icon: Users },
      { key: "attendance", label: "Attendance & leave", icon: CalendarCheck, badge: "3" },
      { key: "grades", label: "Student progress", icon: BookOpen },
    ] },
    { title: "Connect", items: [{ key: "communication", label: "Communication", icon: MessageSquare }] },
    { title: "Preferences", items: [{ key: "settings", label: "Settings", icon: Settings }] },
  ],
  student: [
    { title: "My workspace", items: [{ key: "overview", label: "Overview", icon: LayoutDashboard }] },
    { title: "Learning", items: [
      { key: "assignments", label: "My assignments", icon: ClipboardList, badge: "3" },
      { key: "grades", label: "Grades & progress", icon: BookOpen },
      { key: "attendance", label: "Attendance history", icon: CalendarCheck },
    ] },
    { title: "Connect", items: [{ key: "communication", label: "School updates", icon: MessageSquare }] },
    { title: "Preferences", items: [{ key: "settings", label: "Settings", icon: Settings }] },
  ],
  parent: [
    { title: "Family workspace", items: [{ key: "overview", label: "Overview", icon: LayoutDashboard }] },
    { title: "Child's school life", items: [
      { key: "attendance", label: "Attendance", icon: CalendarCheck },
      { key: "assignments", label: "Assignments", icon: ClipboardList, badge: "3" },
      { key: "grades", label: "Academic progress", icon: BookOpen },
      { key: "finance", label: "School fees", icon: Wallet },
    ] },
    { title: "Connect", items: [{ key: "communication", label: "Messages & updates", icon: MessageSquare }] },
    { title: "Preferences", items: [{ key: "settings", label: "Settings", icon: Settings }] },
  ],
};

const pageCopy: Record<ViewKey, { title: string; description: string }> = {
  overview: { title: "Overview", description: "Your school workspace at a glance." },
  students: { title: "Students", description: "Manage student records and keep essential information in context." },
  teachers: { title: "Teachers & staff", description: "Review school staffing and teaching assignments." },
  classes: { title: "Classes & subjects", description: "Keep class structure, subjects and teaching assignments connected." },
  attendance: { title: "Attendance", description: "Monitor attendance records and the actions that need attention." },
  assignments: { title: "Assignments", description: "Create learning tasks, track submissions and review deadlines." },
  grades: { title: "Academic results", description: "Follow learning progress and assessment records." },
  communication: { title: "Communication", description: "Keep school announcements and conversations in one place." },
  reports: { title: "Reports & analytics", description: "Turn school activity into a clear operational picture." },
  finance: { title: "Finance", description: "Review fee status and school-related payment records." },
  settings: { title: "Workspace settings", description: "Manage your profile, preferences and account security." },
};

const iconByMetric: Record<string, LucideIcon> = {
  users: Users, calendar: CalendarCheck, staff: UserRound, pending: AlertCircle,
  check: CheckCircle2, inbox: Mail, award: Award, grade: GraduationCap,
  clock: Clock3, wallet: Wallet,
};

const schedule = [
  { time: "08:30", subject: "Mathematics", detail: "M.5/1 · Functions", room: "Room 402", tone: "blue" },
  { time: "10:20", subject: "Physics", detail: "M.5/2 · Motion", room: "Lab 2", tone: "green" },
  { time: "13:00", subject: "Computer Science", detail: "M.5/3 · Algorithms", room: "Room 305", tone: "violet" },
];

const baseTasks = [
  { id: 1, title: "Review attendance correction requests", note: "3 requests · Attendance", done: false, priority: "amber" },
  { id: 2, title: "Publish next week's assignment", note: "M.5 Mathematics", done: false, priority: "blue" },
  { id: 3, title: "Review student progress summary", note: "Homeroom follow-up", done: true, priority: "green" },
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "RN";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No deadline";
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function MetricCard({ metric }: { metric: (typeof roleMetrics)[AppRole][number] }) {
  const Icon = iconByMetric[metric.icon] ?? Activity;
  const footClass = metric.tone === "amber" ? "metric-foot warning" : metric.tone === "green" ? "metric-foot positive" : "metric-foot";
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{metric.label}</span>
        <span className={`metric-icon ${metric.tone}`}><Icon size={17} /></span>
      </div>
      <div className="metric-value">{metric.value}</div>
      <div className={footClass}><ArrowUpRight size={12} /> {metric.delta}</div>
    </article>
  );
}

function AttendanceChart() {
  return (
    <div>
      <div className="chart-summary">
        <div><strong>95.0%</strong><span>Average attendance this week</span></div>
        <div><span className="status-pill green">+1.8% <ArrowUpRight size={11} /></span><span>vs. last week</span></div>
      </div>
      <div className="chart-legend"><span><i className="legend-dot" /> This week</span><span><i className="legend-dot soft" /> Previous week</span></div>
      <div className="chart-wrap">
        <svg viewBox="0 0 620 190" role="img" aria-label="Attendance trend from Monday to Sunday">
          <defs><linearGradient id="attendanceGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#5482ea" stopOpacity=".22" /><stop offset="100%" stopColor="#5482ea" stopOpacity="0" /></linearGradient></defs>
          {[22, 65, 108, 151].map((y) => <line key={y} x1="0" y1={y} x2="620" y2={y} className="chart-grid-line" />)}
          <path className="chart-area" d="M12 70 C55 64 68 89 105 76 S165 47 204 60 S264 92 302 67 S362 47 401 56 S460 83 498 52 S560 41 608 30 L608 168 L12 168 Z" />
          <path d="M12 86 C55 85 68 101 105 92 S165 77 204 82 S264 111 302 92 S362 76 401 80 S460 100 498 78 S560 72 608 62" fill="none" stroke="#c1d0ed" strokeWidth="2" strokeDasharray="5 5" />
          <path className="chart-line" d="M12 70 C55 64 68 89 105 76 S165 47 204 60 S264 92 302 67 S362 47 401 56 S460 83 498 52 S560 41 608 30" />
          {[12,105,204,302,401,498,608].map((x,i) => {
            const y = [70,76,60,67,56,52,30][i];
            return <circle key={x} className="chart-point" cx={x} cy={y} r="4" />;
          })}
        </svg>
      </div>
      <div className="chart-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
    </div>
  );
}

function Dashboard({
  role, name, students, assignments, announcements, tasks, onTaskToggle, onNavigate, onCreate
}: {
  role: AppRole;
  name: string;
  students: StudentRow[];
  assignments: AssignmentRow[];
  announcements: AnnouncementRow[];
  tasks: typeof baseTasks;
  onTaskToggle: (id: number) => void;
  onNavigate: (view: ViewKey) => void;
  onCreate: (kind: ModalKind) => void;
}) {
  const metrics = roleMetrics[role];
  const greet = role === "parent" ? "Good afternoon" : "Good afternoon";
  const actions: { title: string; detail: string; icon: LucideIcon; view: ViewKey; kind?: ModalKind }[] = role === "admin"
    ? [
      { title: "Add student", detail: "Student records", icon: UserPlus, view: "students" },
      { title: "Start attendance", detail: "Class check-in", icon: CalendarCheck, view: "attendance", kind: "attendance" },
      { title: "Create announcement", detail: "School-wide update", icon: MessageSquare, view: "communication", kind: "announcement" },
      { title: "View reports", detail: "School insights", icon: BarChart3, view: "reports" },
    ]
    : role === "teacher"
      ? [
        { title: "Start attendance", detail: "Take class register", icon: CalendarCheck, view: "attendance", kind: "attendance" },
        { title: "Create assignment", detail: "Set learning task", icon: ClipboardList, view: "assignments", kind: "assignment" },
        { title: "Review submissions", detail: "6 to grade", icon: FileCheck, view: "assignments" },
        { title: "Send announcement", detail: "Contact your classes", icon: ArrowUpRight, view: "communication", kind: "announcement" },
      ]
      : role === "homeroom_teacher"
        ? [
          { title: "View my students", detail: "Class overview", icon: Users, view: "students" },
          { title: "Review attendance", detail: "Follow-up list", icon: CalendarCheck, view: "attendance" },
          { title: "Student progress", detail: "Academic overview", icon: GraduationCap, view: "grades" },
          { title: "Contact guardians", detail: "Communication", icon: MessageSquare, view: "communication" },
        ]
        : role === "student"
          ? [
            { title: "My assignments", detail: "3 tasks to complete", icon: ClipboardList, view: "assignments" },
            { title: "Study progress", detail: "Review grades", icon: GraduationCap, view: "grades" },
            { title: "Class timetable", detail: "Today's schedule", icon: CalendarDays, view: "attendance" },
            { title: "School updates", detail: "Latest news", icon: MessageSquare, view: "communication" },
          ]
          : [
            { title: "Attendance", detail: "Today's school arrival", icon: CalendarCheck, view: "attendance" },
            { title: "Assignments", detail: "Upcoming deadlines", icon: ClipboardList, view: "assignments" },
            { title: "Academic progress", detail: "Current semester", icon: GraduationCap, view: "grades" },
            { title: "Contact teacher", detail: "Send a message", icon: MessageSquare, view: "communication" },
          ];

  return (
    <>
      <div className="page-heading">
        <div><div className="breadcrumb">School workspace / {ROLE_LABELS[role]}</div><h1>{greet}, {name.split(" ")[0]}</h1><p>{ROLE_DESCRIPTIONS[role]}</p></div>
        <div className="heading-actions"><button className="secondary-button" onClick={() => onNavigate("reports")}><BarChart3 size={15} /> View insights</button><button className="primary-button" onClick={() => onCreate(role === "teacher" ? "assignment" : "announcement")}><Plus size={15} /> {role === "teacher" ? "New assignment" : "New announcement"}</button></div>
      </div>

      <section className="metric-grid">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</section>

      <section className="dashboard-grid">
        <div>
          <section className="panel">
            <div className="panel-header"><div><h2 className="panel-title">{role === "student" ? "My learning rhythm" : role === "parent" ? "Attendance overview" : "Attendance overview"}</h2><p className="panel-subtitle">{role === "student" ? "Your attendance and consistency over time" : "A weekly view of school attendance"}</p></div><select className="period-select" aria-label="Attendance time period" defaultValue="week"><option value="week">This week</option><option value="month">This month</option><option value="term">This term</option></select></div>
            <AttendanceChart />
          </section>
          <section className="panel">
            <div className="panel-header"><div><h2 className="panel-title">{role === "student" ? "Upcoming deadlines" : role === "parent" ? "Child's learning tasks" : role === "homeroom_teacher" ? "Students to follow up" : "Priority actions"}</h2><p className="panel-subtitle">Items that may need your attention</p></div><button className="panel-link" onClick={() => onNavigate(role === "student" || role === "parent" ? "assignments" : "attendance")}>View all <ArrowRight size={13} /></button></div>
            {role === "student" || role === "parent" ? (
              <div className="task-list">{assignments.slice(0,3).map((a) => <div className="task-item" key={a.id}><div className="task-check"><FileCheck size={11} /></div><div className="task-copy"><strong>{a.title}</strong><span>{a.class_name || "Class assignment"} · {formatRelativeDate(a.due_at)}</span></div><span className={`status-pill ${a.status === "Draft" ? "gray" : "amber"}`}>{a.status}</span></div>)}</div>
            ) : (
              <div className="task-list">{tasks.map((task) => <div className="task-item" key={task.id}><button className={`task-check ${task.done ? "done" : ""}`} onClick={() => onTaskToggle(task.id)} aria-label={task.done ? "Mark task incomplete" : "Mark task complete"}>{task.done && <Check size={11} />}</button><div className="task-copy"><strong>{task.title}</strong><span>{task.note}</span></div><span className={`status-pill ${task.priority}`}>{task.done ? "Done" : "Action"}</span></div>)}</div>
            )}
          </section>
        </div>

        <div>
          <section className="panel">
            <div className="panel-header"><div><h2 className="panel-title">{role === "student" ? "Today's timetable" : role === "parent" ? "Today's school day" : "Today's schedule"}</h2><p className="panel-subtitle">Tuesday, 10 November 2026</p></div><button className="panel-link" onClick={() => onNavigate("classes")}>Full schedule <ArrowRight size={13} /></button></div>
            <div className="schedule-list">{schedule.map((item) => <div className="schedule-item" key={item.time}><span className="schedule-time">{item.time}</span><i className={`schedule-line ${item.tone}`} /><div className="schedule-copy"><strong>{item.subject}</strong><span>{item.detail}</span></div><span className="schedule-room">{item.room}</span></div>)}</div>
          </section>
          <section className="panel">
            <div className="panel-header"><div><h2 className="panel-title">Quick actions</h2><p className="panel-subtitle">Go straight to a common task</p></div><Sparkles size={16} color="#8a9bb5" /></div>
            <div className="quick-action-grid">{actions.map((action) => { const Icon = action.icon; return <button key={action.title} className="quick-action" onClick={() => action.kind ? onCreate(action.kind) : onNavigate(action.view)}><span className="quick-action-icon"><Icon size={16} /></span><span><strong>{action.title}</strong><span>{action.detail}</span></span></button>; })}</div>
          </section>
          <section className="panel">
            <div className="panel-header"><div><h2 className="panel-title">School announcements</h2><p className="panel-subtitle">Latest updates from your school</p></div><button className="panel-link" onClick={() => onNavigate("communication")}>See all <ArrowRight size={13} /></button></div>
            {announcements.slice(0,2).map((item) => <article className="announcement-item" key={item.id}><div className="announcement-meta"><span>{item.author || "School office"}</span><span>{formatDate(item.created_at)}</span></div><strong>{item.title}</strong><p>{item.body}</p></article>)}
            {announcements.length === 0 && <div className="inline-empty">No announcements yet.</div>}
          </section>
        </div>
      </section>
    </>
  );
}


function StudentTable({ rows }: { rows: StudentRow[] }) {
  return (
    <section className="panel table-panel">
      <div className="panel-header"><div><h2 className="panel-title">Student directory</h2><p className="panel-subtitle">{rows.length} records in the current view</p></div><div className="table-tools"><button className="secondary-button" disabled><Filter size={14} /> Filter</button><button className="secondary-button" disabled><Download size={14} /> Export</button></div></div>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Student</th><th>Student ID</th><th>Year</th><th>Class</th><th>Attendance</th><th>Status</th></tr></thead><tbody>{rows.map((student) => <tr key={student.id}><td><div className="table-person"><span className="mini-avatar">{initials(student.first_name + " " + student.last_name)}</span><div><strong>{student.first_name} {student.last_name}</strong><span>Student profile</span></div></div></td><td>{student.student_code}</td><td>{student.grade_level}</td><td>{student.class_name || "—"}</td><td><span className={`status-pill ${student.attendance === "Absent" ? "red" : student.attendance === "Late" ? "amber" : "green"}`}>{student.attendance || "—"}</span></td><td><span className="status-pill green">{student.status || "Active"}</span></td></tr>)}</tbody></table>{rows.length === 0 && <div className="table-empty">No student records match this search.</div>}</div>
    </section>
  );
}

function AssignmentTable({ rows }: { rows: AssignmentRow[] }) {
  return (
    <section className="panel table-panel">
      <div className="panel-header"><div><h2 className="panel-title">Assignment tracker</h2><p className="panel-subtitle">Publication status and upcoming deadlines</p></div><span className="status-pill blue">{rows.length} assignments</span></div>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Assignment</th><th>Class / subject</th><th>Due date</th><th>Submissions</th><th>Status</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><div className="table-person"><span className="mini-avatar"><FileText size={14} /></span><div><strong>{item.title}</strong><span>Learning task</span></div></div></td><td>{item.class_name || "—"}</td><td><strong>{formatDate(item.due_at)}</strong><div style={{ marginTop: 4, color: "#9aa5b4", fontSize: 9 }}>{formatRelativeDate(item.due_at)}</div></td><td>{item.submissions ?? "—"}</td><td><span className={`status-pill ${item.status === "Published" ? "green" : item.status === "Grading" ? "amber" : "gray"}`}>{item.status}</span></td></tr>)}</tbody></table>{rows.length === 0 && <div className="table-empty">No assignments yet. Create the first learning task.</div>}</div>
    </section>
  );
}

function ModuleView({
  view, role, students, assignments, announcements, query, onCreate, onNavigate
}: {
  view: ViewKey;
  role: AppRole;
  students: StudentRow[];
  assignments: AssignmentRow[];
  announcements: AnnouncementRow[];
  query: string;
  onCreate: (kind: ModalKind) => void;
  onNavigate: (view: ViewKey) => void;
}) {
  const filteredStudents = students.filter((s) => `${s.first_name} ${s.last_name} ${s.student_code} ${s.class_name}`.toLowerCase().includes(query.toLowerCase()));
  const filteredAssignments = assignments.filter((a) => `${a.title} ${a.class_name}`.toLowerCase().includes(query.toLowerCase()));
  if (view === "students") return <><div className="page-heading"><div><div className="breadcrumb">School management</div><h1>{pageCopy.students.title}</h1><p>{pageCopy.students.description}</p></div><div className="heading-actions"><button className="primary-button" onClick={() => onNavigate("settings")}><Plus size={15} /> Account provisioning</button></div></div><div className="section-note"><ShieldCheck size={17} /><span>Student records are protected by relationship-aware access policies. Creating a student requires a provisioned account and an authorized school administrator.</span></div><div style={{ height: 15 }} /><StudentTable rows={filteredStudents} /></>;
  if (view === "assignments") return <><div className="page-heading"><div><div className="breadcrumb">Learning management</div><h1>{pageCopy.assignments.title}</h1><p>{pageCopy.assignments.description}</p></div>{(role === "admin" || role === "teacher") && <div className="heading-actions"><button className="primary-button" onClick={() => onCreate("assignment")}><Plus size={15} /> Create assignment</button></div>}</div><div className="module-grid" style={{ marginBottom: 16 }}><div className="module-card"><span className="status-pill blue">Published</span><div className="module-stat">{filteredAssignments.filter((a) => a.status === "Published").length}</div><p>Active assignments in your workspace</p></div><div className="module-card"><span className="status-pill amber">Needs attention</span><div className="module-stat">{filteredAssignments.filter((a) => a.status === "Grading").length}</div><p>Assignments currently being reviewed</p></div></div><AssignmentTable rows={filteredAssignments} /></>;
  if (view === "attendance") return <><div className="page-heading"><div><div className="breadcrumb">School operations</div><h1>{pageCopy.attendance.title}</h1><p>{pageCopy.attendance.description}</p></div>{(role === "admin" || role === "teacher") && <div className="heading-actions"><button className="primary-button" onClick={() => onCreate("attendance")}><Plus size={15} /> Start attendance</button></div>}</div><div className="module-grid"><div className="module-card"><span className="status-pill green">Present</span><div className="module-stat">342</div><p>Students marked present today across the school.</p><div className="progress-track"><div className="progress-fill" style={{ width: "95%" }} /></div><div className="progress-meta"><span>95% attendance rate</span><span>342 / 360</span></div></div><div className="module-card"><span className="status-pill amber">Review queue</span><div className="module-stat">8</div><p>Records or requests that need authorized review.</p><button className="panel-link" onClick={() => onNavigate("reports")}>View attendance report <ArrowRight size={13} /></button></div><div className="module-card full"><h3>Attendance workflow</h3><p>Teachers create a class session, record each student once, and close the register. Students and guardians see only the records their account is authorized to access.</p><div className="module-actions"><button className="secondary-button" onClick={() => onNavigate("students")}>View students</button><button className="secondary-button" onClick={() => onNavigate("reports")}>Attendance analytics</button></div></div></div></>;
  if (view === "teachers") return <><div className="page-heading"><div><div className="breadcrumb">School management</div><h1>{pageCopy.teachers.title}</h1><p>{pageCopy.teachers.description}</p></div></div><div className="module-grid"><div className="module-card"><span className="status-pill blue">Staff directory</span><div className="module-stat">28</div><p>Teachers and staff accounts in the audit's sample school.</p></div><div className="module-card"><span className="status-pill green">Teaching coverage</span><div className="module-stat">6</div><p>Departments represented in the sample overview.</p></div><div className="module-card full"><h3>Account and role provisioning</h3><p>Teacher accounts are created by an administrator in Supabase Auth, then assigned the teacher role and teaching assignments. A teacher cannot grant roles to themselves.</p><div className="module-actions"><button className="secondary-button" onClick={() => onNavigate("settings")}>View setup guidance</button></div></div></div></>;
  if (view === "classes") return <><div className="page-heading"><div><div className="breadcrumb">School structure</div><h1>{pageCopy.classes.title}</h1><p>{pageCopy.classes.description}</p></div></div><div className="module-grid"><div className="module-card"><span className="status-pill blue">Academic structure</span><div className="module-stat">12</div><p>Illustrative class groups across the school.</p></div><div className="module-card"><span className="status-pill violet">Subjects</span><div className="module-stat">24</div><p>Illustrative subject catalogue.</p></div><div className="module-card full"><h3>Class relationships</h3><p>Classes connect students, homeroom teachers, subjects and teaching assignments. The live database exposes records only when a user's school relationship permits access.</p></div></div></>;
  if (view === "grades") return <><div className="page-heading"><div><div className="breadcrumb">Academic</div><h1>{pageCopy.grades.title}</h1><p>{pageCopy.grades.description}</p></div></div><div className="module-grid"><div className="module-card"><span className="status-pill blue">Current term</span><div className="module-stat">{role === "student" || role === "parent" ? "3.63" : "82.4%"}</div><p>{role === "student" || role === "parent" ? "Illustrative grade average from the audit." : "Average assessment completion in the sample workspace."}</p></div><div className="module-card"><span className="status-pill green">Progress</span><div className="module-stat">+0.18</div><p>Illustrative change from the previous reporting period.</p></div><div className="module-card full"><h3>Assessment records</h3><p>Grade records are scoped to the student's own profile, authorized guardians, the teachers assigned to the class and subject, and school administrators. Changes to scores should be auditable.</p><div className="module-actions"><button className="secondary-button" onClick={() => onNavigate("assignments")}>Review assignments</button><button className="secondary-button" onClick={() => onNavigate("reports")}>Learning analytics</button></div></div></div></>;
  if (view === "communication") return <><div className="page-heading"><div><div className="breadcrumb">School connect</div><h1>{pageCopy.communication.title}</h1><p>{pageCopy.communication.description}</p></div>{(role === "admin" || role === "teacher" || role === "homeroom_teacher") && <div className="heading-actions"><button className="primary-button" onClick={() => onCreate("announcement")}><Plus size={15} /> New announcement</button></div>}</div><section className="panel">{announcements.filter((a) => `${a.title} ${a.body}`.toLowerCase().includes(query.toLowerCase())).map((a) => <article className="announcement-item" key={a.id}><div className="announcement-meta"><span>{a.author || "School office"}</span><span>{formatDate(a.created_at)}</span></div><strong>{a.title}</strong><p>{a.body}</p><div style={{ marginTop: 8 }}><span className="status-pill blue">{(a.audience || ["School community"]).join(", ")}</span></div></article>)}{announcements.length === 0 && <div className="inline-empty">There are no announcements yet.</div>}</section><div style={{ height: 16 }} /><div className="section-note"><ShieldCheck size={17} /><span>Announcements are filtered by the audience roles assigned to the signed-in account. Direct messaging and push delivery are staged for a later communication phase.</span></div></>;
  if (view === "reports") return <><div className="page-heading"><div><div className="breadcrumb">Insights</div><h1>{pageCopy.reports.title}</h1><p>{pageCopy.reports.description}</p></div><div className="heading-actions"><button className="secondary-button" onClick={() => onNavigate("attendance")}><CalendarCheck size={14} /> Attendance report</button></div></div><div className="metric-grid"><MetricCard metric={roleMetrics.admin[0]} /><MetricCard metric={roleMetrics.admin[1]} /><MetricCard metric={roleMetrics.admin[2]} /><MetricCard metric={roleMetrics.admin[3]} /></div><section className="panel"><div className="panel-header"><div><h2 className="panel-title">School attendance trend</h2><p className="panel-subtitle">Illustrative overview based on the supplied product audit</p></div><span className="status-pill blue">Last 7 days</span></div><AttendanceChart /></section><div style={{ height: 16 }} /><div className="section-note"><AlertCircle size={17} /><span>Analytics shown in Demo mode are sample figures only. In a live project, reports should be calculated from the same underlying attendance, academic and finance records used by each role.</span></div></>;
  if (view === "finance") return <><div className="page-heading"><div><div className="breadcrumb">Administration</div><h1>{pageCopy.finance.title}</h1><p>{pageCopy.finance.description}</p></div></div><div className="module-grid"><div className="module-card"><span className="status-pill green">Outstanding</span><div className="module-stat">฿0</div><p>Illustrative account balance shown in the audit's Parent dashboard.</p></div><div className="module-card"><span className="status-pill blue">Billing records</span><div className="module-stat">—</div><p>Live invoices appear only for administrators and guardians with finance permission.</p></div><div className="module-card full"><h3>Privacy and finance access</h3><p>Guardians must be explicitly linked to each student and separately granted permission to view finance records. Students, unrelated guardians and teachers do not receive finance access by default.</p></div></div></>;
  return <><div className="page-heading"><div><div className="breadcrumb">Preferences</div><h1>{pageCopy.settings.title}</h1><p>{pageCopy.settings.description}</p></div></div><div className="module-grid"><div className="module-card"><span className="status-pill green">Account</span><h3 style={{ marginTop: 14 }}>Identity & access</h3><p>Roles are assigned by a trusted administrator. Your available workspaces are shown in the role selector.</p></div><div className="module-card"><span className="status-pill blue">Preferences</span><h3 style={{ marginTop: 14 }}>Language & notifications</h3><p>Notification preferences and localization controls are reserved for the next configuration iteration.</p></div><div className="module-card full"><h3>First administrator setup</h3><p>After Supabase is connected, create a trusted user in Authentication, then run the one-time role bootstrap statement documented in supabase/schema.sql. The app intentionally has no public sign-up or self-service role assignment.</p><div className="module-actions"><button className="secondary-button" onClick={() => onNavigate("overview")}>Return to overview</button></div></div></div></>;
}

export function Workspace({
  initialRoles,
  initialRole,
  demoMode,
  profileName,
}: {
  initialRoles: AppRole[];
  initialRole: AppRole;
  demoMode: boolean;
  profileName: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState<AppRole>(initialRole);
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [modalKind, setModalKind] = useState<ModalKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [students, setStudents] = useState<StudentRow[]>(demoStudents);
  const [assignments, setAssignments] = useState<AssignmentRow[]>(demoAssignments);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>(demoAnnouncements);
  const [tasks, setTasks] = useState(baseTasks);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftDue, setDraftDue] = useState("");
  const [draftClass, setDraftClass] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftAudience, setDraftAudience] = useState("all");
  const [formError, setFormError] = useState("");

  const allRoles = initialRoles.length ? initialRoles : [initialRole];
  const navGroups = navigation[role];
  const page = pageCopy[activeView];

  useEffect(() => {
    if (demoMode) return;
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;

    async function load() {
      if (!supabase) return;
      const [studentResult, assignmentResult, announcementResult, classResult, subjectResult] = await Promise.all([
        supabase.from("students").select("id, student_code, first_name, last_name, grade_level, status, class_id, classes(name)").limit(60),
        supabase.from("assignments").select("id, title, due_at, status, classes(name)").order("due_at", { ascending: true }).limit(60),
        supabase.from("announcements").select("id, title, body, published_at, audience").eq("status", "published").order("published_at", { ascending: false }).limit(12),
        supabase.from("classes").select("id, name").order("name").limit(100),
        supabase.from("subjects").select("id, name").order("name").limit(100),
      ]);
      if (cancelled) return;

      if (studentResult.data) setStudents(studentResult.data.map((row) => ({
        id: row.id,
        student_code: row.student_code,
        first_name: row.first_name,
        last_name: row.last_name,
        grade_level: row.grade_level,
        class_name: Array.isArray(row.classes) ? row.classes[0]?.name : (row.classes as { name?: string } | null)?.name,
        status: row.status,
      })));
      if (assignmentResult.data) setAssignments(assignmentResult.data.map((row) => ({
        id: row.id,
        title: row.title,
        due_at: row.due_at,
        status: row.status === "published" ? "Published" : row.status === "closed" ? "Closed" : "Draft",
        class_name: Array.isArray(row.classes) ? row.classes[0]?.name : (row.classes as { name?: string } | null)?.name,
      })));
      if (announcementResult.data) setAnnouncements(announcementResult.data.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        created_at: row.published_at,
        author: "School office",
        audience: row.audience,
      })));
      if (classResult.data) setClasses(classResult.data);
      if (subjectResult.data) setSubjects(subjectResult.data);
    }

    void load();
    return () => { cancelled = true; };
  }, [demoMode]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  function navigate(view: ViewKey) {
    setActiveView(view);
    setSidebarOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  }

  function openCreate(kind: ModalKind) {
    setModalKind(kind);
    setDraftTitle("");
    setDraftBody("");
    setDraftDue("");
    setDraftClass(classes[0]?.id ?? "");
    setDraftSubject(subjects[0]?.id ?? "");
    setDraftAudience("all");
    setFormError("");
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!draftTitle.trim()) return setFormError("Please enter a title.");
    setBusy(true);

    if (demoMode) {
      const now = new Date().toISOString();
      if (modalKind === "announcement") {
        setAnnouncements((current) => [{
          id: `demo-${Date.now()}`,
          title: draftTitle.trim(),
          body: draftBody.trim(),
          created_at: now,
          author: profileName,
          audience: [draftAudience === "all" ? "All roles" : draftAudience],
        }, ...current]);
      } else if (modalKind === "assignment") {
        if (!draftDue) { setBusy(false); return setFormError("Choose a deadline for the assignment."); }
        setAssignments((current) => [{
          id: `demo-${Date.now()}`, title: draftTitle.trim(), class_name: "Demo class · Subject", due_at: new Date(draftDue).toISOString(), status: "Published", submissions: 0,
        }, ...current]);
      } else {
        setToast("Demo attendance session opened. No real student record was changed.");
      }
      setBusy(false);
      setModalKind(null);
      if (modalKind === "announcement") setToast("Announcement added to the demo workspace.");
      if (modalKind === "assignment") setToast("Assignment added to the demo workspace.");
      return;
    }

    const supabase = createClient();
    if (!supabase) { setBusy(false); return setFormError("Supabase is not configured."); }
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) { setBusy(false); return setFormError("Your session could not be verified. Sign in again."); }

    if (modalKind === "announcement") {
      const audience = draftAudience === "all"
        ? ["admin", "teacher", "homeroom_teacher", "student", "parent"]
        : [draftAudience];
      const { error } = await supabase.from("announcements").insert({
        title: draftTitle.trim(),
        body: draftBody.trim(),
        audience,
        status: "published",
        author_id: userData.user.id,
      });
      if (error) { setBusy(false); return setFormError(error.message); }
      setAnnouncements((current) => [{
        id: `new-${Date.now()}`, title: draftTitle.trim(), body: draftBody.trim(), created_at: new Date().toISOString(), author: profileName, audience: [draftAudience],
      }, ...current]);
    } else if (modalKind === "assignment") {
      if (!draftDue || !draftClass || !draftSubject) { setBusy(false); return setFormError("Choose a class, subject and deadline."); }
      const { data, error } = await supabase.from("assignments").insert({
        title: draftTitle.trim(),
        description: draftBody.trim(),
        class_id: draftClass,
        subject_id: draftSubject,
        teacher_id: userData.user.id,
        due_at: new Date(draftDue).toISOString(),
        status: "published",
        published_at: new Date().toISOString(),
      }).select("id, title, due_at, status").single();
      if (error) { setBusy(false); return setFormError(error.message); }
      setAssignments((current) => [{ id: data.id, title: data.title, due_at: data.due_at, status: "Published" }, ...current]);
    } else {
      if (!draftClass) { setBusy(false); return setFormError("Choose a class for this attendance session."); }
      const { error } = await supabase.from("attendance_sessions").insert({
        class_id: draftClass,
        subject_id: draftSubject || null,
        teacher_id: userData.user.id,
        status: "open",
      });
      if (error) { setBusy(false); return setFormError(error.message); }
    }

    setBusy(false);
    const kind = modalKind;
    setModalKind(null);
    setToast(kind === "announcement" ? "Announcement published." : kind === "assignment" ? "Assignment published." : "Attendance session started.");
  }

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function markAllNotificationsRead() {
    if (!demoMode) {
      const supabase = createClient();
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        if (data.user) await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", data.user.id).is("read_at", null);
      }
    }
    setNotificationsOpen(false);
    setToast("Notifications marked as read.");
  }

  function toggleTask(id: number) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  }

  function exportCurrentData() {
    const rows = activeView === "students" ? students
      : activeView === "assignments" ? assignments
        : announcements;
    const csv = [Object.keys(rows[0] ?? {}).join(","), ...rows.map((row) =>
      Object.values(row).map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")
    )].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rnmcom-${activeView}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast("CSV export prepared.");
  }

  const currentNav = navGroups.flatMap((group) => group.items).find((item) => item.key === activeView);
  const unreadCount = demoNotifications.filter((item) => item.unread).length;
  const visibleStudents = useMemo(() => students.filter((s) =>
    `${s.first_name} ${s.last_name} ${s.student_code}`.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand-lockup"><span className="brand-mark">R</span><span><span>RNMCOM</span><span className="brand-caption">SCHOOL, CONNECTED.</span></span></div>
        <div className="school-switch"><span className="school-avatar">R</span><div className="school-switch-copy"><strong>Rajavinit Mathayom</strong><span>School workspace</span></div><ChevronDown size={14} color="#9aa5b4" /></div>
        <nav className="nav-scroll" aria-label="Main navigation">
          {navGroups.map((group) => <div className="nav-group" key={group.title}><p className="nav-heading">{group.title}</p>{group.items.map((item) => { const Icon = item.icon; return <button key={item.key} className={`nav-link ${activeView === item.key ? "active" : ""}`} onClick={() => navigate(item.key)}><Icon size={16} strokeWidth={1.9} /><span>{item.label}</span>{item.badge && <span className="nav-counter">{item.badge}</span>}</button>; })}</div>)}
        </nav>
        <div className="sidebar-bottom"><div className="help-card"><span className="help-icon"><CircleHelp size={16} /></span><div><strong>Need a hand?</strong><span>Visit the help centre</span></div></div><button className="nav-link" style={{ marginTop: 9 }} onClick={() => navigate("settings")}><Settings size={16} /> Preferences</button></div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button className="topbar-action mobile-menu-button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button>
            <label className="search-box"><Search size={16} /><input aria-label="Search this workspace" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students, assignments..." /><span className="search-shortcut">⌘ K</span></label>
          </div>
          <div className="topbar-right">
            {demoMode && <span className="status-pill amber">Demo</span>}
            {allRoles.length > 1 && <select className="role-select" aria-label="Switch workspace role" value={role} onChange={(e) => { const next = e.target.value; if (isAppRole(next) && allRoles.includes(next)) { setRole(next); setActiveView("overview"); } }}><option value="" disabled>Switch role</option>{allRoles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select>}
            <div className="popover-anchor"><button className="topbar-action" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}><Bell size={18} />{unreadCount > 0 && <i className="notification-dot" />}</button>{notificationsOpen && <div className="dropdown-panel"><div className="dropdown-head"><div><strong>Notifications</strong><span> {unreadCount} unread</span></div><button className="text-button" onClick={markAllNotificationsRead}>Mark all read</button></div>{demoNotifications.map((item) => <div className={`notification-item ${item.unread ? "unread" : ""}`} key={item.id}>{item.unread && <i className="notification-bullet" />}<div><strong>{item.title}</strong><p>{item.detail}</p><span>{item.time}</span></div></div>)}</div>}</div>
            <div className="top-divider" />
            <div className="popover-anchor"><button className="profile-trigger" onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }} aria-expanded={profileOpen}><span className="avatar">{initials(profileName)}</span><span className="profile-copy"><strong>{profileName}</strong><span>{ROLE_LABELS[role]}</span></span><ChevronDown size={14} color="#9aa5b4" /></button>{profileOpen && <div className="dropdown-panel profile-menu"><button onClick={() => { navigate("settings"); setProfileOpen(false); }}><UserRound size={15} /> Profile & preferences</button><button onClick={() => { navigate("settings"); setProfileOpen(false); }}><ShieldCheck size={15} /> Account security</button><button className="danger" onClick={signOut}><LogOut size={15} /> Sign out</button></div>}</div>
          </div>
        </header>

        <main className="content">
          {demoMode && <div className="demo-banner"><AlertCircle size={15} /><strong>Preview environment</strong><span>Sample data only — actions here do not change real school records.</span></div>}
          {activeView === "overview"
            ? <Dashboard role={role} name={profileName} students={students} assignments={assignments} announcements={announcements} tasks={tasks} onTaskToggle={toggleTask} onNavigate={navigate} onCreate={openCreate} />
            : <ModuleView view={activeView} role={role} students={visibleStudents} assignments={assignments.filter((a) => `${a.title} ${a.class_name}`.toLowerCase().includes(search.toLowerCase()))} announcements={announcements} query={search} onCreate={openCreate} onNavigate={navigate} />
          }
          {activeView !== "overview" && activeView !== "settings" && <div className="module-actions" style={{ justifyContent: "flex-end", marginTop: 15 }}><button className="secondary-button" onClick={exportCurrentData}><Download size={14} /> Export visible data</button></div>}
          <footer className="workspace-footer"><span>RNMCOM · School, connected.</span><span><ShieldCheck size={12} /> Role-aware workspace · {demoMode ? "Demo data" : "Supabase connected"}</span></footer>
        </main>
      </div>

      {modalKind && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalKind(null); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="create-heading"><div className="modal-header"><h2 id="create-heading">{modalKind === "assignment" ? "Create assignment" : modalKind === "announcement" ? "Publish announcement" : "Start attendance session"}</h2><button className="icon-button" aria-label="Close dialog" onClick={() => setModalKind(null)}><X size={18} /></button></div><form onSubmit={submitCreate}><div className="modal-body">
        {modalKind !== "attendance" && <label>Title<input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder={modalKind === "assignment" ? "e.g. Functions and Graphs — Problem Set 05" : "e.g. School schedule update"} required maxLength={140} /></label>}
        <label>{modalKind === "attendance" ? "Class" : "Description"}{modalKind === "attendance" ? <select value={draftClass} onChange={(e) => setDraftClass(e.target.value)} required><option value="">Select a class</option>{classes.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select> : <textarea value={draftBody} onChange={(e) => setDraftBody(e.target.value)} placeholder="Add useful context for your audience..." maxLength={4000} />}</label>
        {modalKind === "assignment" && <>
          <label>Class<select value={draftClass} onChange={(e) => setDraftClass(e.target.value)} required><option value="">Select a class</option>{classes.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
          <label>Subject<select value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} required><option value="">Select a subject</option>{subjects.map((s) => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
          <label>Deadline<input type="datetime-local" value={draftDue} onChange={(e) => setDraftDue(e.target.value)} required /></label>
        </>}
        {modalKind === "attendance" && <label>Subject (optional)<select value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)}><option value="">General class register</option>{subjects.map((s) => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>}
        {modalKind === "announcement" && <label>Audience<select value={draftAudience} onChange={(e) => setDraftAudience(e.target.value)}><option value="all">Entire school</option><option value="teacher">Teachers</option><option value="homeroom_teacher">Homeroom teachers</option><option value="student">Students</option><option value="parent">Parents / guardians</option></select></label>}
        {!demoMode && modalKind !== "announcement" && classes.length === 0 && <p className="form-error">No classes are available for your account. Ask an administrator to assign classes before continuing.</p>}
        {formError && <p className="form-error">{formError}</p>}
      </div><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModalKind(null)}>Cancel</button><button className="primary-button" type="submit" disabled={busy || (!demoMode && modalKind !== "announcement" && classes.length === 0)}>{busy ? "Saving…" : modalKind === "attendance" ? "Start session" : modalKind === "assignment" ? "Publish assignment" : "Publish announcement"} <ArrowRight size={14} /></button></div></form></section></div>}
      {toast && <div className="toast"><CheckCircle2 size={16} /> {toast}</div>}
    </div>
  );
}
