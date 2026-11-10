import type { AnnouncementRow, AssignmentRow, StudentRow } from "@/lib/types";

export const demoStudents: StudentRow[] = [
  { id: "demo-1", student_code: "RNM-2501", first_name: "Nattapong", last_name: "S.", grade_level: "M.5", class_name: "M.5/1", status: "Active", attendance: "Present" },
  { id: "demo-2", student_code: "RNM-2502", first_name: "Pimchanok", last_name: "K.", grade_level: "M.5", class_name: "M.5/1", status: "Active", attendance: "Present" },
  { id: "demo-3", student_code: "RNM-2503", first_name: "Thanawat", last_name: "P.", grade_level: "M.5", class_name: "M.5/2", status: "Active", attendance: "Late" },
  { id: "demo-4", student_code: "RNM-2504", first_name: "Kanyarat", last_name: "T.", grade_level: "M.4", class_name: "M.4/3", status: "Active", attendance: "Present" },
  { id: "demo-5", student_code: "RNM-2505", first_name: "Phurin", last_name: "C.", grade_level: "M.6", class_name: "M.6/2", status: "Active", attendance: "Absent" },
  { id: "demo-6", student_code: "RNM-2506", first_name: "Sirilak", last_name: "W.", grade_level: "M.5", class_name: "M.5/2", status: "Active", attendance: "Present" },
];

export const demoAssignments: AssignmentRow[] = [
  { id: "a-1", title: "Functions and Graphs — Problem Set 04", class_name: "M.5/1 · Mathematics", due_at: "2026-11-12T16:00:00+07:00", status: "Published", submissions: 24 },
  { id: "a-2", title: "Physics: Motion Analysis", class_name: "M.5/2 · Physics", due_at: "2026-11-13T23:59:00+07:00", status: "Published", submissions: 18 },
  { id: "a-3", title: "English Reading Reflection", class_name: "M.5/1 · English", due_at: "2026-11-15T18:00:00+07:00", status: "Grading", submissions: 30 },
  { id: "a-4", title: "Introduction to Algorithms", class_name: "M.5/3 · Computer Science", due_at: "2026-11-17T16:00:00+07:00", status: "Draft", submissions: 0 },
];

export const demoAnnouncements: AnnouncementRow[] = [
  { id: "n-1", title: "Mid-term examination schedule", body: "The mid-term examination timetable is now available. Please review your class schedule and contact your teacher if you find a conflict.", created_at: "2026-11-10T08:15:00+07:00", author: "Academic Office", audience: ["All roles"] },
  { id: "n-2", title: "Library opening hours", body: "The library will remain open until 17:00 this week to support students preparing for examinations.", created_at: "2026-11-09T13:30:00+07:00", author: "School Administration", audience: ["All roles"] },
  { id: "n-3", title: "Parent meeting — M.5", body: "The M.5 parent meeting will take place on Friday. Homeroom teachers will share room details through the parent portal.", created_at: "2026-11-08T09:00:00+07:00", author: "Homeroom Office", audience: ["Parent", "Homeroom"] },
];

export const demoNotifications = [
  { id: "1", title: "Attendance needs review", detail: "2 records are waiting for confirmation.", time: "10 min ago", unread: true },
  { id: "2", title: "New school announcement", detail: "Mid-term examination schedule is available.", time: "1 hour ago", unread: true },
  { id: "3", title: "Assignment deadline", detail: "Functions and Graphs is due in 2 days.", time: "Yesterday", unread: false },
];

export const roleMetrics = {
  admin: [
    { label: "Total students", value: "360", delta: "+12 this term", tone: "blue", icon: "users" },
    { label: "Present today", value: "342", delta: "95% attendance", tone: "green", icon: "calendar" },
    { label: "Teachers & staff", value: "28", delta: "Across 6 departments", tone: "violet", icon: "staff" },
    { label: "Pending actions", value: "8", delta: "3 need attention", tone: "amber", icon: "pending" },
  ],
  teacher: [
    { label: "Classes today", value: "4", delta: "Next class at 10:20", tone: "blue", icon: "calendar" },
    { label: "Graded", value: "24/30", delta: "80% completed", tone: "green", icon: "check" },
    { label: "To review", value: "6", delta: "2 due today", tone: "amber", icon: "pending" },
    { label: "Attendance requests", value: "3", delta: "Waiting for review", tone: "violet", icon: "inbox" },
  ],
  homeroom_teacher: [
    { label: "Present in class", value: "28/30", delta: "93.3% today", tone: "green", icon: "calendar" },
    { label: "Follow-up", value: "2", delta: "Require teacher review", tone: "amber", icon: "pending" },
    { label: "Merit points", value: "+120", delta: "This semester", tone: "violet", icon: "award" },
    { label: "Leave requests", value: "1", delta: "Awaiting approval", tone: "blue", icon: "inbox" },
  ],
  student: [
    { label: "Attendance rate", value: "96.7%", delta: "Your personal progress", tone: "green", icon: "calendar" },
    { label: "Due assignments", value: "3", delta: "1 due tomorrow", tone: "amber", icon: "pending" },
    { label: "Grade average", value: "3.63", delta: "Current semester", tone: "blue", icon: "grade" },
    { label: "Merit points", value: "85", delta: "Keep building good habits", tone: "violet", icon: "award" },
  ],
  parent: [
    { label: "School arrival", value: "07:32", delta: "Checked in today", tone: "green", icon: "clock" },
    { label: "Attendance rate", value: "96.7%", delta: "This semester", tone: "blue", icon: "calendar" },
    { label: "Open assignments", value: "3", delta: "Across 2 subjects", tone: "amber", icon: "pending" },
    { label: "Outstanding fees", value: "฿0", delta: "No payment due", tone: "violet", icon: "wallet" },
  ],
} as const;