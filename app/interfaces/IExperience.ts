export interface IExperienceInput {
  company: string;
  job_title: string;
  date_start: string | null;
  date_end: string | null;
  job_description: string | null;
}

export interface IExperience extends IExperienceInput {
  id: string;
}

export interface IUserExperience extends IExperience {
  user_id: string;
}
