import styles from "../ResumePage.module.css";
import { SelectableItem } from "./SelectionStep";

type ResumeFormData = {
    generationType: "generate" | "generateAi";
    templateId: string;
    targetJobs: string[];
    educationIds: string[];
    courseIds: string[];
    experienceIds: string[];
    projectIds: string[];
    skillIds: string[];
};

type ResumeStep =
    | "template"
    | "jobs"
    | "education"
    | "courses"
    | "experience"
    | "projects"
    | "skills";

type Props = {
    formData: ResumeFormData;
    templateName: string;

    targetJobOptions: SelectableItem[];
    educationItems: SelectableItem[];
    courseItems: SelectableItem[];
    experienceItems: SelectableItem[];
    projectItems: SelectableItem[];
    skillItems: SelectableItem[];

    onRemove: (
        key:
            | "targetJobs"
            | "educationIds"
            | "courseIds"
            | "experienceIds"
            | "projectIds"
            | "skillIds",
        id: string,
    ) => void;

    onGoToStep: (step: ResumeStep) => void;
};

function getSelectedItems(ids: string[], items: SelectableItem[]) {
    return ids
        .map((id) => items.find((item) => item.id === id))
        .filter(Boolean) as SelectableItem[];
}

function ReviewSection({
    title,
    items,
    onRemove,
    onClickTitle,
}: {
    title: string;
    items: SelectableItem[];
    onRemove: (id: string) => void;
    onClickTitle: () => void;
}) {
    return (
        <div className={styles.reviewSection}>
            <button
                type="button"
                className={styles.reviewSectionTitleButton}
                onClick={onClickTitle}
            >
                {title}
            </button>

            {items.length === 0 ? (
                <p className={styles.chipSubtitle}>None selected</p>
            ) : (
                <div className={styles.chipContainer}>
                    {items.map((item) => (
                        <div key={item.id} className={styles.chip}>
                            <button
                                type="button"
                                className={styles.removeChipButton}
                                onClick={() => onRemove(item.id)}
                            >
                                ×
                            </button>

                            <span>{item.label}</span>

                            {item.subtitle && (
                                <span className={styles.chipSubtitle}>
                                    {!isNaN(Number(item.subtitle))
                                        ? `${item.subtitle}/10 proficiency`
                                        : item.subtitle}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ReviewStep({
    formData,
    templateName,
    targetJobOptions,
    educationItems,
    courseItems,
    experienceItems,
    projectItems,
    skillItems,
    onRemove,
    onGoToStep,
}: Props) {
    return (
        <div className={styles.stepContainer}>
            <div className={styles.reviewHeader}>
                <h2>Review Your Resume</h2>

                <p className={styles.reviewSubtitle}>
                    Confirm your selections before generating your resume.
                </p>
            </div>

            <div className={styles.reviewSection}>
                <p className={styles.reviewSectionTitle}>Resume Generation Type</p>
                <div className={styles.reviewTopCards}>
                    <div className={styles.summaryCard}>
                        <p className={styles.summaryLabel}>Mode</p>

                        <p className={styles.summaryValue}>
                            {formData.generationType === "generateAi"
                                ? "AI Generated"
                                : "Manual"}
                        </p>
                    </div>

                    <div className={styles.summaryCard}>
                        <p className={styles.summaryLabel}>Template</p>

                        <p className={styles.summaryValue}>
                            {templateName}
                        </p>
                    </div>
                </div>
            </div>

            {/* fix */}
            {formData.generationType === "generateAi" && (
                <ReviewSection
                    title="Target Roles"
                    items={getSelectedItems(
                        formData.targetJobs,
                        targetJobOptions,
                    )}
                    onRemove={(id) => onRemove("targetJobs", id)}
                    onClickTitle={() => onGoToStep("jobs")}
                />
            )}

            {formData.generationType === "generate" && (
                <>
                    <ReviewSection
                        title="Education"
                        items={getSelectedItems(
                            formData.educationIds,
                            educationItems,
                        )}
                        onRemove={(id) => onRemove("educationIds", id)}
                        onClickTitle={() => onGoToStep("education")}
                    />

                    <ReviewSection
                        title="Courses"
                        items={getSelectedItems(
                            formData.courseIds,
                            courseItems,
                        )}
                        onRemove={(id) => onRemove("courseIds", id)}
                        onClickTitle={() => onGoToStep("courses")}
                    />

                    <ReviewSection
                        title="Experience"
                        items={getSelectedItems(
                            formData.experienceIds,
                            experienceItems,
                        )}
                        onRemove={(id) => onRemove("experienceIds", id)}
                        onClickTitle={() => onGoToStep("experience")}
                    />

                    <ReviewSection
                        title="Projects"
                        items={getSelectedItems(
                            formData.projectIds,
                            projectItems,
                        )}
                        onRemove={(id) => onRemove("projectIds", id)}
                        onClickTitle={() => onGoToStep("projects")}
                    />

                    <ReviewSection
                        title="Skills"
                        items={getSelectedItems(
                            formData.skillIds,
                            skillItems,
                        )}
                        onRemove={(id) => onRemove("skillIds", id)}
                        onClickTitle={() => onGoToStep("skills")}
                    />
                </>
            )}
        </div>
    );
}