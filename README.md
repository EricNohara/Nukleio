# Portfolio Website Manager

### Author: Eric Nohara-LeClair

---

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Supabase Backend Setup](#supabase-backend-setup)
- [How to Install and Run](#how-to-install-and-run)
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

## Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## Supabase Backend Setup

1. Follow [these steps](https://supabase.com/docs/guides/getting-started) to sign into supabase and create a new project
2. Add database tables with the [schema](./doc/assets/schema.pdf) provided
3. Create storage buckets for portraits, resumes, transcripts, and project thumbnails
4. Follow [these steps](https://supabase.com/docs/guides/database/postgres/row-level-security) to add RLS policies to every table, only allowing users to access and mutate their own data when they are signed in
5. Set a minimum password length in the auth dashboard
6. Copy the following information for .env.local file:
   - The public url of the project
   - The ANON key for the project
   - The service role key for the project

## How to Install and Run

1. Clone the repository

```bash
git clone https://github.com/your-username/portfolio-manager.git
```

2. Enter root directory

```bash
cd portfolio-manager
```

3. Create a valid .env.local file in the root of the project

```bash
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
NEXT_SUPABASE_SERVICE_ROLE_KEY=""
API_ENCRYPTION_KEY="64 character key"
MIN_PASSWORD_LEN=6
```

4. Run the application

```bash
npm run dev
```

## AWS Lambda Function Supabase Uptime Trigger

The free tier of Supabase automatically freezes a project after a period of inactivity. This is problematic since any connected portfolio website would stop working if this occurs. To fix this, I wrote a simple AWS Lambda Function in Python to make periodic calls to the public API. This ensures that the project will never be frozen.

[GitHub Link to Supabase Uptime Trigger](https://github.com/EricNohara/Portfolio-Manager-Supabase-Trigger)

## Known Issues

No known issues.

## Next Steps

- Add payment method and memberships
- Support more languages through new libraries (Python, Java, C#, etc.)
- Documentation page for API + code integrations
- Add ads to website
- Test with live users

## Eventual Work Items

- Add AI feature for generating text for descriptions
- Add resume AI generation feature
- Allow for other file upload types (e.g. video for premium users)
- Add a community store for purchasing templates
- Migrate public API backend to external application
