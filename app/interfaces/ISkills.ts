export interface ISkillsInput {
  name: string;
  proficiency: number | null;
  years_of_experience: number | null;
}

export interface ISkillsInternal extends ISkillsInput {
  id: string;
}

export interface ISkills extends ISkillsInternal {
  user_id: string;
}
