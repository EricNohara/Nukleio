export interface IPublicApiLogInternal {
  requested_at: string;
  responded_at: string;
  status_code: number;
  key_description: string;
  user_agent: string;
}

export default interface IPublicApiLog extends IPublicApiLogInternal {
  user_id: string;
}
