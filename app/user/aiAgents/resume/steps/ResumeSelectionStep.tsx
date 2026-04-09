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
    onToggleAll: (key: MultiSelectKey, ids: string[]) => void;
};

export default function ResumeSelectionStep({
    step,
    formData,
    targetJobOptions,
    state,
    onToggle,
    onToggleAll,
}: ResumeSelectionStepProps) {
    const config = getSelectionStepConfig({
        step,
        formData,
        targetJobOptions,
        state,
        onToggle,
        onToggleAll,
    });

    if (!config) return null;

    return (
        <SelectionStep
            title={config.title}
            items={config.items}
            selectedIds={config.selectedIds}
            onToggle={config.onToggle}
            allSelected={
                config.items.length > 0 &&
                config.items.every((item) => config.selectedIds.includes(item.id))
            }
            onToggleAll={config.onToggleAll}
        />
    );
}

function getSelectionStepConfig({
    step,
    formData,
    targetJobOptions,
    state,
    onToggle,
    onToggleAll,
}: {
    step: ResumeStep;
    formData: ResumeFormData;
    targetJobOptions: SelectableItem[];
    state: ResumeSelectionStepProps["state"];
    onToggle: (key: MultiSelectKey, id: string) => void;
    onToggleAll: (key: MultiSelectKey, ids: string[]) => void;
}): {
    title: string;
    items: SelectableItem[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onToggleAll: () => void;
} | null {
    switch (step) {
        case "jobs": {
            const items = targetJobOptions;
            return {
                title: "Target Jobs",
                items,
                selectedIds: formData.targetJobs,
                onToggle: (id) => onToggle("targetJobs", id),
                onToggleAll: () => onToggleAll("targetJobs", items.map((item) => item.id)),
            };
        }

        case "education": {
            const items: SelectableItem[] = [...state.education]
                .sort((a, b) => (b.year_end ?? Date.now()) - (a.year_end ?? Date.now()))
                .map((e) => ({
                    id: e.id,
                    label: e.institution,
                    subtitle: [
                        e.degree,
                        ...(e.majors ?? []),
                        ...(e.minors ?? []),
                    ]
                        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
                        .join(" | "),
                    footer:
                        e.year_start && e.year_end
                            ? `${e.year_start} - ${e.year_end}`
                            : e.year_start
                                ? `${e.year_start} - Present`
                                : undefined,
                    icon: GraduationCap,
                }));

            return {
                title: "Education Entries",
                items,
                selectedIds: formData.educationIds,
                onToggle: (id) => onToggle("educationIds", id),
                onToggleAll: () => onToggleAll("educationIds", items.map((item) => item.id)),
            };
        }

        case "courses": {
            const items: SelectableItem[] = state.education.flatMap((e) =>
                (e.courses ?? []).map((c) => ({
                    id: c.id,
                    label: c.name,
                    subtitle: c.description ?? undefined,
                    footer: c.grade ? `Grade: ${c.grade}` : undefined,
                    icon: BookMarked,
                })),
            );

            return {
                title: "Course Entries",
                items,
                selectedIds: formData.courseIds,
                onToggle: (id) => onToggle("courseIds", id),
                onToggleAll: () => onToggleAll("courseIds", items.map((item) => item.id)),
            };
        }

        case "experience": {
            const items: SelectableItem[] = [...state.experiences]
                .sort((a, b) => {
                    const aTime = a.date_end ? new Date(a.date_end).getTime() : Date.now();
                    const bTime = b.date_end ? new Date(b.date_end).getTime() : Date.now();
                    return bTime - aTime;
                })
                .map((e) => ({
                    id: e.id,
                    label: e.company,
                    subtitle: e.job_title,
                    footer: e.date_start
                        ? `${formatDate(e.date_start, true)} - ${e.date_end ? formatDate(e.date_end, true) : "Present"
                        }`
                        : undefined,
                    icon: Briefcase,
                }));

            return {
                title: "Experience Entries",
                items,
                selectedIds: formData.experienceIds,
                onToggle: (id) => onToggle("experienceIds", id),
                onToggleAll: () => onToggleAll("experienceIds", items.map((item) => item.id)),
            };
        }

        case "projects": {
            const items: SelectableItem[] = [...state.projects]
                .sort((a, b) => {
                    const aTime = a.date_end ? new Date(a.date_end).getTime() : Date.now();
                    const bTime = b.date_end ? new Date(b.date_end).getTime() : Date.now();
                    return bTime - aTime;
                })
                .map((p) => ({
                    id: p.id,
                    label: p.name,
                    footer: p.date_start
                        ? `${formatDate(p.date_start, true)} - ${p.date_end ? formatDate(p.date_end, true) : "Present"
                        }`
                        : undefined,
                    imageUrl: p.thumbnail_url ?? undefined,
                    icon: Rocket,
                }));

            return {
                title: "Project Entries",
                items,
                selectedIds: formData.projectIds,
                onToggle: (id) => onToggle("projectIds", id),
                onToggleAll: () => onToggleAll("projectIds", items.map((item) => item.id)),
            };
        }

        case "skills": {
            const items: SelectableItem[] = [...state.skills]
                .sort(
                    (a, b) =>
                        (b.proficiency ?? 0) +
                        (b.years_of_experience ?? 0) -
                        (a.proficiency ?? 0) -
                        (a.years_of_experience ?? 0),
                )
                .map((s) => ({
                    id: s.id,
                    label: s.name,
                    subtitle: s.proficiency ? `${s.proficiency}/10 proficiency` : undefined,
                    footer: s.years_of_experience
                        ? `${s.years_of_experience} years of experience`
                        : undefined,
                    icon: Brain,
                }));

            return {
                title: "Skill Entries",
                items,
                selectedIds: formData.skillIds,
                onToggle: (id) => onToggle("skillIds", id),
                onToggleAll: () => onToggleAll("skillIds", items.map((item) => item.id)),
            };
        }

        default:
            return null;
    }
}