"use client";

import { useState } from "react";

import InputForm from "@/app/components/InputForm/InputForm";
import { IInputFormRow, IInputFormProps } from "@/app/components/InputForm/InputForm";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import Table from "@/app/components/Table/Table";
import { useUser } from "@/app/context/UserProvider";
import { IExperience } from "@/app/interfaces/IExperience";

import PageContentHeader, { IButton } from "../../components/PageContentHeader/PageContentHeader";

const columns = ["Company", "Title", "Start", "End", "Description"];
const columnWidths = [20, 20, 12.5, 12.5, 35];

export default function WorkExperiencePage() {
  const { state, dispatch } = useUser();
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<IExperience>({
    company: "",
    job_title: "",
    date_start: null,
    date_end: null,
    job_description: null,
  });
  const [experienceToEdit, setExperienceToEdit] = useState<IExperience | null>(null);

  const handleEdit = (rowIndex: number) => {
    const experience = state.experiences[rowIndex];
    setExperienceToEdit(experience);
    setFormValues(experience);
    setIsFormOpen(true);
  };

  const handleDelete = async (rowIndex: number) => {
    const experience = state.experiences[rowIndex];
    try {
      const res = await fetch(`/api/internal/user/experience?company=${experience.company}&job_title=${experience.job_title}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Error deleting experience: ${experience.company}, ${experience.job_title}.`);

      // update cached state
      dispatch({ type: "DELETE_EXPERIENCE", payload: experience });
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

    const company = formValues.company.trim();
    const job_title = formValues.job_title.trim();
    const job_description = formValues.job_description?.trim();
    const date_start = formValues.date_start ? new Date(formValues.date_start) : null;
    const date_end = formValues.date_end ? new Date(formValues.date_end) : null;

    // validate input
    if (!company || !job_title) {
      alert("Please fill out all required fields.");
      return;
    }

    // Validate dates
    if (date_end && !date_start) {
      alert("Start date must be provided if end date exists.");
      return;
    }

    if (date_start && date_end && date_end < date_start) {
      alert("End date cannot be before start date.");
      return;
    }

    const newExperience: IExperience = {
      company: company,
      job_title: job_title,
      job_description: job_description ? job_description : null,
      date_start: date_start ? date_start.toISOString().split("T")[0] : null,
      date_end: date_end ? date_end.toISOString().split("T")[0] : null
    }

    try {
      if (experienceToEdit) {
        // update the experience
        const editPayload = {
          prevCompany: experienceToEdit.company,
          prevJob: experienceToEdit.job_title,
          updatedExperience: newExperience
        }
        const res = await fetch("/api/internal/user/experience", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editPayload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        // update cached state
        dispatch({ type: "UPDATE_EXPERIENCE", payload: { old: experienceToEdit, new: newExperience } });
      } else {
        // Add the experience
        const res = await fetch("/api/internal/user/experience", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newExperience),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        // update the cached user
        dispatch({ type: "ADD_EXPERIENCE", payload: newExperience });
      }

    } catch (err) {
      console.error(err);
      const error = err as Error;
      alert(error.message);
    }

    // reset form
    setFormValues({ company: "", job_title: "", job_description: null, date_start: "", date_end: "" });
    setIsFormOpen(false);
    setExperienceToEdit(null);
  }

  const onClose = () => {
    setIsFormOpen(false);
  }

  const buttonOne: IButton = {
    name: "Add Experience",
    onClick: () => {
      setFormValues({
        company: "",
        job_title: "",
        job_description: null,
        date_start: null,
        date_end: null,
      });
      setExperienceToEdit(null);
      setIsFormOpen(true);
    },
  }

  const inputRows: IInputFormRow[] = [
    {
      inputOne: {
        label: "Company Name",
        name: "company",
        type: "text",
        placeholder: "Enter company name",
        required: true,
        onChange: handleChange,
        value: formValues.company
      }
    },
    {
      inputOne: {
        label: "Job Title",
        name: "job_title",
        type: "text",
        placeholder: "Enter job title",
        required: true,
        onChange: handleChange,
        value: formValues.job_title
      }
    },
    {
      inputOne: {
        label: "Date Start",
        name: "date_start",
        type: "date",
        placeholder: "Enter start date",
        required: false,
        onChange: handleChange,
        value: formValues.date_start ? `${formValues.date_start}` : ""
      },
      inputTwo: {
        label: "Date End",
        name: "date_end",
        type: "date",
        placeholder: "Enter end date",
        required: false,
        onChange: handleChange,
        value: formValues.date_end ? `${formValues.date_end}` : ""
      }
    },
    {
      inputOne: {
        label: "Job Description",
        name: "job_description",
        type: "textarea",
        placeholder: "Enter job description",
        required: false,
        onChange: handleChange,
        value: formValues.job_description ? formValues.job_description : "",
        textAreaRows: 8
      }
    },
  ];

  const rows = state.experiences.map((experience) => ({
    "Company": experience.company,
    "Title": experience.job_title,
    "Start": experience.date_start,
    "End": experience.date_end,
    "Description": experience.job_description,
  }));

  const formProps: IInputFormProps = {
    title: experienceToEdit ? "Edit Experience Information" : "Add Experience Information",
    buttonLabel: experienceToEdit ? "Save Changes" : "Add Experience",
    onSubmit: onSubmit,
    inputRows: inputRows,
    onClose: onClose
  }

  return (
    <PageContentWrapper>
      <PageContentHeader title="Work Experiences" buttonOne={buttonOne} />
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
