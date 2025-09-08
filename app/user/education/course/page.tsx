"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { ExternalLinkButton } from "@/app/components/Buttons/Buttons";
import InputForm from "@/app/components/InputForm/InputForm";
import { IInputFormRow, IInputFormProps } from "@/app/components/InputForm/InputForm";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import Table from "@/app/components/Table/Table";
import { useUser } from "@/app/context/UserProvider";
import { IEducationInput, IEducationUserInput, } from "@/app/interfaces/IEducation";
import { IUserEducationInternal } from "@/app/interfaces/IUserInfoInternal";
import { ICourseInput } from "@/app/interfaces/ICourse";
import { useSearchParams } from "next/navigation";

import PageContentHeader, { IButton } from "../../components/PageContentHeader/PageContentHeader";

const columns = ["Name", "Grade", "Description"];
const columnWidths = [25, 10, 65];

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
  const router = useRouter();

  const searchParams = useSearchParams();
  const educationID = Number(searchParams.get("educationID"));

  useEffect(() => {
    const education = state.education.find((edu) => edu.id === educationID);
    setEducation(education ? education : null);
  }, [educationID])

  const handleEdit = (rowIndex: number) => {
    if (!education) return;
    const course: ICourseInput = education.courses[rowIndex];
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
      dispatch({ type: "DELETE_COURSE", payload: { educationID: educationID, courseIndex: rowIndex } });
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
    const grade = formValues.grade.trim();
    const description = formValues.description;

    // validate input
    if (!name || !grade || !description) {
      alert("Please fill out all required fields.");
      return;
    }

    const newCourse: ICourseInput = {
      name: name,
      grade: grade,
      description: description
    }

    try {
      if (courseToEdit) {
        // update the course
        const putPayload = {
          educationID: educationID,
          courseName: courseToEdit.name,
          updatedCourse: newCourse
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
          sentCourse: newCourse
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
  // 
  const inputRows: IInputFormRow[] = [
    {
      inputOne: {
        label: "Institution Name",
        name: "institution",
        type: "text",
        placeholder: "Enter institution name",
        required: true,
        onChange: handleChange,
        value: formValues.institution
      }
    },
    {
      inputOne: {
        label: "Degree",
        name: "degree",
        type: "text",
        placeholder: "Enter degree",
        required: true,
        onChange: handleChange,
        value: formValues.degree
      },
      inputTwo: {
        label: "Grade Point Average",
        name: "gpa",
        type: "number",
        placeholder: "Enter grade point average",
        required: false,
        onChange: handleChange,
        value: formValues.gpa ? `${formValues.gpa}` : ""
      }
    },
    {
      inputOne: {
        label: "Year Start",
        name: "year_start",
        type: "number",
        placeholder: "Enter year started",
        required: false,
        onChange: handleChange,
        value: formValues.year_start ? `${formValues.year_start}` : ""
      },
      inputTwo: {
        label: "Year End",
        name: "year_end",
        type: "number",
        placeholder: "Enter year ended",
        required: false,
        onChange: handleChange,
        value: formValues.year_end ? `${formValues.year_end}` : ""
      }
    },
    {
      inputOne: {
        label: "Majors (Separated by Comma)",
        name: "majors",
        type: "text",
        placeholder: "Enter list of majors",
        required: false,
        onChange: handleChange,
        value: formValues.majors
      }
    },
    {
      inputOne: {
        label: "Minors (Separated by Comma)",
        name: "minors",
        type: "text",
        placeholder: "Enter list of minors",
        required: false,
        onChange: handleChange,
        value: formValues.minors
      }
    },
    {
      inputOne: {
        label: "Awards (Separated by Comma)",
        name: "awards",
        type: "text",
        placeholder: "Enter list of awards",
        required: false,
        onChange: handleChange,
        value: formValues.awards
      }
    },
  ];

  const rows = state.education.map((education) => ({
    "Institution": education.institution,
    "Degree": education.degree,
    "GPA": education.gpa,
    "Start": education.year_start,
    "End": education.year_end,
    "Majors": education.majors.join(", "),
    "Minors": education.minors.join(", "),
    "Awards": education.awards.join(", "),
    "Courses":
      <ExternalLinkButton onClick={() => router.push(`/user/education/course?educationID=${education.id}`)}>
        <ExternalLink size={20} strokeWidth={2} />
      </ExternalLinkButton>
  }));

  const formProps: IInputFormProps = {
    title: courseToEdit ? "Edit Education Information" : "Add Education Information",
    buttonLabel: courseToEdit ? "Save Changes" : "Add Education",
    onSubmit: onSubmit,
    inputRows: inputRows,
    onClose: onClose
  }

  return (
    <PageContentWrapper>
      <PageContentHeader title="Education" buttonOne={buttonOne} />
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
