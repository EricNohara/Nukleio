"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";

import OpenProjectOverlay from "@/app/components/OpenProjectOverlay/OpenProjectOverlay";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import ProjectCard from "@/app/components/ProjectCard/ProjectCard";
import { useToast } from "@/app/context/ToastProvider";
import { useUser } from "@/app/context/UserProvider";
import { IProjectInput } from "@/app/interfaces/IProject";
import { IProjectInternal } from "@/app/interfaces/IUserInfoInternal";
import { compressImage } from "@/utils/file-upload/compress";
import { uploadFile } from "@/utils/file-upload/upload";

import ProjectFormModal from "./ProjectFormModal";
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
};

export default function ProjectsPage() {
    const { state, dispatch } = useUser();
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [formValues, setFormValues] = useState<IProjectInput>(EMPTY_PROJECT_INPUT);
    const [thumbnailDoc, setThumbnailDoc] = useState<File | null>(null);
    const [projectToEdit, setProjectToEdit] = useState<IProjectInternal | null>(null);
    const [openProject, setOpenProject] = useState<number | null>(null);
    const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(null); // for single and double clicks

    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const indexParam = searchParams.get("index");
    const toast = useToast();

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
    }, [indexParam, state]);

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
            // delete the project thumbnail if one exists
            if (project.thumbnail_url) {
                await handleFileDelete(project.thumbnail_url)
            }

            const res = await fetch(`/api/internal/user/projects?projectID=${project.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(`Error deleting project: ${project.name}.`);

            // update cached state
            dispatch({ type: "DELETE_PROJECT", payload: project });
            toast.success("Success", `Successfully deleted user project: ${project.name}.`);
        } catch (error) {
            const err = error as Error;
            toast.error("Error", err.message);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // For CSV fields
        if (["languages_used", "frameworks_used", "technologies_used"].includes(name)) {
            setFormValues(prev => ({ ...prev, [name]: value.split(",").map(v => v.trim()).filter(Boolean) }));
        } else {
            setFormValues(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleUpload = async (): Promise<string | undefined> => {
        try {
            const compressed = await compressImage(thumbnailDoc);
            const publicProjectThumbnailUrl = await uploadFile(compressed, "project_thumbnails");
            if (!publicProjectThumbnailUrl) throw new Error();
            setThumbnailDoc(null);
            return publicProjectThumbnailUrl;
        } catch {
            toast.error("Error", "Failed to upload your project thumbnail. Please try again.");
        }
    };

    const handleFileDelete = async (url: string | undefined) => {
        try {
            if (!url) throw new Error("Invalid url");
            const res = await fetch(`/api/internal/storage?publicURL=${url}`, { method: "DELETE" });

            if (res.status !== 204) {
                const data = await res.json();
                throw new Error(data.message);
            }

            // update state
            setFormValues({ ...formValues, thumbnail_url: null })
        } catch {
            toast.error("Error", "Error deleting your document.");
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
            toast.warning("Warning", "Please fill out all required fields before submitting.");
            return;
        }

        // Validate dates
        if (date_end < date_start) {
            toast.warning("Warning", "Invalid end date. End date cannot be before the start date.");
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
        };

        try {
            // upload the new project thumbnail if one was uploaded
            if (thumbnailDoc !== null) {
                const publicThumbnailUrl = await handleUpload();
                if (!publicThumbnailUrl) throw new Error()
                newProject.thumbnail_url = publicThumbnailUrl
            }

            if (projectToEdit) {
                // update the project
                const editPayload = {
                    prevProjectID: projectToEdit.id,
                    updatedProject: newProject
                };
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
                };

                // delete the old thumbnail if one exists
                if (formValues.thumbnail_url) {
                    await handleFileDelete(formValues.thumbnail_url)
                }

                // update cached state
                dispatch({ type: "UPDATE_PROJECT", payload: { old: projectToEdit, new: newProjectInternal } });
            } else {
                // Add the project
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
                };

                // update the cached user
                dispatch({ type: "ADD_PROJECT", payload: newProjectInternal });
            }
            toast.success("Success", `Successfully saved user project: ${name}.`);
        } catch (err) {
            const error = err as Error;
            toast.error("Error", `Failed to save user project: ${error.message}.`);
        }

        // reset form
        setFormValues(EMPTY_PROJECT_INPUT);
        setIsFormOpen(false);
        setProjectToEdit(null);
    };

    const onClose = () => {
        setIsFormOpen(false);
        setProjectToEdit(null);

        // remove the ?index param from url
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.delete("index");
        const newQuery = current.toString();
        const newUrl = newQuery ? `?${newQuery}` : "";

        router.replace(`/user/projects${newUrl}`, { scroll: false });
    };

    const handleOpenProject = (rowIndex: number) => {
        setOpenProject(rowIndex);
    };

    const handleSingleClick = (rowIndex: number) => {
        setActiveProjectIndex(rowIndex);
    };

    const buttonOne: IButton = {
        name: "Add Project",
        onClick: () => {
            setFormValues(EMPTY_PROJECT_INPUT);
            setProjectToEdit(null);
            setIsFormOpen(true);
        },
    };

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
                <ProjectFormModal
                    title={projectToEdit ? "Edit Project Information" : "Add Project"}
                    submitLabel={projectToEdit ? "Save Changes" : "Add Project"}
                    value={formValues}
                    onChange={handleChange}
                    onSubmit={onSubmit}
                    onClose={onClose}
                    setThumbnailDoc={setThumbnailDoc}
                />
            }

            {
                openProject !== null &&
                <OpenProjectOverlay
                    project={state.projects[openProject]}
                    index={openProject}
                    onEdit={(n: number) => { handleEdit(n); setOpenProject(null); }}
                    onDelete={async (n: number) => { await handleDelete(n); setOpenProject(null); }}
                    onClose={() => setOpenProject(null)}
                />
            }
        </PageContentWrapper>
    );
}
