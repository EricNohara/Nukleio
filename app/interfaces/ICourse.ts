export interface ICourseInput {
  name: string;
  grade: string | null;
  description: string | null;
}

export interface ICourse extends ICourseInput {
  education_id: string;
  user_id: string;
}
