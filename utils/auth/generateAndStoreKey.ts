import { IApiKeyInput } from "@/app/interfaces/IApiKey";
import { encrypt } from "@/utils/auth/encrypt";
import { generateAPIKey, hashKey } from "@/utils/auth/hash";

export async function generateAndStoreKey(
  /* eslint-disable @typescript-eslint/no-explicit-any */
  supabase: any,
  userId: string,
  email: string,
  description: string,
  expires: string | null
) {
  // generate api key
  const apiKey: string = await generateAPIKey(userId, email);

  const hashedKey: string | null = await hashKey(apiKey);
  if (!hashedKey) throw new Error("Error hashing api key");

  const encryptedKey: string | null = encrypt(apiKey);
  if (!encryptedKey) throw new Error("Error encrypting api key");

  const keyData: IApiKeyInput = {
    user_id: userId,
    hashed_key: hashedKey,
    encrypted_key: encryptedKey,
    description,
    expires,
  };

  const { data, error } = await supabase
    .from("api_keys")
    .insert(keyData)
    .select("description, created, expires")
    .single();
  if (error) throw new Error("Error inserting API key into database");

  return { key: data };
}
