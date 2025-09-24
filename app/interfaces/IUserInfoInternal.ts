import { IApiKeyInternal } from "./IApiKey";
import { ICourseInput } from "./ICourse";
import { IExperience } from "./IExperience";
import { IProjectInput } from "./IProject";
import { IPublicApiLogInternal } from "./IPublicApiLog";
import { ISkillsInput } from "./ISkills";
import IUser from "./IUser";

export interface IUserInfoInternal extends IUser {
  api_keys: IApiKeyInternal[];
  public_api_logs: IPublicApiLogInternal[];
  skills: ISkillsInput[];
  experiences: IExperience[];
  projects: IProjectInternal[];
  education: IUserEducationInternal[];
}

export interface IUserEducationInternal {
  id: number;
  degree: string;
  majors: string[];
  minors: string[];
  gpa: number | null;
  institution: string;
  awards: string[];
  year_start: number | null;
  year_end: number | null;
  courses: ICourseInput[];
}

export interface IProjectInternal {
  id: number;
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
