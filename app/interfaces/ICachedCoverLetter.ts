export interface ICachedCoverLetter {
  user_id: string;
  job_title: string;
  company_name: string;
  draft_name: string;
  session_id: string;
  education_score: number;
  skills_score: number;
  experience_score: number;
  projects_score: number;
  location_score: number;
  overall_score: number;
  draft: string;
  education_score_exp: string;
  skills_score_exp: string;
  experience_score_exp: string;
  projects_score_exp: string;
  location_score_exp: string;
}

export interface ISkillsMatchScore {
  education: number;
  experience: number;
  skills: number;
  projects: number;
  location: number;
  overall: number;
  explanations: {
    education: string;
    experience: string;
    skills: string;
    projects: string;
    location: string;
  };
}

export interface ICachedConversationListItem {
  job_title: string;
  company_name: string;
  session_id: string;
  created_at: string; // timestamptz
}
