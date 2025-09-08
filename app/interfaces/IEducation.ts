export interface IEducationInput {
  degree: string;
  majors: string[];
  minors: string[];
  gpa: number | null;
  institution: string;
  awards: string[];
  year_start: number | null;
  year_end: number | null;
}

export interface IEducationUserInput {
  degree: string;
  majors: string;
  awards: string;
  minors: string;
  gpa: number | null;
  institution: string;
  year_start: number | null;
  year_end: number | null;
}

export interface IEducation extends IEducationInput {
  id: number;
  user_id: string;
}
