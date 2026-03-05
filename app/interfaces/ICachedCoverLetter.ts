export interface ICachedCoverLetter {
  user_id: string;
  job_title: string;
  company_name: string;
  draft_name: string;
  conversation_id: string;
  education_score: number;
  skills_score: number;
  experience_score: number;
  projects_score: number;
  location_score: number;
  overall_score: number;
  draft: string;
}

export interface ISkillsMatchScore {
  education: number;
  experience: number;
  skills: number;
  projects: number;
  location: number;
  overall: number;
}

export interface ICachedConversationListItem {
  job_title: string;
  company_name: string;
  conversation_id: string;
  created_at: string; // timestamptz
}
