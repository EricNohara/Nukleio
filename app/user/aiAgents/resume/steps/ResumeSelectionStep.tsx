"use client";

import { BookMarked, Brain, Briefcase, GraduationCap, Rocket } from "lucide-react";

import { IUserInfoInternal } from "@/app/interfaces/IUserInfoInternal";
import formatDate from "@/utils/general/formatDate";

import SelectionStep from "./SelectionStep";
import { SelectableItem } from "./SelectionStep";

type ResumeStep =
    | "jobs"
    | "education"
    | "courses"
    | "experience"
    | "projects"
    | "skills";

type MultiSelectKey =
    | "targetJobs"
    | "educationIds"
    | "courseIds"
    | "experienceIds"
    | "projectIds"
    | "skillIds";

type GenerationType = "generate" | "generateAi";

type ResumeFormData = {
    generationType: GenerationType;
    templateId: string;
    targetJobs: string[];
    educationIds: string[];
    courseIds: string[];
    experienceIds: string[];
    projectIds: string[];
    skillIds: string[];
};

type ResumeSelectionStepProps = {
    step: ResumeStep;
    formData: ResumeFormData;
    targetJobOptions: SelectableItem[];
    state: IUserInfoInternal;
    onToggle: (key: MultiSelectKey, id: string) => void;
};

const isString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

export default function ResumeSelectionStep({
    step,
    formData,
    targetJobOptions,
    state,
    onToggle,
}: ResumeSelectionStepProps) {
    const config = getSelectionStepConfig({
        step,
        formData,
        targetJobOptions,
        state,
        onToggle,
    });

    if (!config) return null;

    return (
        <SelectionStep
            title={config.title}
            items={config.items}
            selectedIds={config.selectedIds}
            onToggle={config.onToggle}
        />
    );
}

function getSelectionStepConfig({
    step,
    formData,
    targetJobOptions,
    state,
    onToggle,
}: {
    step: ResumeStep;
    formData: ResumeFormData;
    targetJobOptions: SelectableItem[];
    state: ResumeSelectionStepProps["state"];
    onToggle: (key: MultiSelectKey, id: string) => void;
}): {
    title: string;
    items: SelectableItem[];
    selectedIds: string[];
    onToggle: (id: string) => void;
} | null {
    switch (step) {
        case "jobs":
            return {
                title: "Target Jobs",
                items: targetJobOptions,
                selectedIds: formData.targetJobs,
                onToggle: (id) => onToggle("targetJobs", id),
            };

        case "education":
            return {
                title: "Education Entries",
                items: state.education.map((e) => ({
                    id: e.id,
                    label: e.institution,
                    subtitle: [
                        e.degree,
                        ...(e.majors ?? []).filter(isString),
                        ...(e.minors ?? []).filter(isString),
                    ].join(" | "),
                    footer: e.year_start && e.year_end ? `${e.year_start} - ${e.year_end}` : undefined,
                    icon: GraduationCap
                })),
                selectedIds: formData.educationIds,
                onToggle: (id) => onToggle("educationIds", id),
            };

        case "courses":
            return {
                title: "Course Entries",
                items: state.education.flatMap((e) =>
                    (e.courses ?? []).map((c) => ({
                        id: c.id,
                        label: c.name,
                        subtitle: c.description ?? undefined,
                        footer: c.grade ? `Grade: ${c.grade}` : undefined,
                        icon: BookMarked
                    })),
                ),
                selectedIds: formData.courseIds,
                onToggle: (id) => onToggle("courseIds", id),
            };

        case "experience":
            return {
                title: "Experience Entries",
                items: state.experiences.sort((a, b) => {
                    const aTime = a.date_end ? new Date(a.date_end).getTime() : Date.now();
                    const bTime = b.date_end ? new Date(b.date_end).getTime() : Date.now();
                    return bTime - aTime;
                }).map((e) => ({
                    id: e.id,
                    label: e.company,
                    subtitle: e.job_title,
                    footer: e.date_start
                        ? `${formatDate(e.date_start, true)} - ${e.date_end ? formatDate(e.date_end, true) : "Present"
                        }`
                        : undefined,
                    icon: Briefcase
                })),
                selectedIds: formData.experienceIds,
                onToggle: (id) => onToggle("experienceIds", id),
            };

        case "projects":
            return {
                title: "Project Entries",
                items: state.projects.sort((b, a) => (new Date(a.date_end).getTime() ?? Date.now()) - (new Date(b.date_end).getTime() ?? Date.now())).map((p) => ({
                    id: p.id,
                    label: p.name,
                    footer: p.date_start
                        ? `${formatDate(p.date_start, true)} - ${p.date_end ? formatDate(p.date_end, true) : "Present"
                        }`
                        : undefined,
                    imageUrl: p.thumbnail_url ?? undefined,
                    icon: Rocket,
                })),
                selectedIds: formData.projectIds,
                onToggle: (id) => onToggle("projectIds", id),
            };

        case "skills":
            return {
                title: "Skill Entries",
                items: state.skills.sort((b, a) => (a.proficiency ?? 0) + (a.years_of_experience ?? 0) - (b.proficiency ?? 0) - (b.years_of_experience ?? 0)).map((s) => ({
                    id: s.id,
                    label: s.name,
                    subtitle: s.proficiency ? `${s.proficiency}/10 proficiency` : undefined,
                    footer: s.years_of_experience ? `${s.years_of_experience} years of experience` : undefined,
                    icon: Brain
                })),
                selectedIds: formData.skillIds,
                onToggle: (id) => onToggle("skillIds", id),
            };

        default:
            return null;
    }
}