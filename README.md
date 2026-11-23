# Portfolio Website Manager

### Author: Eric Nohara-LeClair

---

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [AWS Lambda Function Supabase Uptime Trigger](#aws-lambda-function-supabase-uptime-trigger)
- [Known Issues](#known-issues)
- [Next Steps](#next-steps)
- [Eventual Work Items](#eventual-work-items)

## Project Description

- All in one platform for managing software engineer/general portfolio websites
- Allows updating user information in a single place without having to interface with portfolio website's source code
- Provides an easy to navigate user interface for updating, adding, or deleting user information
- Provides an easy to use API to access all user's information, all in one place
- Easy integration into user's preexisting portfolios, with the ability to get all user data with one fetch
- Eliminate any need for manual updates to the source code of portfolio websites
- Changes made on this application are seamlessly pushed to connected websites via the API
- Built with **Supabase** and **Next.js** for scalability, performance, security, and ease of development
- Utilize custom build AWS Lambda Function to periodically call the public API to ensure the Supabase project stays active (needed since I am using the free tier)

## Tech Stack

- **Frontend**:
  - [Next.js](https://nextjs.org/) - Fullstack framework used for building a fast, responsive, user-friendly interface
  - [CSS Modules](https://www.gatsbyjs.com/docs/how-to/styling/css-modules/) - Used for CSS styling without increasing runtime
- **Backend**:
  - [Supabase](https://supabase.com/) - Open-source alternative to Firebase for authentication, hosted database management, and file storage
  - [Next.js](https://nextjs.org) - Used app router for api calls and DB operations
  - [Python](https://www.python.org/) - Used for AWS Lambda Function which periodically calls the API to keep the Supabase project active
  - [Stripe](https://stripe.com/) - Used for handling payment operations
  - [OpenAI API](https://openai.com/api/) - Used for AI feature implementation
- **Hosting**:
  - [Vercel](https://vercel.com/) - Optimized to be hosted on vercel for cheap and easy deployment
  - [AWS Lambda Function](https://aws.amazon.com/lambda/) - Simple and cheap way to schedule periodic API calls to keep the Supabase project active

## AWS Lambda Function Supabase Uptime Trigger

The free tier of Supabase automatically freezes a project after a period of inactivity. This is problematic since any connected portfolio website would stop working if this occurs. To fix this, I wrote a simple AWS Lambda Function in Python to make periodic calls to the public API. This ensures that the project will never be frozen.

[GitHub Link to Supabase Uptime Trigger](https://github.com/EricNohara/Portfolio-Manager-Supabase-Trigger)

## Public files

Files stored by Nukleio, including resumes, transcripts, portraits, project images, and stored AI-generated files, use public URLs. Anyone with a URL can open and share the file without signing in or supplying an API key. Upload only files you are comfortable sharing publicly. Removing a file cannot recall copies already downloaded or cached. External links are governed by their hosting provider's access settings.

## Known Issues

No known issues.

## Next Steps

- Add fixes to AUDIT.md
- Add payment method and memberships
- Add ads to website
- Test with live users
- UI touch ups
  - Better loading screens (headshot agent, other agents, other loading screens)
  - Better tables
  - Better input forms
  - Better misc screens
  - Add onboarding to home screen when there is no data to display (no connections)

## Eventual Work Items

- Add AI feature for generating text for descriptions
- Allow for other file upload types (e.g. video for premium users)
- Add a community store for purchasing templates
- Migrate public API backend to external application
