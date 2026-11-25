# Headshot revision rollout

Deploy the professional-headshot Lambda before deploying the Nukleio app.
The updated agent accepts the existing server-to-agent URL contract but only
downloads owned paths from the configured Supabase storage origin. Confirm
`SUPABASE_URL` matches the app's `NEXT_PUBLIC_SUPABASE_URL`, and the agent's
headshot bucket is `professional_headshots`. The app's revision API now accepts
`{ "headshotId": "<cached UUID>", "feedback": "...", "layout": "1024x1024" }`
instead of `headshotUrl`; there is currently no revision UI in the app.

In development, generate a headshot using the updated agent and confirm image
validation and generation work. With a verified premium test account, revise an
owned cached headshot and verify a new cached result. Submit another user's ID,
an expired or missing ID, and a legacy URL body; verify rejection before any AI
credits are consumed. Verify generated-image and input URLs cannot redirect to
other hosts and that oversized or non-image objects are rejected. Test the
same paths and configuration in production before closing audit finding 7.
