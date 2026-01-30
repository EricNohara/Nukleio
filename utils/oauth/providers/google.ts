// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleGoogleSignup(identityData: any) {
  const username = identityData.full_name ?? identityData.name;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    name: username,
    portrait_url: identityData.avatar_url ?? identityData.picture,
  };

  //   add Google api logic here

  //   if (username) {
  //     const publicData = await getUserGithubPublicData(username);
  //     if (publicData) {
  //       updates.current_company = publicData.company;
  //       updates.current_address = publicData.location;
  //       updates.bio = publicData.bio;
  //     }
  //   }

  return updates;
}
