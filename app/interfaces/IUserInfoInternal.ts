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
  projects: IProjectInput[];
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
