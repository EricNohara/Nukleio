"use client";

import { useState, useEffect } from "react";

import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";
import MatchBreakdownChart from "@/app/components/Chart/MatchBreakdownChart";
import LoadingMessageSpinner from "@/app/components/LoadingMessageSpinner/LoadingMessageSpinner";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
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
    const [conversationId, setConversationId] = useState<string>("");
    const [draft, setDraft] = useState<string>("");
    const [skillsMatchScore, setSkillsMatchScore] = useState<ISkillsMatchScore | null>(null);
    const [feedback, setFeedback] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [mode, setMode] = useState<"initial" | "revision" | "cache">("initial");
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>("");

    // cached cover letter state
    const [cachedList, setCachedList] = useState<ICachedConversationListItem[]>([]);
    const [cachedListLoading, setCachedListLoading] = useState(false);
    const [selectedConversationId, setSelectedConversationId] = useState<string>("");

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
    const loadCachedConversation = async (convoId: string) => {
        if (!convoId) return;

        setLoading(true);
        setMode("cache");

        try {
            const res = await fetch(
                `/api/internal/user/coverLetter?conversationId=${encodeURIComponent(convoId)}`
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? "Failed to load cached drafts");

            const rows = (Array.isArray(data?.items) ? data.items : []) as ICachedCoverLetter[];
            if (!rows.length) throw new Error("No drafts found for this conversation");

            // rows are ordered created_at asc per your GET
            const latest = rows[rows.length - 1];

            setConversationId(latest.conversation_id);
            setDraft(latest.draft);
            setSkillsMatchScore({
                education: Number(latest.education_score),
                experience: Number(latest.experience_score),
                skills: Number(latest.skills_score),
                projects: Number(latest.projects_score),
                location: Number(latest.location_score),
                overall: Number(latest.overall_score),
            });
            setFeedback("");
            setSelectedConversationId(latest.conversation_id);

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

                // REVISION MODE: generates PDF, updates preview, downloads
                try {
                    // perform the revision
                    const payload = {
                        conversationId,
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
                if (!jobTitle || !companyName || !jobDescriptionDump) return;

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
                    loadCachedConversation(cachedCoverLetter.conversation_id);
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
                    setConversationId(data.conversationId);
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
            setConversationId("");
            setSelectedConversationId("");
            setPdfPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return "";
            });
        },
    };

    return (
        <PageContentWrapper>
            <PageContentHeader
                title="Cover Letter Generation"
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
                {!loading && !tierLoading && !draft && !conversationId && canAccess && (
                    <>
                        <div className={styles.formHeader}>
                            <p className={styles.subtitle}>Generate a cover letter tailored to your personal data.</p>
                            {/* put the cache selection dropdown here */}
                            <select
                                className={styles.cacheDropdown}
                                value={selectedConversationId}
                                onChange={async (e) => {
                                    const id = e.target.value;
                                    setSelectedConversationId(id);
                                    if (id) await loadCachedConversation(id);
                                }}
                                disabled={cachedListLoading || cachedList.length === 0}
                            >
                                <option value="">
                                    {cachedListLoading
                                        ? "Loading cached cover letters..."
                                        : cachedList.length === 0
                                            ? "No cached cover letters"
                                            : "Select a cached cover letter..."}
                                </option>

                                {cachedList.map((item) => {
                                    const label = `${item.job_title ?? "Untitled"} @ ${item.company_name ?? "Unknown"}`;

                                    return (
                                        <option key={item.conversation_id} value={item.conversation_id}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
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
                {!loading && draft && conversationId && (
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

                        {/* Skills match score bar */}
                        <div className={styles.reviseRightContainer}>
                            <div className={styles.jobMatchContainer}>
                                <p className={styles.jobMatchLabel}>Job Match Breakdown</p>
                                <MatchBreakdownChart
                                    breakdown={skillsMatchScore}
                                    height={400}
                                />
                            </div>

                            <TextInput
                                label="Your Feedback"
                                name="feedback"
                                type="textarea"
                                textAreaRows={8}
                                value={feedback}
                                isInInputForm={true}
                                placeholder="Enter your feedback"
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </PageContentWrapper>
    );
}