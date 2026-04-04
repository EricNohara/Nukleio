"use client";

import { useState, useEffect } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";
import MatchBreakdownChart from "@/app/components/Chart/MatchBreakdownChart";
import LoadingMessageSpinner from "@/app/components/LoadingMessageSpinner/LoadingMessageSpinner";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import SelectDropdown from "@/app/components/SelectDropdown/SelectDropdown";
import TextInput from "@/app/components/TextInput/TextInput";
import { hasTier, useTier } from "@/app/context/TierProvider";
import { useToast } from "@/app/context/ToastProvider";
import { ICachedConversationListItem, ICachedCoverLetter, ISkillsMatchScore } from "@/app/interfaces/ICachedCoverLetter";

import styles from "./CoverLetterPage.module.css";
import PageContentHeader, { IButton } from "../../components/PageContentHeader/PageContentHeader";

export default function CoverLetterPage() {
    const [jobTitle, setJobTitle] = useState<string>("");
    const [companyName, setCompanyName] = useState<string>("");
    const [jobDescriptionDump, setJobDescriptionDump] = useState<string>("");
    const [writingSample, setWritingSample] = useState<string>("");
    const [sessionId, setSessionId] = useState<string>("");
    const [draft, setDraft] = useState<string>("");
    const [skillsMatchScore, setSkillsMatchScore] = useState<ISkillsMatchScore | null>(null);
    const [feedback, setFeedback] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [mode, setMode] = useState<"initial" | "revision" | "cache">("initial");
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>("");

    // cached cover letter state
    const [cachedList, setCachedList] = useState<ICachedConversationListItem[]>([]);
    const [cachedListLoading, setCachedListLoading] = useState(false);
    const [coverLetterVersions, setCoverLetterVersions] = useState<ICachedCoverLetter[]>([]);
    const [selectedDraftName, setSelectedDraftName] = useState<string>("");

    const toast = useToast();

    const { tier, loading: tierLoading } = useTier();
    const canAccess = hasTier(tier, "premium");

    // Cleanup blob URLs (avoid memory leaks)
    useEffect(() => {
        return () => {
            if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
        };
    }, [pdfPreviewUrl]);

    // fetch cached list on mount
    useEffect(() => {
        if (!canAccess || tierLoading) return;

        let cancelled = false;

        (async () => {
            setCachedListLoading(true);
            try {
                const res = await fetch("/api/internal/user/coverLetter?mode=list");
                const data = await res.json();

                if (!res.ok) throw new Error(data?.error ?? "Failed to load cached cover letters");

                if (!cancelled) {
                    setCachedList(Array.isArray(data?.items) ? data.items : []);
                }
            } catch {
                if (!cancelled) toast.error("Error", "Failed to load cached cover letters.");
            } finally {
                if (!cancelled) setCachedListLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [canAccess, tierLoading, toast]);

    // load a cached draft into revision ui
    const loadSession = async (sessionId: string) => {
        if (!sessionId) return;

        setLoading(true);
        setMode("cache");

        try {
            const res = await fetch(
                `/api/internal/user/coverLetter?sessionId=${encodeURIComponent(sessionId)}`
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? "Failed to load cached drafts");

            const rows = (Array.isArray(data?.items) ? data.items : []) as ICachedCoverLetter[];
            if (!rows.length) throw new Error("No drafts found for this session");
            setCoverLetterVersions(rows);

            // rows are ordered created_at asc per your GET
            const latest = rows[rows.length - 1];

            setSelectedDraftName(latest.draft_name);
            setSessionId(latest.session_id);
            setDraft(latest.draft);
            setSkillsMatchScore({
                education: Number(latest.education_score),
                experience: Number(latest.experience_score),
                skills: Number(latest.skills_score),
                projects: Number(latest.projects_score),
                location: Number(latest.location_score),
                overall: Number(latest.overall_score),
                explanations: {
                    education: latest.education_score_exp,
                    experience: latest.experience_score_exp,
                    skills: latest.skills_score_exp,
                    projects: latest.projects_score_exp,
                    location: latest.location_score_exp
                }
            });
            setFeedback("");

            // Load PDF preview from latest draft (no download)
            try {
                await generatePdfAndPreview(latest.draft);
            } catch {
                // non-fatal: can still show textarea
            }

            toast.success("Success", "Loaded cached cover letter drafts.");
            setMode("revision");
        } catch {
            toast.error("Error", "Failed to load cached cover letter.");
        } finally {
            setLoading(false);
        }
    };

    const loadCachedCoverLetterByName = async (draftName: string) => {
        if (!draftName) return;

        const version = coverLetterVersions.find((v) => v.draft_name === draftName);
        if (!version || !version.draft?.trim()) {
            toast.error("Error", "Failed to load requested cover letter version.");
            return;
        }

        setLoading(true);
        setMode("cache");

        try {
            setSessionId(version.session_id);
            setDraft(version.draft);
            setSelectedDraftName(version.draft_name);

            setSkillsMatchScore({
                education: Number(version.education_score),
                experience: Number(version.experience_score),
                skills: Number(version.skills_score),
                projects: Number(version.projects_score),
                location: Number(version.location_score),
                overall: Number(version.overall_score),
                explanations: {
                    education: version.education_score_exp,
                    experience: version.experience_score_exp,
                    skills: version.skills_score_exp,
                    projects: version.projects_score_exp,
                    location: version.location_score_exp,
                }
            });
            setFeedback("");

            try {
                await generatePdfAndPreview(version.draft);
            } catch {
                // non-fatal
            }

            toast.success("Success", `Loaded cover letter version: ${version.draft_name}.`);
            setMode("revision");
        } catch {
            toast.error("Error", "Failed to load requested cover letter version.");
        } finally {
            setLoading(false);
        }
    };

    // Helper: generate a PDF from current draft (or a provided finalLetter), update preview, optionally download
    const generatePdfAndPreview = async (draft: string) => {
        const res = await fetch("/api/internal/user/coverLetter/pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draft }),
        });

        if (!res.ok) throw new Error("PDF generation failed");

        const arrayBuffer = await res.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: "application/pdf" });
        const pdfUrl = URL.createObjectURL(blob);

        // Update preview (revoke previous)
        setPdfPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return pdfUrl;
        });
    };

    const handleGenerate = async () => {
        // allow paint before work starts
        setTimeout(async () => {
            if (draft.length > 0) {
                setMode("revision");
                setLoading(true);

                if (!feedback.trim()) {
                    toast.info("Please input feedback before revising.")
                    setLoading(false);
                    return;
                }

                // REVISION MODE: generates PDF, updates preview, downloads
                try {
                    // perform the revision
                    const payload = {
                        sessionId,
                        feedback
                    }
                    const res = await fetch("/api/internal/user/coverLetter",
                        { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
                    );
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.errpr ?? "Error revising the draft");
                    const revisedDraft: string = data.revisedDraft;

                    // generate the pdf from the new draft
                    await generatePdfAndPreview(revisedDraft);

                    toast.success("Success", "Successfully generated cover letter PDF with your revision.");
                } catch {
                    toast.error("Error", "Failed to revise cover letter. Please refresh the page and try again.");
                } finally {
                    setLoading(false);
                }
            } else {
                // GENERATION MODE
                if (!jobTitle || !companyName || !jobDescriptionDump) {
                    toast.info("Please fill out required fields.")
                    return;
                }

                setMode("initial");
                setLoading(true);

                // check if there are any cache hits
                const cachedCoverLetter = cachedList
                    .filter(
                        (item) =>
                            item.job_title === jobTitle &&
                            item.company_name === companyName
                    )[0];

                if (cachedCoverLetter) {
                    loadSession(cachedCoverLetter.session_id);
                    return;
                }

                // FIRST GENERATION MODE
                try {
                    const payload = {
                        jobTitle,
                        companyName,
                        jobDescriptionDump,
                        writingSample,
                    };

                    const res = await fetch("/api/internal/user/coverLetter", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);

                    setDraft(data.currentDraft);
                    setSessionId(data.sessionId);
                    setSkillsMatchScore(data.skillsMatchScore);
                    setFeedback("");

                    try {
                        // generate the pdf
                        await generatePdfAndPreview(data.currentDraft);
                    } catch {
                        toast.error("Error loading PDF preview.")
                    }

                    toast.success(
                        "Success",
                        "Generated a first draft of your cover letter."
                    );
                } catch {
                    toast.error("Error", "Failed to generate cover letter. Please refresh the page and try again.");
                } finally {
                    setLoading(false);
                }
            }
        }, 0);
    };

    const buttonOne: IButton = {
        name: draft.length > 0 ? "Revise Draft" : "Generate",
        onClick: handleGenerate,
        isAsync: true,
        disabled: loading,
        isLoading: loading
    };

    const backButton: IButton = {
        name: "Back",
        onClick: () => {
            setCompanyName("");
            setJobTitle("");
            setJobDescriptionDump("");
            setWritingSample("");
            setDraft("");
            setFeedback("");
            setSessionId("");
            setPdfPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return "";
            });
            setSelectedDraftName("");
        },
    };

    return (
        <PageContentWrapper>
            <PageContentHeader
                title={selectedDraftName ? selectedDraftName : "Cover Letter Generator"}
                buttonOne={canAccess ? buttonOne : undefined}
                buttonFour={draft.length > 0 ? backButton : null}
            />

            <div className={styles.coverLetterPageContainer}>
                {/* ------------------- LOADING UI ------------------- */}
                {loading && (
                    <LoadingMessageSpinner
                        messages={
                            mode === "initial"
                                ? [
                                    "Fetching user data...",
                                    "Fetching job information...",
                                    "Fetching company information...",
                                    "Analyzing writing sample...",
                                    "Generating first draft...",
                                    "Evaluating draft...",
                                    "Revising content...",
                                    "Executing feedback loop...",
                                    "Formatting output...",
                                ]
                                : mode === "revision" ? [
                                    "Analyzing your feedback...",
                                    "Revising draft...",
                                    "Evaluating improvements...",
                                    "Generating PDF...",
                                    "Finalizing output...",
                                ] : ["Loading from cache..."]
                        }
                        interval={mode === "initial" ? 3000 : 1000}
                    />
                )}

                {/* tier loading UI */}
                {tierLoading && <LoadingSpinner />}

                {/* upgrade UI */}
                {!canAccess && <p>Please upgrade to premium to use this feature.</p>}

                {/* ------------------- INITIAL FORM ------------------- */}
                {!loading && !tierLoading && !draft && !sessionId && canAccess && (
                    <>
                        <div className={styles.formHeader}>
                            <p className={styles.subtitle}>Generate a cover letter tailored to your personal data.</p>
                            <div className={styles.dropdownContainer}>
                                <SelectDropdown
                                    value={sessionId}
                                    options={[
                                        ...cachedList.map((item) => ({
                                            value: item.session_id,
                                            label: `${item.job_title ?? "Untitled"} @ ${item.company_name ?? "Unknown"}`
                                        })),
                                    ]}
                                    loading={cachedListLoading}
                                    disabled={cachedList.length === 0}
                                    placeholder={
                                        cachedListLoading
                                            ? "Loading cached cover letters..."
                                            : cachedList.length === 0
                                                ? "No cached cover letters"
                                                : "Select a cached cover letter..."
                                    }
                                    ariaLabel="Cached cover letters"
                                    onChange={async (id) => {
                                        setSessionId(id);
                                        if (id) await loadSession(id);
                                    }}
                                />
                            </div>
                        </div>

                        <div className={styles.inputsContainer}>
                            <TextInput
                                label="Job Title"
                                name="jobTitle"
                                value={jobTitle}
                                isInInputForm={true}
                                placeholder="Enter a job title..."
                                onChange={(e) => setJobTitle(e.target.value)}
                                required
                            />
                            <TextInput
                                label="Company Name"
                                name="companyName"
                                value={companyName}
                                isInInputForm={true}
                                placeholder="Enter a company name..."
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                            />
                            <div className={styles.textAreasContainer}>
                                <TextInput
                                    label="Job Description"
                                    name="jobDescriptionDump"
                                    type="textarea"
                                    textAreaRows={16}
                                    value={jobDescriptionDump}
                                    isInInputForm={true}
                                    placeholder="Copy and paste the job description for your job posting..."
                                    required
                                    onChange={(e) => setJobDescriptionDump(e.target.value)}
                                />
                                <TextInput
                                    label="Optional Writing Sample"
                                    name="writingSample"
                                    type="textarea"
                                    textAreaRows={16}
                                    value={writingSample}
                                    isInInputForm={true}
                                    placeholder="Enter an optional writing sample for the agent to match its writing style to..."
                                    onChange={(e) => setWritingSample(e.target.value)}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* ------------------- REVISION UI ------------------- */}
                {!loading && draft && sessionId && (
                    <div className={styles.reviseContainer}>
                        <div className={styles.pdfPreviewContainer}>
                            {pdfPreviewUrl ? (
                                <iframe
                                    src={pdfPreviewUrl}
                                    title="Cover Letter PDF Preview"
                                    className={styles.pdfIframe}
                                />
                            ) : draft ? (
                                <TextInput
                                    label="Cover Letter Draft"
                                    name="draft"
                                    type="textarea"
                                    textAreaRows={16}
                                    value={draft}
                                    isInInputForm={true}
                                    onChange={() => { }}
                                    disabled
                                />
                            ) : (
                                <p>Error displaying cover letter draft.</p>
                            )}
                        </div>

                        <div className={styles.reviseRightContainer}>
                            <div className={styles.jobMatchContainer}>
                                <p className={styles.jobMatchLabel}>Revision History</p>
                                <SelectDropdown
                                    value={selectedDraftName}
                                    options={[
                                        ...coverLetterVersions.map((v) => ({
                                            value: v.draft_name,
                                            label: v.draft_name
                                        })),
                                    ]}
                                    loading={loading}
                                    disabled={coverLetterVersions.length === 0}
                                    placeholder={
                                        loading
                                            ? "Loading revision versions..."
                                            : coverLetterVersions.length === 0
                                                ? "No revision versions"
                                                : "Select a revision version..."
                                    }
                                    ariaLabel="Cover letter revision versions"
                                    onChange={async (name) => {
                                        setSelectedDraftName(name);
                                        if (name) await loadCachedCoverLetterByName(name);
                                    }}
                                />
                            </div>

                            <div className={styles.jobMatchContainer}>
                                <p className={styles.jobMatchLabel}>Job Match Breakdown</p>
                                <MatchBreakdownChart
                                    breakdown={skillsMatchScore}
                                />
                            </div>

                            <TextInput
                                label="Your Feedback"
                                name="feedback"
                                type="textarea"
                                textAreaRows={9}
                                value={feedback}
                                isInInputForm={true}
                                placeholder="Enter your feedback"
                                required
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </PageContentWrapper>
    );
}