export interface Grade {
  id: string;
  name: string;
  level: number;
}

export interface Team {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  grade?: Grade;
  team?: Team;
  hire_date: string;
  status: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseCategory {
  id: string;
  name: string;
}

export interface CourseProvider {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  duration_min: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  format: 'video' | 'interactive' | 'text' | 'webinar' | 'simulation';
  category?: CourseCategory;
  provider?: CourseProvider;
  status: string;
  rating_avg?: number;
  rating_count: number;
  completion_count: number;
  created_at: string;
}

export interface Enrollment {
  id: string;
  employee_id: string;
  course?: Course;
  status: string;
  progress_pct: number;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  score?: number;
  source: string;
}

export interface Skill {
  id: string;
  name: string;
}

export interface SkillRecord {
  id: string;
  skill?: Skill;
  level: number;
  assessed_at: string;
  source: string;
  confidence?: number;
}

export interface CareerPath {
  id: string;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
}

export interface CareerStep {
  id: string;
  position_name: string;
  grade_level: string;
  sequence_num: number;
  skill_requirements?: Record<string, number>;
  avg_time_months?: number;
}

export interface IDPItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  quarter: string;
  deadline?: string;
  progress_pct: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  is_read: boolean;
  created_at: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  due_date?: string;
  completed_at?: string;
  assigned_by: string;
}

export interface OnboardingPlan {
  id: string;
  status: string;
  start_date: string;
  target_end_date: string;
  actual_end_date?: string;
  progress_pct: number;
  tasks: OnboardingTask[];
}

export interface DashboardData {
  user: Employee;
  learning_progress: {
    total: number;
    completed: number;
    in_progress: number;
    completion_rate: number;
  };
  career_track?: CareerPath;
  career_steps: CareerStep[];
  idp_items: IDPItem[];
  my_courses: Enrollment[];
  notifications: Notification[];
  onboarding?: OnboardingPlan;
  heatmap_data: { date: string; count: number }[];
}


export interface GapAnalysisCourse {
  id: string;
  title: string;
  duration_min: number;
  difficulty: string;
  format: string;
  rating_avg?: number;
  rating_count: number;
}

export interface GapAnalysisItem {
  skill: string;
  current_level: number;
  required_level: number;
  priority: string;
  estimated_time_months?: number;
  recommended_courses: GapAnalysisCourse[];
}

export interface GapAnalysisOut {
  current_position: string;
  target_position: string;
  gaps: GapAnalysisItem[];
  overall_readiness: number;
  estimated_time_to_promotion: string;
  ai_recommendations: string;
}
