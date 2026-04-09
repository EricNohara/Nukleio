"use client";

import { BookMarked, Brain, Briefcase, GraduationCap, Rocket } from "lucide-react";

import { IUserInfoInternal } from "@/app/interfaces/IUserInfoInternal";
import formatDate from "@/utils/general/formatDate";

import SelectionStep from "./SelectionStep";

type ResumeStep =
    | "jobs"
    | "education"
    | "courses"
    | "experience"
    | "projects"
    | "skills";

type SelectableItem = {
    id: string;
    label: string;
    subtitle?: string;
};

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

type TargetJobOption = {
    id: string;
    label: string;
    subtitle?: string;
};

type ResumeSelectionStepProps = {
    step: ResumeStep;
    formData: ResumeFormData;
    targetJobOptions: TargetJobOption[];
    state: IUserInfoInternal;
    onToggle: (key: MultiSelectKey, id: string) => void;
};

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
    targetJobOptions: TargetJobOption[];
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
                    subtitle: e.degree,
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
                        icon: BookMarked
                    })),
                ),
                selectedIds: formData.courseIds,
                onToggle: (id) => onToggle("courseIds", id),
            };

        case "experience":
            return {
                title: "Experience Entries",
                items: state.experiences.map((e) => ({
                    id: e.id,
                    label: e.company,
                    subtitle: e.job_title,
                    icon: Briefcase
                })),
                selectedIds: formData.experienceIds,
                onToggle: (id) => onToggle("experienceIds", id),
            };

        case "projects":
            return {
                title: "Project Entries",
                items: state.projects.map((p) => ({
                    id: p.id,
                    label: p.name,
                    subtitle: p.date_start && p.date_end ? `${formatDate(p.date_start)} - ${formatDate(p.date_end)}` : "",
                    imageUrl: p.thumbnail_url,
                    icon: Rocket
                })),
                selectedIds: formData.projectIds,
                onToggle: (id) => onToggle("projectIds", id),
            };

        case "skills":
            return {
                title: "Skill Entries",
                items: state.skills.map((s) => ({
                    id: s.id,
                    label: s.name,
                    icon: Brain
                })),
                selectedIds: formData.skillIds,
                onToggle: (id) => onToggle("skillIds", id),
            };

        default:
            return null;
    }
}