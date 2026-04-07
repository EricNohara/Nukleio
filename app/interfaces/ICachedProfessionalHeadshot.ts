export interface ICachedProfessionalHeadshot {
  id: string;
  user_id: string;
  url: string;
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
