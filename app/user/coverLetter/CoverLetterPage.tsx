"use client";

import { useState, useEffect } from "react";

import LoadingMessageSpinner from "@/app/components/LoadingMessageSpinner/LoadingMessageSpinner";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import TextInput from "@/app/components/TextInput/TextInput";
import { useToast } from "@/app/context/ToastProvider";
import { cacheDraft, cleanupDraftCache, loadCachedDraft } from "@/utils/coverLetter/coverLetterCache";

import styles from "./CoverLetterPage.module.css";
import PageContentHeader, { IButton } from "../../components/PageContentHeader/PageContentHeader";
import { hasTier, useTier } from "@/app/context/TierProvider";
import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";

export default function CoverLetterPage() {
    const [userId, setUserId] = useState<string>("");
    const [jobTitle, setJobTitle] = useState<string>("");
    const [companyName, setCompanyName] = useState<string>("");
    const [jobDescriptionDump, setJobDescriptionDump] = useState<string>("");
    const [writingSample, setWritingSample] = useState<string>("");
    const [conversationId, setConversationId] = useState<string>("");
    const [draft, setDraft] = useState<string>("");
    const [feedback, setFeedback] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [mode, setMode] = useState<"initial" | "revision">("initial");
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>("");

    const toast = useToast();

    const { tier, loading: tierLoading } = useTier();
    const canAccess = hasTier(tier, "premium");

    // Cleanup blob URLs (avoid memory leaks)
    useEffect(() => {
        return () => {
            if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
        };
    }, [pdfPreviewUrl]);

    useEffect(() => {
        const fetcher = async () => {
            try {
                const res = await fetch("/api/internal/auth/authenticated");
                if (!res.ok) throw new Error();
                const data = await res.json();
                setUserId(data.user.id);
            } catch {
                toast.error("Error", "Failed to fetch user ID. Please refresh the page and try again.");
            }
        };

        cleanupDraftCache();
        fetcher();
    }, [toast]);

    // Helper: generate a PDF from current draft (or a provided finalLetter), update preview, optionally download
    const generatePdfAndPreview = async ({
        convoId,
        nextFeedback,
        finalLetter,
        shouldDownload,
    }: {
        convoId: string;
        nextFeedback: string;
        finalLetter?: string;
        shouldDownload: boolean;
    }) => {
        const payload: Record<string, any> = {
            conversationId: convoId,
            feedback: nextFeedback,
        };

        if (typeof finalLetter === "string") payload.finalLetter = finalLetter;

        const res = await fetch("/api/internal/user/coverLetter", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
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

        if (shouldDownload) {
            const a = document.createElement("a");
            a.href = pdfUrl;
            a.download = "cover_letter.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
        }
    };

    const handleGenerate = async () => {
        if (!userId || !jobTitle || !companyName || !jobDescriptionDump) return;

        // allow paint before work starts
        setTimeout(async () => {
            if (draft.length > 0) {
                setMode("revision");
                setLoading(true);

                // REVISION MODE: generates PDF, updates preview, downloads
                try {
                    const shouldSendFinalLetter = feedback.trim() === "";
                    await generatePdfAndPreview({
                        convoId: conversationId,
                        nextFeedback: feedback,
                        finalLetter: shouldSendFinalLetter ? draft : undefined,
                        shouldDownload: true,
                    });

                    toast.success("Success", "Successfully generated cover letter PDF with your revision.");
                } catch {
                    toast.error("Error", "Failed to revise cover letter. Please refresh the page and try again.");
                } finally {
                    setLoading(false);
                }
            } else {
                setMode("initial");
                setLoading(true);

                const cached = loadCachedDraft(jobTitle, companyName);

                if (cached) {
                    setTimeout(async () => {
                        setDraft(cached.draft);
                        setConversationId(cached.conversationId);
                        setFeedback("");

                        // load the pdf preview
                        try {
                            await generatePdfAndPreview({
                                convoId: cached.conversationId,
                                nextFeedback: "",
                                finalLetter: cached.draft,
                                shouldDownload: false,
                            });
                        } catch (error) {
                            console.error(error);
                        }

                        setLoading(false);
                    }, 300);

                    return;
                }

                // FIRST GENERATION MODE
                try {
                    const payload = {
                        userId,
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
                    setFeedback("");
                    cacheDraft(jobTitle, companyName, data.currentDraft, data.conversationId);

                    try {
                        await generatePdfAndPreview({
                            convoId: data.conversationId,
                            nextFeedback: "",
                            finalLetter: data.currentDraft,
                            shouldDownload: false,
                        });
                    } catch {
                        // non-fatal: user can still click "Complete Revision" to generate PDF/preview
                    }

                    toast.success(
                        "Success",
                        "Successfully generated first draft of your cover letter. You may now add your revisions or save the PDF."
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
        name: draft.length > 0 ? "Complete Revision" : "Generate",
        onClick: handleGenerate,
        isAsync: true,
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
                                : [
                                    "Analyzing your feedback...",
                                    "Revising draft...",
                                    "Evaluating improvements...",
                                    "Generating PDF...",
                                    "Finalizing output...",
                                ]
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
                        <p className={styles.subtitle}>Generate a cover letter tailored to your personal data.</p>

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

                        <TextInput
                            label="Your Feedback"
                            name="feedback"
                            type="textarea"
                            textAreaRows={6}
                            value={feedback}
                            isInInputForm={true}
                            placeholder="Enter your feedback"
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                    </div>
                )}
            </div>
        </PageContentWrapper>
    );
}