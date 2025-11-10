"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";

import InputForm from "@/app/components/InputForm/InputForm";
import { IInputFormRow, IInputFormProps } from "@/app/components/InputForm/InputForm";
import OpenProjectOverlay from "@/app/components/OpenProjectOverlay/OpenProjectOverlay";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import ProjectCard from "@/app/components/ProjectCard/ProjectCard";
import { useUser } from "@/app/context/UserProvider";
import { IProjectInput } from "@/app/interfaces/IProject";
import { IProjectInternal } from "@/app/interfaces/IUserInfoInternal";

import styles from "./ProjectsPage.module.css";
import PageContentHeader, { IButton } from "../../components/PageContentHeader/PageContentHeader";

const EMPTY_PROJECT_INPUT: IProjectInput = {
    name: "",
    date_start: "",
    date_end: "",
    languages_used: null,
    frameworks_used: null,
    technologies_used: null,
    description: "",
    github_url: null,
    demo_url: null,
    thumbnail_url: null,
}

export default function ProjectsPage() {
    const { state, dispatch } = useUser();
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [formValues, setFormValues] = useState<IProjectInput>(EMPTY_PROJECT_INPUT);
    const [projectToEdit, setProjectToEdit] = useState<IProjectInternal | null>(null);
    const [openProject, setOpenProject] = useState<number | null>(null);
    const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(null); // for single and double clicks
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const indexParam = searchParams.get("index");

    // used to open given project if inputted as search param
    useEffect(() => {
        if (indexParam !== null && state.projects.length > 0) {
            const project = state.projects[Number(indexParam)];
            if (project) {
                setProjectToEdit(project);
                setFormValues(project);
                setIsFormOpen(true);
            }
        }
    }, [indexParam, state])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setActiveProjectIndex(null); // clear active card
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleEdit = (rowIndex: number) => {
        const project = state.projects[rowIndex];
        setProjectToEdit(project);
        setFormValues(project);
        setIsFormOpen(true);
    };

    const handleDelete = async (rowIndex: number) => {
        const project = state.projects[rowIndex];
        try {
            const res = await fetch(`/api/internal/user/projects?projectID=${project.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(`Error deleting project: ${project.name}.`);

            // update cached state
            dispatch({ type: "DELETE_PROJECT", payload: project });
        } catch (error) {
            console.error(error);
            alert(error);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // For CSV fields
        if (["languages_used", "frameworks_used", "technologies_used"].includes(name)) {
            setFormValues(prev => ({ ...prev, [name]: value.split(",").map(v => v.trim()) }));
        } else {
            setFormValues(prev => ({ ...prev, [name]: value }));
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const name = formValues.name.trim();
        const date_start = new Date(formValues.date_start);
        const date_end = new Date(formValues.date_end);
        const languages_used = formValues.languages_used;
        const frameworks_used = formValues.frameworks_used;
        const technologies_used = formValues.technologies_used;
        const description = formValues.description.trim();
        const github_url = formValues.github_url ? formValues.github_url.trim() : null;
        const demo_url = formValues.demo_url ? formValues.demo_url.trim() : null;
        const thumbnail_url = formValues.thumbnail_url ? formValues.thumbnail_url.trim() : null;

        // validate input
        if (!name || !description || !date_start || !date_end) {
            alert("Please fill out all required fields.");
            return;
        }

        // Validate dates
        if (date_end < date_start) {
            alert("End date cannot be before start date.");
            return;
        }

        const newProject: IProjectInput = {
            name: name,
            date_start: date_start.toISOString().split("T")[0],
            date_end: date_end.toISOString().split("T")[0],
            languages_used: languages_used,
            frameworks_used: frameworks_used,
            technologies_used: technologies_used,
            description: description,
            github_url: github_url,
            demo_url: demo_url,
            thumbnail_url: thumbnail_url
        }

        try {
            if (projectToEdit) {
                // update the project
                const editPayload = {
                    prevProjectID: projectToEdit.id,
                    updatedProject: newProject
                }
                const res = await fetch("/api/internal/user/projects", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(editPayload),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);

                const newProjectInternal: IProjectInternal = {
                    id: projectToEdit.id,
                    ...newProject
                }

                // update cached state
                dispatch({ type: "UPDATE_PROJECT", payload: { old: projectToEdit, new: newProjectInternal } });
            } else {
                // Add the skill
                const res = await fetch("/api/internal/user/projects", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newProject),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);

                const newProjectInternal: IProjectInternal = {
                    id: data.id,
                    ...newProject
                }

                // update the cached user
                dispatch({ type: "ADD_PROJECT", payload: newProjectInternal });
            }

        } catch (err) {
            console.error(err);
            const error = err as Error;
            alert(error.message);
        }

        // reset form
        setFormValues(EMPTY_PROJECT_INPUT);
        setIsFormOpen(false);
        setProjectToEdit(null);
    }

    const onClose = () => {
        setIsFormOpen(false);
        setProjectToEdit(null);

        // remove the ?index param from url
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.delete("index");
        const newQuery = current.toString();
        const newUrl = newQuery ? `?${newQuery}` : "";

        router.replace(`/user/projects${newUrl}`, { scroll: false });
    }

    const handleOpenProject = (rowIndex: number) => {
        setOpenProject(rowIndex);
    }

    const handleSingleClick = (rowIndex: number) => {
        setActiveProjectIndex(rowIndex);
    }

    const buttonOne: IButton = {
        name: "Add Project",
        onClick: () => {
            setFormValues(EMPTY_PROJECT_INPUT);
            setProjectToEdit(null);
            setIsFormOpen(true);
        },
    }

    const inputRows: IInputFormRow[] = [
        {
            inputOne: {
                label: "Project Name",
                name: "name",
                type: "text",
                placeholder: "Enter project name",
                required: true,
                onChange: handleChange,
                value: formValues.name
            }
        },
        {
            inputOne: {
                label: "Date Start",
                name: "date_start",
                type: "date",
                placeholder: "Enter start date",
                required: true,
                onChange: handleChange,
                value: formValues.date_start
            },
            inputTwo: {
                label: "Date End",
                name: "date_end",
                type: "date",
                placeholder: "Enter end date",
                required: true,
                onChange: handleChange,
                value: formValues.date_end
            }
        },
        {
            inputOne: {
                label: "GitHub URL",
                name: "github_url",
                type: "text",
                placeholder: "Enter GitHub url",
                required: false,
                onChange: handleChange,
                value: formValues.github_url ? formValues.github_url : ""
            },
            inputTwo: {
                label: "Demo URL",
                name: "demo_url",
                type: "text",
                placeholder: "Enter demo url",
                required: false,
                onChange: handleChange,
                value: formValues.demo_url ? formValues.demo_url : ""
            }
        },
        {
            inputOne: {
                label: "Programming Languages Used",
                name: "languages_used",
                type: "text",
                placeholder: "Enter programming languages separated by commas",
                required: false,
                onChange: handleChange,
                value: formValues.languages_used ? formValues.languages_used.join(", ") : ""
            }
        },
        {
            inputOne: {
                label: "Frameworks Used",
                name: "frameworks_used",
                type: "text",
                placeholder: "Enter frameworks separated by commas",
                required: false,
                onChange: handleChange,
                value: formValues.frameworks_used ? formValues.frameworks_used.join(", ") : ""
            },
            inputTwo: {
                label: "Technologies Used",
                name: "technologies_used",
                type: "text",
                placeholder: "Enter technologies separated by commas",
                required: false,
                onChange: handleChange,
                value: formValues.technologies_used ? formValues.technologies_used.join(", ") : ""
            }
        },
        {
            inputOne: {
                label: "Description",
                name: "description",
                type: "text",
                placeholder: "Enter project description",
                required: true,
                onChange: handleChange,
                value: formValues.description,
            }
        },
    ];

    const formProps: IInputFormProps = {
        title: projectToEdit ? "Edit Project Information" : "Add Project Information",
        buttonLabel: projectToEdit ? "Save Changes" : "Add Project",
        onSubmit: onSubmit,
        inputRows: inputRows,
        onClose: onClose
    }

    return (
        <PageContentWrapper>
            <PageContentHeader title="Projects" buttonOne={buttonOne} />
            <div className={styles.container} ref={containerRef}>
                {state.projects.map((project, i) =>
                    <ProjectCard
                        project={project}
                        key={i}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onOpen={handleOpenProject}
                        onSingleClick={handleSingleClick}
                        index={i}
                        isActive={activeProjectIndex === i}
                    />)}
            </div>

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

            {
                openProject !== null &&
                <OpenProjectOverlay
                    project={state.projects[openProject]}
                    index={openProject}
                    onEdit={(n: number) => { handleEdit(n); setOpenProject(null) }}
                    onDelete={async (n: number) => { await handleDelete(n); setOpenProject(null) }}
                    onClose={() => setOpenProject(null)}
                />
            }
        </PageContentWrapper>
    );
}
