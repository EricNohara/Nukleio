"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import InputForm from "@/app/components/InputForm/InputForm";
import { IInputFormRow, IInputFormProps } from "@/app/components/InputForm/InputForm";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import Table from "@/app/components/Table/Table";
import { useUser } from "@/app/context/UserProvider";
import { ICourseInput } from "@/app/interfaces/ICourse";
import { IUserEducationInternal } from "@/app/interfaces/IUserInfoInternal";

import PageContentHeader, { IButton } from "../../../components/PageContentHeader/PageContentHeader";

const columns = ["Name", "Grade", "Description"];
const columnWidths = [30, 10, 60];

const EMPTY_COURSE: ICourseInput = {
  name: "",
  grade: "",
  description: "",
}

export default function CoursePage() {
  const { state, dispatch } = useUser();
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<ICourseInput>(EMPTY_COURSE);
  const [courseToEdit, setCourseToEdit] = useState<ICourseInput | null>(null);
  const [education, setEducation] = useState<IUserEducationInternal | null>(null);
  const [rows, setRows] = useState<Record<string, React.ReactNode>[]>([]);
  const router = useRouter();

  const searchParams = useSearchParams();
  const educationID = Number(searchParams.get("educationID"));

  useEffect(() => {
    const education = state.education.find((edu) => edu.id === educationID);
    setEducation(education ? education : null);
  }, [educationID, state])

  useEffect(() => {
    const rows = education === null ? [] : education.courses.map((course) => ({
      "Name": course.name,
      "Grade": course.grade,
      "Description": course.description
    }));

    setRows(rows);
  }, [education])

  const handleEdit = (rowIndex: number) => {
    if (!education) return;
    const course: ICourseInput = education.courses[rowIndex];
    setCourseToEdit(course);
    setFormValues(course);
    setIsFormOpen(true);
  };

  const handleDelete = async (rowIndex: number) => {
    if (!education) return;
    const course: ICourseInput = education.courses[rowIndex];
    try {
      const res = await fetch(`/api/internal/user/education/course?educationID=${educationID}&courseName=${course.name}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Error deleting course: ${course.name}.`);

      // update cached state
      dispatch({ type: "DELETE_COURSE", payload: { educationID: educationID, courseName: course.name } });
    } catch (error) {
      console.error(error);
      alert(error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormValues(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = formValues.name.trim();
    const grade = formValues.grade?.trim();
    const description = formValues.description?.trim();

    // validate input
    if (!name) {
      alert("Please fill out all required fields.");
      return;
    }

    const newCourse: ICourseInput = {
      name: name,
      grade: grade ? grade : null,
      description: description ? description : null
    }

    try {
      if (courseToEdit) {
        // update the course
        const putPayload = {
          educationID: educationID,
          courseName: courseToEdit.name,
          course: newCourse
        }
        const res = await fetch("/api/internal/user/education/course", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(putPayload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        // update cached state
        dispatch({ type: "UPDATE_COURSE", payload: { educationID: educationID, courseName: courseToEdit.name, newCourse: newCourse } });
      } else {
        // Add the skill
        const postPayload = {
          educationID: educationID,
          course: newCourse
        }
        const res = await fetch("/api/internal/user/education/course", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postPayload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        // update the cached user
        dispatch({ type: "ADD_COURSE", payload: { educationID: educationID, course: newCourse } });
      }

    } catch (err) {
      console.error(err);
      const error = err as Error;
      alert(error.message);
    }

    // reset form
    setFormValues(EMPTY_COURSE);
    setIsFormOpen(false);
    setCourseToEdit(null);
  }

  const onClose = () => {
    setIsFormOpen(false);
  }

  const buttonOne: IButton = {
    name: "Add Course",
    onClick: () => {
      setFormValues(EMPTY_COURSE);
      setCourseToEdit(null);
      setIsFormOpen(true);
    },
  }

  const buttonFour: IButton = {
    name: "Return",
    onClick: () => { router.push("/user/education") }
  }

  const inputRows: IInputFormRow[] = [
    {
      inputOne: {
        label: "Course Name",
        name: "name",
        type: "text",
        placeholder: "Enter course name",
        required: true,
        onChange: handleChange,
        value: formValues.name
      }
    },
    {
      inputOne: {
        label: "Grade Earned",
        name: "grade",
        type: "text",
        placeholder: "Enter grade earned",
        required: false,
        onChange: handleChange,
        value: formValues.grade ? formValues.grade : ""
      }
    },
    {
      inputOne: {
        label: "Course Description",
        name: "description",
        type: "textarea",
        placeholder: "Enter course description",
        required: false,
        onChange: handleChange,
        value: formValues.description ? formValues.description : "",
        textAreaRows: 8
      }
    },
  ];

  const formProps: IInputFormProps = {
    title: courseToEdit ? "Edit Course Information" : "Add Course Information",
    buttonLabel: courseToEdit ? "Save Changes" : "Add Course",
    onSubmit: onSubmit,
    inputRows: inputRows,
    onClose: onClose
  }

  return (
    <PageContentWrapper>
      <PageContentHeader title={`${education?.institution} Courses`} buttonOne={buttonOne} buttonFour={buttonFour} />
      <Table
        columns={columns}
        rows={rows}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        columnWidths={columnWidths}
      />

      {
        isFormOpen &&
        <InputForm
          title={formProps.title}
          buttonLabel={formProps.buttonLabel}
          onSubmit={formProps.onSubmit}
          inputRows={formProps.inputRows}
          onClose={formProps.onClose}
        />
      }
    </PageContentWrapper>
  );
}
