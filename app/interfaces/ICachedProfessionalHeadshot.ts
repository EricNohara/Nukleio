export interface ICachedProfessionalHeadshot {
  id: string;
  user_id: string;
  generated_url: string;
  reference_url: string;
  background_url: string | null;
  background_description: string | null;
  created_at: string;
  layout: string | null;
  validation: {
    ok: boolean;
    failureReasons: string[];
    warnings: string[];
    detected: {
      personCount: number;
      faceVisible: boolean;
      faceTooCropped: boolean;
      lookingAtCamera: boolean;
      nonPhotographic: boolean;
      nsfwContent: boolean;
      tooBlurry: boolean;
    };
  };
}
