"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import UserList from "./user-list";
import PageContentWrapper from "../components/PageContentWrapper/PageContentWrapper";
// import PageContentHeader from "../components/PageContentHeader/PageContentHeader";

// import { IButton } from "../components/PageContentHeader/PageContentHeader";

export default function UserHomePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const authenticator = async () => {
      try {
        const res = await fetch("/api/internal/auth/authenticated", { method: "GET" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message);
        }

        setUser(data.user);
      } catch (err) {
        console.error(err);
        router.push("/");
      }
    };

    authenticator();
  }, [router]);

  // const buttonOne: IButton = {
  //   name: "Add Skill",
  //   onClick: () => { }
  // }

  return (
    <PageContentWrapper>
      <UserList user={user} />
      {/* <PageContentHeader title="Skills" buttonOne={buttonOne} /> */}
    </PageContentWrapper>
  );
}
