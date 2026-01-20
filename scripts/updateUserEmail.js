import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  const [, , userId, newEmail] = process.argv;

  if (!userId || !newEmail) {
    console.error("Usage:");
    console.error("  node updateUserEmail.js <USER_ID> <NEW_EMAIL>");
    console.error("");
    console.error("Example:");
    console.error(
      "  node updateUserEmail.js d206d86e-88d3-4f9d-986c-40352f4e952f test@example.com"
    );
    process.exit(1);
  }

  console.log(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
  );

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      email: newEmail,
      email_confirm: true, // force-confirm (admin only)
    }
  );

  if (error) {
    console.error("Error updating user:", error);
    process.exit(1);
  }

  console.log("User email updated successfully:");
  console.log({
    id: data.user.id,
    email: data.user.email,
  });
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
