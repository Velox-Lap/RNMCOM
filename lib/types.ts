export const APP_ROLES = [
  "admin",
  "teacher",
  "homeroom_teacher",
  "student",
  "parent",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type ViewKey =
  | "tcas-learning"
  | "tcas"
  | "overview"
  | "students"
  | "teachers"
  | "classes"
  | "attendance"
  | "assignments"
  | "grades"
  | "communication"
  | "reports"
  | "audit"
  | "finance"
  | "settings";

export type StudentRow = {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  class_name?: string | null;
  status?: string;
  attendance?: string;
};

export type AssignmentRow = {
  id: string;
  title: string;
  class_name?: string | null;
  due_at: string;
  status: string;
  submissions?: number;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  author?: string;
  audience?: string[];
};

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  homeroom_teacher: "Homeroom Teacher",
  student: "Student",
  parent: "Parent / Guardian",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: "A complete view of school operations and priorities.",
  teacher: "Your classes, attendance, assignments and assessment work.",
  homeroom_teacher: "A focused view of your class and student follow-up.",
  student: "Your learning progress, timetable and next assignments.",
  parent: "A clear view of your child's school day and progress.",
};

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}