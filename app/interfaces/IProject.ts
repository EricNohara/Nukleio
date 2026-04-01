export interface IProjectInput {
  name: string;
  date_start: string;
  date_end: string;
  languages_used: string[] | null;
  frameworks_used: string[] | null;
  technologies_used: string[] | null;
  description: string;
  github_url: string | null;
  demo_url: string | null;
  thumbnail_url: string | null;
}

export interface IProject extends IProjectInput {
  id: string;
  user_id: string;
}
