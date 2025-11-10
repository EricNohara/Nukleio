"use client";

import ContactPageIcon from "@mui/icons-material/ContactPage";
import EmailIcon from "@mui/icons-material/Email";
import FacebookIcon from "@mui/icons-material/Facebook";
import GitHubIcon from "@mui/icons-material/GitHub";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import SchoolIcon from "@mui/icons-material/School";
import {
  Typography,
  Link,
  Button,
  Box,
  Avatar,
  Card,
  CardContent,
} from "@mui/material";
import { type User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../context/AuthProvider";
import IUser from "../interfaces/IUser";

export default function UserList({ user }: { user: User | null }) {
  const router = useRouter();
  const { setIsLoggedIn } = useAuth();
  useEffect(() => {
    if (user) setIsLoggedIn(true);
  }, [setIsLoggedIn, user]);

  const [userData, setUserData] = useState<IUser>({
    email: "",
    name: "",
    phone_number: null,
    current_address: null,
    current_company: null,
    x_url: null,
    github_url: null,
    linkedin_url: null,
    portrait_url: null,
    resume_url: null,
    transcript_url: null,
    instagram_url: null,
    facebook_url: null,
    bio: null,
    current_position: null,
  });

  const getProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/internal/user");
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setUserData(data.userData);
    } catch (error) {
      alert("Error loading user data!");
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (user?.id) getProfile();
  }, [user, getProfile]);

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.push("/user/settings/user");
  };

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      const res = await fetch("/api/internal/user", { method: "DELETE" });

      if (res.status === 204) {
        alert("Successfully deleted user");
      } else {
        const data = await res.json();
        throw new Error(data.message);
      }

      setIsLoggedIn(false);
      router.push("/user/login");
    } catch (err) {
      const error = err as Error;
      alert(error.message);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Typography
        variant="h3"
        component="h2"
        className="text-center"
        fontWeight="bold"
        marginBottom="2.5%"
      >
        {userData?.name}
      </Typography>
      {userData.current_position && (
        <Typography
          variant="h5"
          component="h3"
          className="text-center"
          marginBottom="5%"
        >
          {userData?.current_position}
        </Typography>
      )}
      {userData.portrait_url ? (
        <Link
          href={userData.portrait_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Avatar
            alt="avatar"
            src={userData.portrait_url}
            sx={{ width: 150, height: 150 }}
          />
        </Link>
      ) : (
        <Avatar sx={{ width: 150, height: 150 }}>
          {userData.name && userData.name[0]}
        </Avatar>
      )}
      <Box
        display="flex"
        flexDirection="column"
        margin="1rem"
        fontStyle="italic"
        alignItems="center"
      >
        <Typography>{userData?.current_address}</Typography>
        <Typography>{userData?.email}</Typography>
        <Typography>{userData?.phone_number}</Typography>
        {userData?.bio && (
          <Card sx={{ minWidth: 275, maxWidth: 400, mt: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: "pre-line" }}
              >
                {userData.bio}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
      <Box display="flex" gap="1rem" margin="1rem">
        {userData?.resume_url && (
          <Link
            href={userData.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${userData.name}'s Resume`}
          >
            <ContactPageIcon fontSize="large" sx={{ fontSize: "3rem" }} />
          </Link>
        )}
        {userData?.transcript_url && (
          <Link
            href={userData.transcript_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${userData.name}'s Transcript`}
          >
            <SchoolIcon fontSize="large" sx={{ fontSize: "3rem" }} />
          </Link>
        )}
        {userData?.github_url && (
          <Link
            href={userData.github_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${userData.name}'s GitHub URL`}
          >
            <GitHubIcon fontSize="large" sx={{ fontSize: "3rem" }} />
          </Link>
        )}
        {userData?.linkedin_url && (
          <Link
            href={userData.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${userData.name}'s LinkedIn URL`}
          >
            <LinkedInIcon fontSize="large" sx={{ fontSize: "3rem" }} />
          </Link>
        )}
        {userData?.facebook_url && (
          <Link
            href={userData.facebook_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${userData.name}'s Facebook URL`}
          >
            <FacebookIcon fontSize="large" sx={{ fontSize: "3rem" }} />
          </Link>
        )}
        {userData?.instagram_url && (
          <Link
            href={userData.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${userData.name}'s Instagram URL`}
          >
            <InstagramIcon fontSize="large" sx={{ fontSize: "3rem" }} />
          </Link>
        )}
        <Link
          href={`mailto:${userData.email}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${userData.name}'s Email`}
        >
          <EmailIcon fontSize="large" sx={{ fontSize: "3rem" }} />
        </Link>
      </Box>
      <Box display="flex" alignItems="center" gap="1rem" marginTop="1rem">
        <Button
          type="submit"
          variant="contained"
          color="primary"
          onClick={handleEdit}
          aria-label={`Edit User Information`}
        >
          Edit
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="error"
          onClick={handleDelete}
          aria-label={`Delete User Information`}
        >
          Delete
        </Button>
      </Box>
    </Box>
  );
}
