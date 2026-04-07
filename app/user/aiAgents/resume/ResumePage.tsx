"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";
import LoadingMessageSpinner from "@/app/components/LoadingMessageSpinner/LoadingMessageSpinner";
import PageContentHeader, {
    IButton,
} from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import SelectDropdown from "@/app/components/SelectDropdown/SelectDropdown";
import { hasTier, useTier } from "@/app/context/TierProvider";
import { useToast } from "@/app/context/ToastProvider";
import { ICachedResume } from "@/app/interfaces/ICachedResume";

import styles from "./ResumePage.module.css";

type GenerationType = "generate" | "generateAi";

type ResumeStep =
    | "start"
    | "template"
    | "jobs"
    | "education"
    | "experience"
    | "projects"
    | "skills"
    | "review";

type SelectableItem = {
    id: string;
    label: string;
    subtitle?: string;
};

type ResumeFormData = {
    generationType: GenerationType | "";
    templateId: string;
    targetJobs: string[];
    educationIds: string[];
    experienceIds: string[];
    projectIds: string[];
    skillIds: string[];
};

const TEMPLATE_OPTIONS = [
    {
        id: "default",
        name: "Default",
        imageUrl: "/images/resumeTemplates/default.jpg",
    },
    {
        id: "awesomecv",
        name: "AwesomeCV",
        imageUrl: "/images/resumeTemplates/awesomecv.jpg",
    },
    // {
    //     id: "template-3",
    //     name: "Minimal",
    //     imageUrl: "/images/resumeTemplates/template3.png",
    // },
];

const TARGET_JOB_OPTIONS: SelectableItem[] = [
    { id: "frontend", label: "Frontend Developer" },
    { id: "backend", label: "Backend Developer" },
    { id: "fullstack", label: "Full Stack Developer" },
    { id: "software", label: "Software Engineer" },
    { id: "cloud", label: "Cloud Engineer" },
    { id: "data", label: "Data Engineer" },
];

const EDUCATION_OPTIONS: SelectableItem[] = [
    { id: "edu-1", label: "Boston University - BS Computer Science" },
    { id: "edu-2", label: "Boston University - MS Computer Science" },
];

const EXPERIENCE_OPTIONS: SelectableItem[] = [
    { id: "exp-1", label: "Dot Foods - Software Developer Intern" },
    { id: "exp-2", label: "Dot Foods - RPA Developer" },
    { id: "exp-3", label: "BU - Course Assistant" },
];

const PROJECT_OPTIONS: SelectableItem[] = [
    { id: "proj-1", label: "Nukleio" },
    { id: "proj-2", label: "Portfolio Website" },
];

const SKILL_OPTIONS: SelectableItem[] = [
    { id: "skill-1", label: "C#" },
    { id: "skill-2", label: ".NET" },
    { id: "skill-3", label: "TypeScript" },
    { id: "skill-4", label: "React" },
    { id: "skill-5", label: "Next.js" },
    { id: "skill-6", label: "SQL" },
];

