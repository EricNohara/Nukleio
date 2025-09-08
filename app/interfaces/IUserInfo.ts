import { ICourseInput } from "./ICourse";
import { IExperience } from "./IExperience";
import { IProjectInput } from "./IProject";
import { ISkillsInput } from "./ISkills";
import IUser from "./IUser";

export interface IUserInfo extends IUser {
  skills: ISkillsInput[];
  experiences: IExperience[];
  projects: IProjectInput[];
  education: IUserEducation[];
}

export interface IUserEducation {
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
