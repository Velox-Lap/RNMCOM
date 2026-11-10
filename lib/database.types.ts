export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          audience: Database["public"]["Enums"]["app_role"][]
          author_id: string
          body: string
          created_at: string
          id: string
          published_at: string
          status: string
          title: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["app_role"][]
          author_id: string
          body: string
          created_at?: string
          id?: string
          published_at?: string
          status?: string
          title: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["app_role"][]
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          published_at?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          class_id: string
          created_at: string
          description: string
          due_at: string
          id: string
          published_at: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          subject_id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string
          due_at: string
          id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          subject_id: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string
          due_at?: string
          id?: string
          published_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          subject_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          id: string
          note: string | null
          recorded_at: string
          recorded_by: string
          session_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          note?: string | null
          recorded_at?: string
          recorded_by: string
          session_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          note?: string | null
          recorded_at?: string
          recorded_by?: string
          session_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          class_id: string
          created_at: string
          ends_at: string | null
          id: string
          qr_token_hash: string | null
          session_date: string
          starts_at: string
          status: string
          subject_id: string | null
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          qr_token_hash?: string | null
          session_date?: string
          starts_at?: string
          status?: string
          subject_id?: string | null
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          qr_token_hash?: string | null
          session_date?: string
          starts_at?: string
          status?: string
          subject_id?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: number
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: never
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: never
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string
          created_at: string
          grade_level: string
          homeroom_teacher_id: string | null
          id: string
          name: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          grade_level: string
          homeroom_teacher_id?: string | null
          id?: string
          name: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          grade_level?: string
          homeroom_teacher_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_homeroom_teacher_id_fkey"
            columns: ["homeroom_teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          academic_year: string
          class_id: string
          created_at: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          academic_year: string
          class_id: string
          created_at?: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          academic_year?: string
          class_id?: string
          created_at?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_invoices: {
        Row: {
          amount: number
          created_at: string
          description: string
          due_date: string
          id: string
          invoice_number: string
          paid_at: string | null
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          due_date: string
          id?: string
          invoice_number: string
          paid_at?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          invoice_number?: string
          paid_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          academic_year: string
          created_at: string
          feedback: string | null
          id: string
          letter_grade: string | null
          max_score: number
          recorded_by: string
          score: number
          student_id: string
          subject_id: string
          term: string
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          feedback?: string | null
          id?: string
          letter_grade?: string | null
          max_score: number
          recorded_by: string
          score: number
          student_id: string
          subject_id: string
          term: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          feedback?: string | null
          id?: string
          letter_grade?: string | null
          max_score?: number
          recorded_by?: string
          score?: number
          student_id?: string
          subject_id?: string
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          reason: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["approval_status"]
          student_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          reason: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["approval_status"]
          student_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          reason?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["approval_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      merit_points: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string
          recorded_by: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason: string
          recorded_by: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string
          recorded_by?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merit_points_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merit_points_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_guardians: {
        Row: {
          can_view_academic: boolean
          can_view_attendance: boolean
          can_view_finance: boolean
          can_view_profile: boolean
          created_at: string
          guardian_user_id: string
          id: string
          relationship: string
          student_id: string
        }
        Insert: {
          can_view_academic?: boolean
          can_view_attendance?: boolean
          can_view_finance?: boolean
          can_view_profile?: boolean
          created_at?: string
          guardian_user_id: string
          id?: string
          relationship?: string
          student_id: string
        }
        Update: {
          can_view_academic?: boolean
          can_view_attendance?: boolean
          can_view_finance?: boolean
          can_view_profile?: boolean
          created_at?: string
          guardian_user_id?: string
          id?: string
          relationship?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_guardian_user_id_fkey"
            columns: ["guardian_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_support_cases: {
        Row: {
          category: string
          created_at: string
          id: string
          owner_id: string
          status: string
          student_id: string
          summary: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          owner_id: string
          status?: string
          student_id: string
          summary: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          owner_id?: string
          status?: string
          student_id?: string
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_support_cases_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_support_cases_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_id: string | null
          created_at: string
          first_name: string
          grade_level: string
          id: string
          last_name: string
          profile_id: string
          status: string
          student_code: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          first_name: string
          grade_level: string
          id?: string
          last_name: string
          profile_id: string
          status?: string
          student_code: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          first_name?: string
          grade_level?: string
          id?: string
          last_name?: string
          profile_id?: string
          status?: string
          student_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          grade_level: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          grade_level?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          grade_level?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          file_path: string | null
          graded_at: string | null
          id: string
          status: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submission_text: string
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          file_path?: string | null
          graded_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submission_text?: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          file_path?: string | null
          graded_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["submission_status"]
          student_id?: string
          submission_text?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      tcas_attempt_answers: {
        Row: {
          answer: Json | null
          answered_at: string
          attempt_id: string
          flag_for_review: boolean
          id: string
          question_id: string
        }
        Insert: {
          answer?: Json | null
          answered_at?: string
          attempt_id: string
          flag_for_review?: boolean
          id?: string
          question_id: string
        }
        Update: {
          answer?: Json | null
          answered_at?: string
          attempt_id?: string
          flag_for_review?: boolean
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tcas_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "tcas_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tcas_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "tcas_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      tcas_attempt_results: {
        Row: {
          attempt_id: string
          correct_answer: Json
          earned_points: number
          explanation: string
          id: string
          is_correct: boolean
          max_points: number
          question_id: string
          solution_steps: Json
          submitted_answer: Json | null
        }
        Insert: {
          attempt_id: string
          correct_answer: Json
          earned_points?: number
          explanation: string
          id?: string
          is_correct: boolean
          max_points: number
          question_id: string
          solution_steps?: Json
          submitted_answer?: Json | null
        }
        Update: {
          attempt_id?: string
          correct_answer?: Json
          earned_points?: number
          explanation?: string
          id?: string
          is_correct?: boolean
          max_points?: number
          question_id?: string
          solution_steps?: Json
          submitted_answer?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tcas_attempt_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "tcas_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tcas_attempt_results_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "tcas_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      tcas_attempts: {
        Row: {
          correct_count: number
          earned_points: number
          exam_set_id: string
          id: string
          max_points: number
          question_count: number
          started_at: string
          status: string
          submitted_at: string | null
          time_limit_seconds: number
          user_id: string
        }
        Insert: {
          correct_count?: number
          earned_points?: number
          exam_set_id: string
          id?: string
          max_points?: number
          question_count?: number
          started_at?: string
          status?: string
          submitted_at?: string | null
          time_limit_seconds: number
          user_id: string
        }
        Update: {
          correct_count?: number
          earned_points?: number
          exam_set_id?: string
          id?: string
          max_points?: number
          question_count?: number
          started_at?: string
          status?: string
          submitted_at?: string | null
          time_limit_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tcas_attempts_exam_set_id_fkey"
            columns: ["exam_set_id"]
            isOneToOne: false
            referencedRelation: "tcas_exam_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tcas_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tcas_exam_sets: {
        Row: {
          code: string
          created_at: string
          description: string
          duration_minutes: number
          exam_group: string
          formats: string[]
          id: string
          is_published: boolean
          slug: string
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string
          duration_minutes?: number
          exam_group: string
          formats?: string[]
          id?: string
          is_published?: boolean
          slug: string
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          duration_minutes?: number
          exam_group?: string
          formats?: string[]
          id?: string
          is_published?: boolean
          slug?: string
          title?: string
        }
        Relationships: []
      }
      tcas_lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          last_position_seconds: number
          lesson_id: string
          progress_percent: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          last_position_seconds?: number
          lesson_id: string
          progress_percent?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          last_position_seconds?: number
          lesson_id?: string
          progress_percent?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tcas_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "tcas_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tcas_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tcas_lessons: {
        Row: {
          content: string
          created_at: string
          duration_minutes: number
          exam_set_id: string
          id: string
          is_published: boolean
          lesson_type: string
          sort_order: number
          summary: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          duration_minutes?: number
          exam_set_id: string
          id?: string
          is_published?: boolean
          lesson_type?: string
          sort_order?: number
          summary?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          duration_minutes?: number
          exam_set_id?: string
          id?: string
          is_published?: boolean
          lesson_type?: string
          sort_order?: number
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tcas_lessons_exam_set_id_fkey"
            columns: ["exam_set_id"]
            isOneToOne: false
            referencedRelation: "tcas_exam_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      tcas_questions: {
        Row: {
          exam_set_id: string
          format: string
          id: string
          options: Json
          passage: string | null
          points: number
          prompt: string
          question_no: number
          question_type: string
          section: string
          sort_order: number
        }
        Insert: {
          exam_set_id: string
          format: string
          id?: string
          options?: Json
          passage?: string | null
          points?: number
          prompt: string
          question_no: number
          question_type?: string
          section: string
          sort_order?: number
        }
        Update: {
          exam_set_id?: string
          format?: string
          id?: string
          options?: Json
          passage?: string | null
          points?: number
          prompt?: string
          question_no?: number
          question_type?: string
          section?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "tcas_questions_exam_set_id_fkey"
            columns: ["exam_set_id"]
            isOneToOne: false
            referencedRelation: "tcas_exam_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      tcas_study_sessions: {
        Row: {
          duration_seconds: number
          ended_at: string | null
          exam_set_id: string | null
          id: string
          note: string
          started_at: string
          user_id: string
        }
        Insert: {
          duration_seconds?: number
          ended_at?: string | null
          exam_set_id?: string | null
          id?: string
          note?: string
          started_at?: string
          user_id: string
        }
        Update: {
          duration_seconds?: number
          ended_at?: string | null
          exam_set_id?: string | null
          id?: string
          note?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tcas_study_sessions_exam_set_id_fkey"
            columns: ["exam_set_id"]
            isOneToOne: false
            referencedRelation: "tcas_exam_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tcas_study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tcas_vocabulary: {
        Row: {
          exam_set_id: string | null
          example: string
          id: string
          is_published: boolean
          meaning: string
          sort_order: number
          term: string
        }
        Insert: {
          exam_set_id?: string | null
          example?: string
          id?: string
          is_published?: boolean
          meaning: string
          sort_order?: number
          term: string
        }
        Update: {
          exam_set_id?: string | null
          example?: string
          id?: string
          is_published?: boolean
          meaning?: string
          sort_order?: number
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "tcas_vocabulary_exam_set_id_fkey"
            columns: ["exam_set_id"]
            isOneToOne: false
            referencedRelation: "tcas_exam_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          department: string | null
          employee_code: string | null
          id: string
          profile_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          employee_code?: string | null
          id?: string
          profile_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          employee_code?: string | null
          id?: string
          profile_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_assignments: {
        Row: {
          academic_year: string
          class_id: string
          created_at: string
          id: string
          subject_id: string
          teacher_id: string
          term: string
        }
        Insert: {
          academic_year: string
          class_id: string
          created_at?: string
          id?: string
          subject_id: string
          teacher_id: string
          term: string
        }
        Update: {
          academic_year?: string
          class_id?: string
          created_at?: string
          id?: string
          subject_id?: string
          teacher_id?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "teaching_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          is_primary: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          is_primary?: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          is_primary?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      grade_tcas_attempt: { Args: { _attempt_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "teacher" | "homeroom_teacher" | "student" | "parent"
      approval_status: "pending" | "approved" | "rejected"
      assignment_status: "draft" | "published" | "closed"
      attendance_status: "present" | "absent" | "late" | "leave"
      submission_status:
        | "submitted"
        | "late"
        | "grading"
        | "graded"
        | "returned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "homeroom_teacher", "student", "parent"],
      approval_status: ["pending", "approved", "rejected"],
      assignment_status: ["draft", "published", "closed"],
      attendance_status: ["present", "absent", "late", "leave"],
      submission_status: ["submitted", "late", "grading", "graded", "returned"],
    },
  },
} as const