export default function ResumePage() {
    const router = useRouter();
    const toast = useToast();

    const { tier, loading: tierLoading } = useTier();
    const canAccess = hasTier(tier, "premium");

    const [step, setStep] = useState<ResumeStep>("start");
    const [loading, setLoading] = useState(false);

    const [resumeUrl, setResumeUrl] = useState("");
    const [cachedResumes, setCachedResumes] = useState<ICachedResume[]>([]);
    const [cachedResumesLoading, setCachedResumesLoading] = useState(false);
    const [selectedCachedResumeId, setSelectedCachedResumeId] = useState("");

    const [formData, setFormData] = useState<ResumeFormData>({
        generationType: "",
        templateId: "",
        targetJobs: [],
        educationIds: [],
        experienceIds: [],
        projectIds: [],
        skillIds: [],
    });

    useEffect(() => {
        if (!canAccess || tierLoading) return;

        let cancelled = false;

        (async () => {
            setCachedResumesLoading(true);
            try {
                const res = await fetch("/api/internal/user/aiAgents/resume");
                const data = await res.json();

                if (!res.ok) throw new Error(data?.error ?? "Failed to load resumes");

                if (!cancelled) {
                    setCachedResumes(Array.isArray(data?.items) ? data.items : []);
                }
            } catch {
                if (!cancelled) {
                    toast.error("Error", "Failed to load cached resumes.");
                }
            } finally {
                if (!cancelled) setCachedResumesLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [canAccess, tierLoading, toast]);

    const orderedSteps = useMemo(() => {
        if (formData.generationType === "generateAi") {
            return ["start", "template", "jobs", "review"] as ResumeStep[];
        }

        return [
            "start",
            "template",
            "jobs",
            "education",
            "experience",
            "projects",
            "skills",
            "review",
        ] as ResumeStep[];
    }, [formData.generationType]);

    const currentStepIndex = orderedSteps.indexOf(step);
    const isFirstStep = currentStepIndex <= 0;
    const isLastStep = currentStepIndex === orderedSteps.length - 1;

    function updateFormData<K extends keyof ResumeFormData>(
        key: K,
        value: ResumeFormData[K],
    ) {
        setFormData((prev) => ({ ...prev, [key]: value }));
    }

    function toggleSelection(key: keyof ResumeFormData, id: string) {
        setFormData((prev) => {
            const current = prev[key];
            if (!Array.isArray(current)) return prev;

            const exists = current.includes(id);
            return {
                ...prev,
                [key]: exists
                    ? current.filter((item) => item !== id)
                    : [...current, id],
            };
        });
    }

    function canGoNext() {
        switch (step) {
            case "start":
                return !!formData.generationType;
            case "template":
                return !!formData.templateId;
            case "jobs":
                return formData.targetJobs.length > 0;
            case "education":
                return formData.educationIds.length > 0;
            case "experience":
                return formData.experienceIds.length > 0;
            case "projects":
                return formData.projectIds.length > 0;
            case "skills":
                return formData.skillIds.length > 0;
            case "review":
                return true;
            default:
                return false;
        }
    }

    function handleNext() {
        if (!canGoNext()) {
            toast.info("Please complete this step first.");
            return;
        }

        if (!isLastStep) {
            setStep(orderedSteps[currentStepIndex + 1]);
        }
    }

    function handleBackStep() {
        if (!isFirstStep) {
            setStep(orderedSteps[currentStepIndex - 1]);
            return;
        }

        router.push("/user/aiAgents");
    }

    async function handleGenerate() {
        setLoading(true);

        try {
            const payload =
                formData.generationType === "generateAi"
                    ? {
                        generationType: "generateAi" as const,
                        templateId: formData.templateId,
                        targetJobs: formData.targetJobs,
                    }
                    : {
                        generationType: "generate" as const,
                        templateId: formData.templateId,
                        targetJobs: formData.targetJobs,
                        educationIds: formData.educationIds,
                        experienceIds: formData.experienceIds,
                        projectIds: formData.projectIds,
                        skillIds: formData.skillIds,
                    };

            const res = await fetch("/api/internal/user/aiAgents/resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data?.error ?? "Resume generation failed");

            setResumeUrl(data.url);
            toast.success("Success", "Resume generated successfully.");
        } catch {
            toast.error("Error", "Failed to generate resume.");
        } finally {
            setLoading(false);
        }
    }

    function resetFlow() {
        setResumeUrl("");
        setSelectedCachedResumeId("");
        setStep("start");
        setFormData({
            generationType: "",
            templateId: "",
            targetJobs: [],
            educationIds: [],
            experienceIds: [],
            projectIds: [],
            skillIds: [],
        });
    }

    const primaryButton: IButton | undefined = resumeUrl
        ? undefined
        : isLastStep
            ? {
                name: "Generate",
                onClick: handleGenerate,
                isAsync: true,
                disabled: loading,
                isLoading: loading,
            }
            : {
                name: "Next",
                onClick: handleNext,
                disabled: !canGoNext() || loading,
            };

    const backButton: IButton = {
        name: "Back",
        onClick: resumeUrl ? resetFlow : handleBackStep,
    };

    return (
        <PageContentWrapper>
            <PageContentHeader
                title="Resume Generator"
                buttonOne={canAccess ? primaryButton : undefined}
                buttonFour={backButton}
            />

            <div className={styles.resumePageContainer}>
                {loading && (
                    <LoadingMessageSpinner
                        messages={[
                            "Fetching user data...",
                            "Selecting resume content...",
                            "Generating resume...",
                            "Creating PDF...",
                        ]}
                        interval={1200}
                    />
                )}

                {tierLoading && <LoadingSpinner />}

                {!tierLoading && !canAccess && (
                    <p className={styles.subtitle}>
                        Please upgrade to premium to use this feature.
                    </p>
                )}

                {!loading && !tierLoading && canAccess && !resumeUrl && (
                    <>
                        {step === "start" && (
                            <div className={styles.stepContainer}>
                                <p className={styles.subtitle}>
                                    Start from a cached resume or create a new one.
                                </p>

                                <div className={styles.dropdownContainer}>
                                    <SelectDropdown
                                        value={selectedCachedResumeId}
                                        options={cachedResumes.map((item) => ({
                                            value: item.id,
                                            label: new Date(item.created_at).toLocaleString(),
                                        }))}
                                        loading={cachedResumesLoading}
                                        disabled={cachedResumes.length === 0}
                                        placeholder={
                                            cachedResumesLoading
                                                ? "Loading cached resumes..."
                                                : cachedResumes.length === 0
                                                    ? "No cached resumes"
                                                    : "Select a cached resume..."
                                        }
                                        ariaLabel="Cached resumes"
                                        onChange={(id) => {
                                            setSelectedCachedResumeId(id);
                                            const selected = cachedResumes.find((item) => item.id === id);
                                            if (selected?.url) setResumeUrl(selected.url);
                                        }}
                                    />
                                </div>

                                <div className={styles.modeCards}>
                                    <button
                                        type="button"
                                        className={`${styles.modeCard} ${formData.generationType === "generate" ? styles.selectedCard : ""
                                            }`}
                                        onClick={() => updateFormData("generationType", "generate")}
                                    >
                                        <h3>Manual</h3>
                                        <p>Select exactly what to include.</p>
                                    </button>

                                    <button
                                        type="button"
                                        className={`${styles.modeCard} ${formData.generationType === "generateAi" ? styles.selectedCard : ""
                                            }`}
                                        onClick={() => updateFormData("generationType", "generateAi")}
                                    >
                                        <h3>AI</h3>
                                        <p>Let the model choose the strongest content.</p>
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === "template" && (
                            <div className={styles.stepContainer}>
                                <p className={styles.subtitle}>Choose a resume template.</p>

                                <div className={styles.templateGrid}>
                                    {TEMPLATE_OPTIONS.map((template) => (
                                        <button
                                            key={template.id}
                                            type="button"
                                            className={`${styles.templateCard} ${formData.templateId === template.id ? styles.selectedCard : ""
                                                }`}
                                            onClick={() => updateFormData("templateId", template.id)}
                                        >
                                            <div className={styles.templateImagePlaceholder}>
                                                <img
                                                    src={template.imageUrl}
                                                    alt={template.name}
                                                    className={styles.templateImage}
                                                />
                                            </div>
                                            <p>{template.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === "jobs" && (
                            <SelectionStep
                                title="Select target jobs"
                                items={TARGET_JOB_OPTIONS}
                                selectedIds={formData.targetJobs}
                                onToggle={(id) => toggleSelection("targetJobs", id)}
                            />
                        )}

                        {step === "education" && (
                            <SelectionStep
                                title="Select education entries"
                                items={EDUCATION_OPTIONS}
                                selectedIds={formData.educationIds}
                                onToggle={(id) => toggleSelection("educationIds", id)}
                            />
                        )}

                        {step === "experience" && (
                            <SelectionStep
                                title="Select experience entries"
                                items={EXPERIENCE_OPTIONS}
                                selectedIds={formData.experienceIds}
                                onToggle={(id) => toggleSelection("experienceIds", id)}
                            />
                        )}

                        {step === "projects" && (
                            <SelectionStep
                                title="Select projects"
                                items={PROJECT_OPTIONS}
                                selectedIds={formData.projectIds}
                                onToggle={(id) => toggleSelection("projectIds", id)}
                            />
                        )}

                        {step === "skills" && (
                            <SelectionStep
                                title="Select skills"
                                items={SKILL_OPTIONS}
                                selectedIds={formData.skillIds}
                                onToggle={(id) => toggleSelection("skillIds", id)}
                            />
                        )}

                        {step === "review" && (
                            <div className={styles.stepContainer}>
                                <p className={styles.subtitle}>Review your selections.</p>

                                <div className={styles.reviewCard}>
                                    <p><strong>Mode:</strong> {formData.generationType}</p>
                                    <p><strong>Template:</strong> {formData.templateId || "None"}</p>
                                    <p><strong>Target jobs:</strong> {formData.targetJobs.join(", ") || "None"}</p>

                                    {formData.generationType === "generate" && (
                                        <>
                                            <p><strong>Education:</strong> {formData.educationIds.join(", ") || "None"}</p>
                                            <p><strong>Experience:</strong> {formData.experienceIds.join(", ") || "None"}</p>
                                            <p><strong>Projects:</strong> {formData.projectIds.join(", ") || "None"}</p>
                                            <p><strong>Skills:</strong> {formData.skillIds.join(", ") || "None"}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {!loading && !!resumeUrl && (
                    <div className={styles.previewContainer}>
                        <iframe
                            src={resumeUrl}
                            title="Resume Preview"
                            className={styles.pdfIframe}
                        />
                    </div>
                )}
            </div>
        </PageContentWrapper>
    );
}

function SelectionStep({
    title,
    items,
    selectedIds,
    onToggle,
}: {
    title: string;
    items: SelectableItem[];
    selectedIds: string[];
    onToggle: (id: string) => void;
}) {
    return (
        <div className={styles.stepContainer}>
            <p className={styles.subtitle}>{title}</p>

            <div className={styles.selectionList}>
                {items.map((item) => {
                    const selected = selectedIds.includes(item.id);

                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={`${styles.selectionCard} ${selected ? styles.selectedCard : ""
                                }`}
                            onClick={() => onToggle(item.id)}
                        >
                            <div>
                                <p>{item.label}</p>
                                {item.subtitle && <span>{item.subtitle}</span>}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}