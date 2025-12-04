"use client";

import { useState, useEffect } from "react";

import LoadingMessageSpinner from "@/app/components/LoadingMessageSpinner/LoadingMessageSpinner";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import TextInput from "@/app/components/TextInput/TextInput";

import styles from "../CoverLetterPage.module.css";
import PageContentHeader, { IButton } from "../../../components/PageContentHeader/PageContentHeader";
import { useSearchParams, useRouter } from "next/navigation";

export default function CoverLetterDescriptionModePage() {
    const params = useSearchParams();
    const jobTitle = params.get("jobTitle") ?? "";
    const companyName = params.get("companyName") ?? "";
    const router = useRouter();

    const [userId, setUserId] = useState<string>("");
    const [jobDescriptionDump, setJobDescriptionDump] = useState<string>("");
    const [writingSample, setWritingSample] = useState<string>("");
    const [conversationId, setConversationId] = useState<string>("");
    const [draft, setDraft] = useState<string>("");
    const [feedback, setFeedback] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [mode, setMode] = useState<"initial" | "revision">("initial");

    useEffect(() => {
        const fetcher = async () => {
            try {
                const res = await fetch("/api/internal/auth/authenticated");
                if (!res.ok) throw new Error();
                const data = await res.json();
                setUserId(data.user.id);
            } catch (error) {
                console.error(error);
            }
        }
        fetcher();
    }, []);

    const handleGenerate = async () => {
        if (!userId || !jobDescriptionDump) return;

        setTimeout(async () => {
            if (draft.length > 0) {
                setMode("revision")
                setLoading(true);

                // REVISION MODE
                try {
                    const payload = {
                        conversationId,
                        feedback,
                        ...(feedback.trim() === "" ? { finalLetter: draft } : {})
                    };

                    const res = await fetch(`${process.env.NEXT_PUBLIC_COVER_LETTER_AGENT_BASE_URL}/revise`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    if (!res.ok) throw new Error("PDF generation failed");

                    const arrayBuffer = await res.arrayBuffer();
                    const blob = new Blob([arrayBuffer], { type: "application/pdf" });
                    const pdfUrl = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = pdfUrl;
                    a.download = "cover_letter.pdf"; // Auto-download filename
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            } else {
                setMode("initial")
                setLoading(true);

                // FIRST GENERATION MODE
                try {
                    const payload = {
                        userId,
                        jobDescriptionDump,
                        writingSample
                    };

                    const res = await fetch(`${process.env.NEXT_PUBLIC_COVER_LETTER_AGENT_BASE_URL}/generateFromDescription`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);

                    setDraft(data.currentDraft);
                    setConversationId(data.conversationId);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            }
        }, 0);
    };

    const buttonOne: IButton = {
        name: draft.length > 0 ? "Complete Revision" : "Generate",
        onClick: handleGenerate,
        isAsync: true
    };

    const backButton: IButton = {
        name: "Back",
        onClick: () => {
            router.push("/user/coverLetter")
        }
    }

    return (
        <PageContentWrapper>
            <PageContentHeader title={`${companyName} Cover Letter Generation`} buttonOne={buttonOne} buttonFour={backButton} />

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
                                    "Formatting output..."
                                ]
                                : [
                                    "Analyzing your feedback...",
                                    "Revising draft...",
                                    "Evaluating improvements...",
                                    "Generating PDF...",
                                    "Finalizing output..."
                                ]
                        }
                        interval={mode === "initial" ? 3000 : 1000}
                    />
                )}

                {/* ------------------- INITIAL FORM ------------------- */}
                {!loading && !draft && !conversationId && (
                    <>
                        <p>{`No data found for the inputted job ${jobTitle} at company ${companyName}. Please input a dump of the job posting description to continue.`}</p>

                        <div className={styles.inputsContainer}>
                            <TextInput
                                label="Job Description Dump"
                                name="jobDescriptionDump"
                                type="textarea"
                                textAreaRows={8}
                                value={jobDescriptionDump}
                                isInInputForm={true}
                                placeholder="Enter a dump of the job posting description"
                                onChange={(e) => setJobDescriptionDump(e.target.value)}
                                required
                            />
                            <TextInput
                                label="Optional Writing Sample"
                                name="writingSample"
                                type="textarea"
                                textAreaRows={8}
                                value={writingSample}
                                isInInputForm={true}
                                placeholder="Enter an optional writing sample for the agent to match its writing style to"
                                onChange={(e) => setWritingSample(e.target.value)}
                            />
                        </div>
                    </>
                )}

                {/* ------------------- REVISION UI ------------------- */}
                {!loading && draft && conversationId && (
                    <div className={styles.inputsContainer}>
                        <TextInput
                            label="Generated Cover Letter"
                            name="draft"
                            type="textarea"
                            textAreaRows={18}
                            value={draft}
                            onChange={() => { }}
                            isInInputForm={true}
                            placeholder="Generated cover letter draft"
                            disabled
                        />
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