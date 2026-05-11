"use client";

import { WandSparkles } from "lucide-react";
import { useState, useEffect } from "react";

import { AsyncButtonWrapper } from "@/app/components/AsyncButtonWrapper/AsyncButtonWrapper";
import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";
import { ButtonOne } from "@/app/components/Buttons/Buttons";
import ModernFileUploadBox from "@/app/components/FileUploadBox/ModernFileUploadBox/ModernFileUploadBox";
import PageContentHeader, {
    IButton,
} from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import SelectDropdown from "@/app/components/SelectDropdown/SelectDropdown";
import TextInput from "@/app/components/TextInput/TextInput";
import { ICachedProfessionalHeadshot } from "@/app/interfaces/ICachedProfessionalHeadshot";
import { headerFont } from "@/app/localFonts";

import styles from "./ProfessionalHeadshotPage.module.css";

type HeadshotLayout =
    | "1024x1024"
    | "1536x1024"
    | "1024x1536"
    | "auto";

type HeadshotAttire =
    | "auto"
    | "business"
    | "businessCasual"
    | "smartCasual"
    | "casual"
    | "techProfessional"
    | "academic";

const NEW_HEADSHOT_ID = "new";

export default function ProfessionalHeadshotPage() {
    const [referenceImage, setReferenceImage] = useState<File | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
    const [backgroundDescription, setBackgroundDescription] = useState("");
    const [layout, setLayout] = useState<HeadshotLayout>("auto");
    const [attire, setAttire] = useState<HeadshotAttire>("auto");
    const [loading, setLoading] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [cachedHeadshots, setCachedHeadshots] = useState<ICachedProfessionalHeadshot[]>([]);
    const [cachedHeadshotsLoading, setCachedHeadshotsLoading] = useState(false);
    const [selectedCachedHeadshotId, setSelectedCachedHeadshotId] = useState(NEW_HEADSHOT_ID);
    const [cachedReferenceUrl, setCachedReferenceUrl] = useState<string | null>(null);
    const [cachedBackgroundUrl, setCachedBackgroundUrl] = useState<string | null>(null);
    const [uploadResetKey, setUploadResetKey] = useState(0);

    const hasBackgroundImage =
        !!backgroundImage || !!cachedBackgroundUrl;

    const hasBackgroundDescription =
        backgroundDescription.trim().length > 0;

    // load cached headshots
    useEffect(() => {
        let cancelled = false;

        async function loadCachedHeadshots() {
            try {
                setCachedHeadshotsLoading(true);

                const res = await fetch("/api/internal/user/aiAgents/professionalHeadshot");
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data?.error ?? "Failed to load cached headshots");
                }

                if (!cancelled) {
                    setCachedHeadshots(Array.isArray(data.items) ? data.items : []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) {
                    setCachedHeadshotsLoading(false);
                }
            }
        }

        loadCachedHeadshots();

        return () => {
            cancelled = true;
        };
    }, []);

    async function handleGenerate() {
        if (!referenceImage) return;

        try {
            setLoading(true);

            const formData = new FormData();

            formData.append("referenceImage", referenceImage);

            if (backgroundImage) {
                formData.append("backgroundImage", backgroundImage);
            }

            formData.append(
                "backgroundDescription",
                backgroundDescription,
            );

            formData.append("layout", layout);
            formData.append("attire", attire);

            const res = await fetch(
                "/api/internal/user/aiAgents/professionalHeadshot",
                {
                    method: "POST",
                    body: formData,
                },
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error ?? "Generation failed");
            }

            // update app state
            setGeneratedUrl(data.url);

            setCachedHeadshots((prev) => [
                {
                    id: data.id,
                    user_id: "",
                    generated_url: data.url,
                    reference_url: data.referenceUrl ?? null,
                    background_url: data.backgroundUrl ?? null,
                    background_description: backgroundDescription || null,
                    created_at: new Date().toISOString(),
                    validation: data.validation,
                    attire,
                    layout
                },
                ...prev,
            ]);

            setSelectedCachedHeadshotId(data.id);
        } catch (error) {
            console.error(error);
            alert("Failed to generate professional headshot.");
        } finally {
            setLoading(false);
        }
    }

    function handleBackStep() {
        window.history.back();
    }

    const GenerateButton = <ButtonOne disabled={loading || !referenceImage} onClick={handleGenerate}>
        <div className={styles.generateButtonContent}>
            <WandSparkles />
            <span>Generate</span>
        </div>
    </ButtonOne>;

    const backButton: IButton = {
        name: "Back to Agents",
        onClick: handleBackStep,
    };

    return (
        <PageContentWrapper>
            <PageContentHeader
                title="Professional Headshot Generator"
                buttonFour={backButton}
                className={styles.headshotPageContentContainer}
            />

            <div className={styles.pageContentContainer}>
                {/* cache selection header */}
                <div className={styles.formHeader}>
                    <p className={styles.subtitle}>
                        View a previous headshot or create a new one.
                    </p>

                    <div className={styles.dropdownContainer}>
                        <SelectDropdown
                            value={selectedCachedHeadshotId}
                            options={[
                                { value: NEW_HEADSHOT_ID, label: "Generate a new headshot" },
                                ...cachedHeadshots.map((item) => ({
                                    value: item.id,
                                    label: new Date(item.created_at).toLocaleString(),
                                })),
                            ]}
                            loading={cachedHeadshotsLoading}
                            disabled={cachedHeadshotsLoading}
                            placeholder="Generate a new headshot"
                            ariaLabel="Cached professional headshots"
                            onChange={(id) => {
                                setSelectedCachedHeadshotId(id);

                                if (id === NEW_HEADSHOT_ID) {
                                    setGeneratedUrl(null);
                                    setBackgroundDescription("");
                                    setLayout("auto");
                                    setAttire("auto");
                                    setCachedReferenceUrl(null);
                                    setCachedBackgroundUrl(null);
                                    setReferenceImage(null);
                                    setBackgroundImage(null);
                                    setUploadResetKey((prev) => prev + 1);
                                    return;
                                }

                                const selected = cachedHeadshots.find((item) => item.id === id);

                                if (selected?.generated_url) {
                                    setGeneratedUrl(selected.generated_url);
                                    setBackgroundDescription(selected.background_description ?? "");
                                    setLayout((selected.layout as HeadshotLayout) ?? "auto");
                                    setAttire((selected.attire as HeadshotAttire) ?? "auto")
                                    setCachedReferenceUrl(selected.reference_url ?? null);
                                    setCachedBackgroundUrl(selected.background_url ?? null);
                                    setReferenceImage(null);
                                    setBackgroundImage(null);
                                    setUploadResetKey((prev) => prev + 1);
                                }
                            }}
                        />
                    </div>
                </div>

                <div className={styles.pageContent}>
                    <div className={styles.inputsContainer}>
                        <div className={styles.selectInputContainer}>
                            <div className={styles.inputItemContainer}>
                                <p className={headerFont.className}>Layout</p>
                                <SelectDropdown
                                    value={layout}
                                    options={[
                                        { value: "auto", label: "Auto" },
                                        { value: "1024x1024", label: "Square" },
                                        { value: "1536x1024", label: "Landscape" },
                                        { value: "1024x1536", label: "Portrait" }
                                    ]}
                                    onChange={(layout) => setLayout(layout as HeadshotLayout)}
                                />
                            </div>
                            <div className={styles.inputItemContainer}>
                                <p className={headerFont.className}>Attire</p>
                                <SelectDropdown
                                    value={attire}
                                    options={[
                                        { value: "auto", label: "Auto" },
                                        { value: "business", label: "Business" },
                                        { value: "businessCasual", label: "Business Casual" },
                                        { value: "smartCasual", label: "Smart Casual" },
                                        { value: "casual", label: "Casual" },
                                        { value: "techProfessional", label: "Tech Professional" },
                                        { value: "academic", label: "Academic" },
                                    ]}
                                    onChange={(a) => setAttire(a as HeadshotAttire)}
                                />
                            </div>
                        </div>

                        <div className={styles.uploadGrid}>
                            <ModernFileUploadBox
                                label="Reference image"
                                accepts=".png,.jpg,.jpeg,.webp"
                                docType="reference"
                                onFileSelect={(file) => {
                                    setReferenceImage(file);
                                    setCachedReferenceUrl(null);
                                }}
                                previewUrl={cachedReferenceUrl}
                                previewName="Cached reference image"
                                onClearPreview={() => {
                                    setCachedReferenceUrl(null);
                                    setReferenceImage(null);
                                }}
                                uploadInstructions="PNG, JPG, WEBP up to 50MB"
                                required
                                resetKey={`reference-${uploadResetKey}`}
                            />

                            <ModernFileUploadBox
                                label="Background image (optional)"
                                accepts=".png,.jpg,.jpeg,.webp"
                                docType="background"
                                disabled={hasBackgroundDescription}
                                onFileSelect={(file) => {
                                    setBackgroundImage(file);
                                    setCachedBackgroundUrl(null);
                                }}
                                previewUrl={cachedBackgroundUrl}
                                previewName="Cached background image"
                                onClearPreview={() => {
                                    setCachedBackgroundUrl(null);
                                    setBackgroundImage(null);
                                }}
                                uploadInstructions={
                                    hasBackgroundDescription
                                        ? "Disabled: using background description"
                                        : "PNG, JPG, WEBP up to 50MB"
                                }
                                resetKey={`reference-${uploadResetKey}`}
                            />
                        </div>

                        <TextInput
                            label="Background description (optional)"
                            name="backgroundDescription"
                            value={backgroundDescription}
                            disabled={hasBackgroundImage}
                            onChange={(e) => setBackgroundDescription(e.target.value)}
                            isInInputForm
                            focusLabelColor="var(--btn-1)"
                            type="textarea"
                            textAreaRows={2}
                            placeholder={
                                hasBackgroundImage
                                    ? "Disabled: using background image"
                                    : "Describe the background of your professional headshot..."
                            }
                        />

                        <AsyncButtonWrapper
                            button={GenerateButton}
                            onClick={handleGenerate}
                            isDisabled={loading || (!referenceImage && !cachedReferenceUrl)}
                        />

                    </div>

                    <div className={styles.resultsContainer}>
                        <div className={styles.inputItemContainer}>
                            <p className={headerFont.className}>Result</p>

                            {loading && (
                                <div className={styles.loadingContainer}>
                                    <LoadingSpinner />
                                </div>
                            )}

                            {!generatedUrl && !loading && (
                                <div className={styles.noResultSection}>
                                    <h3>Your generated headshot will appear here</h3>
                                    <p>Input a prompt and click Generate to start.</p>
                                </div>
                            )}

                            {generatedUrl && !loading && (
                                <div className={styles.resultSection}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={generatedUrl}
                                        alt="Generated professional headshot"
                                        className={styles.generatedImage}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PageContentWrapper >
    );
}