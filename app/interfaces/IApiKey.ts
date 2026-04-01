export interface IApiKeyInternal {
  id: string;
  description: string;
  expires: string | null;
  created: string;
  last_used: string | null;
}

export interface IApiKey extends IApiKeyInternal {
  user_id: string;
}

export interface IApiKeyInternalInput {
  description: string;
  expires: string | null;
}
