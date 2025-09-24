"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ExternalLinkButton } from "@/app/components/Buttons/Buttons";
import InputForm from "@/app/components/InputForm/InputForm";
import { IInputFormRow, IInputFormProps } from "@/app/components/InputForm/InputForm";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import Table from "@/app/components/Table/Table";
import { useUser } from "@/app/context/UserProvider";
import { IEducationInput, IEducationUserInput, } from "@/app/interfaces/IEducation";
import { IUserEducationInternal } from "@/app/interfaces/IUserInfoInternal";

import PageContentHeader, { IButton } from "../../components/PageContentHeader/PageContentHeader";

const columns = ["Institution", "Degree", "Majors", "Minors", "GPA", "Start", "End", "Awards", "Courses"];
const columnWidths = [20, 20, 12.5, 12.5, 5, 5, 5, 12.5, 7.5];

const EMPTY_EDUCATION: IEducationUserInput = {
  institution: "",
  degree: "",
  gpa: null,
  year_start: null,
  year_end: null,
  majors: "",
  minors: "",
  awards: "",
}

export default function EducationPage() {
  const { state, dispatch } = useUser();
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<IEducationUserInput>(EMPTY_EDUCATION);
  const [educationToEdit, setEducationToEdit] = useState<IUserEducationInternal | null>(null);
  const router = useRouter();

  const handleEdit = (rowIndex: number) => {
    const education = state.education[rowIndex];
    setEducationToEdit(education);
    setFormValues(
      {
        ...education,
        majors: education.majors.join(", "),
        minors: education.minors.join(", "),
        awards: education.awards.join(", "),
      }
    );
    setIsFormOpen(true);
  };

  const handleDelete = async (rowIndex: number) => {
    const education = state.education[rowIndex];
    try {
      const res = await fetch(`/api/internal/user/education?id=${education.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Error deleting education: ${education.institution}, ${education.degree}.`);

      // update cached state
      dispatch({ type: "DELETE_EDUCATION", payload: education });
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

    const institution = formValues.institution.trim();
    const degree = formValues.degree.trim();
    const gpa = formValues.gpa;
    const year_start = formValues.year_start;
    const year_end = formValues.year_end;
    const majors = formValues.majors;
    const minors = formValues.minors;
    const awards = formValues.awards;

    // validate input
    if (!institution || !degree) {
      alert("Please fill out all required fields.");
      return;
    }

    // Validate dates
    if (year_start && year_end) {
      if (year_end < year_start) {
        alert("Year end cannot be before year start.");
        return;
      }

      if (year_start < 0 || year_end < 0) {
        alert("Year start and year end must be positive numbers.");
        return;
      }
    }

    const newEducation: IEducationInput = {
      institution: institution,
      degree: degree,
      gpa: gpa ? Number(gpa) : null,
      year_start: year_start ? Number(year_start) : null,
      year_end: year_end ? Number(year_end) : null,
      majors: majors ? majors.trim().split(",").map(s => s.trim()) : [],
      minors: minors ? minors.trim().split(",").map(s => s.trim()) : [],
      awards: awards ? awards.trim().split(",").map(s => s.trim()) : []
    }

    try {
      if (educationToEdit) {
        // update the education
        const editPayload = {
          id: educationToEdit.id,
          updatedEducation: newEducation
        }
        const res = await fetch("/api/internal/user/education", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editPayload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        const newUserEducation: IUserEducationInternal = {
          ...newEducation,
          id: educationToEdit.id,
          courses: educationToEdit.courses
        }

        // update cached state
        dispatch({ type: "UPDATE_EDUCATION", payload: { old: educationToEdit, new: newUserEducation } });
      } else {
        // Add the education
        const res = await fetch("/api/internal/user/education", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEducation),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        const newUserEducation: IUserEducationInternal = {
          ...newEducation,
          id: data.id,
          courses: []
        }

        // update the cached user
        dispatch({ type: "ADD_EDUCATION", payload: newUserEducation });
      }

    } catch (err) {
      console.error(err);
      const error = err as Error;
      alert(error.message);
    }

    // reset form
    setFormValues(EMPTY_EDUCATION);
    setIsFormOpen(false);
    setEducationToEdit(null);
  }

  const onClose = () => {
    setIsFormOpen(false);
  }

  const buttonOne: IButton = {
    name: "Add Education",
    onClick: () => {
      setFormValues(EMPTY_EDUCATION);
      setEducationToEdit(null);
      setIsFormOpen(true);
    },
  }

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
      <ExternalLinkButton onClick={() => router.push(`/user/education/${education.id}/course`)}>
        <ExternalLink size={20} strokeWidth={2} />
      </ExternalLinkButton>
  }));

  const formProps: IInputFormProps = {
    title: educationToEdit ? "Edit Education Information" : "Add Education Information",
    buttonLabel: educationToEdit ? "Save Changes" : "Add Education",
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
