"use client";

import { Typography, Button, Container, Link } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import CourseList from "./course-list";

function CoursePageWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const educationID = searchParams.get("educationID");

  return (
    <>
      <CourseList />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={() =>
          router.push(`/user/education/course/add?educationID=${educationID}`)
        }
        fullWidth
      >
        Add Course
      </Button>
    </>
  );
}

export default function CoursePage() {
  return (
    <Container
      maxWidth="lg"
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <Typography
        variant="h3"
        component="h2"
        className="text-center"
        fontWeight="bold"
        marginBottom="5%"
      >
        Courses
      </Typography>
      <Suspense fallback={<div>Loading...</div>}>
        <CoursePageWrapper />
      </Suspense>
      <Link underline="hover" href="/user/education" marginTop="1rem">
        Return
      </Link>
    </Container>
  );
}
