"use client";

import { Bot, Check, Download, MoveLeft, WandSparkles } from "lucide-react";
import { useState, useEffect } from "react";

import { AsyncButtonWrapper } from "@/app/components/AsyncButtonWrapper/AsyncButtonWrapper";
import LoadingSpinner from "@/app/components/AsyncButtonWrapper/LoadingSpinner/LoadingSpinner";
import { ButtonFour, ButtonOne } from "@/app/components/Buttons/Buttons";
import ModernFileUploadBox from "@/app/components/FileUploadBox/ModernFileUploadBox/ModernFileUploadBox";
import PageContentHeader, {
  IButton,
} from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import SelectDropdown from "@/app/components/SelectDropdown/SelectDropdown";
import TextInput from "@/app/components/TextInput/TextInput";
import { hasTier, useTier } from "@/app/context/TierProvider";
import { useToast } from "@/app/context/ToastProvider";
import { useUser } from "@/app/context/UserProvider";
import { ICachedHeadshot } from "@/app/interfaces/ICachedHeadshot";
import { headerFont } from "@/app/localFonts";
import { showAiRateLimitToast } from "@/app/user/aiAgents/showAiRateLimitToast";
import { AI_CREDIT_COSTS } from "@/utils/aiCredits/config";
import { compressImage } from "@/utils/file-upload/compress";
import { uploadFile } from "@/utils/file-upload/upload";

import styles from "./HeadshotPage.module.css";

type HeadshotLayout = "1024x1024" | "1536x1024" | "1024x1536" | "auto";

type HeadshotAttire =
  | "auto"
  | "business"
  | "businessCasual"
  | "smartCasual"
  | "casual"
  | "techProfessional"
  | "academic";

const NEW_HEADSHOT_ID = "new";

export default function HeadshotPage() {
  const { dispatch } = useUser();
  const toast = useToast();
  const { tier, loading: tierLoading } = useTier();
  const isPremium = hasTier(tier, "developer");

  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [backgroundDescription, setBackgroundDescription] = useState("");
  const [layout, setLayout] = useState<HeadshotLayout>("1024x1024");
  const [attire, setAttire] = useState<HeadshotAttire>("auto");
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [cachedHeadshots, setCachedHeadshots] = useState<ICachedHeadshot[]>([]);
  const [cachedHeadshotsLoading, setCachedHeadshotsLoading] = useState(false);
  const [selectedCachedHeadshotId, setSelectedCachedHeadshotId] =
    useState(NEW_HEADSHOT_ID);
  const [cachedReferenceUrl, setCachedReferenceUrl] = useState<string | null>(
    null
  );
  const [cachedBackgroundUrl, setCachedBackgroundUrl] = useState<string | null>(
    null
  );
  const [uploadResetKey, setUploadResetKey] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [useThisHeadshotLoading, setUseThisHeadshotLoading] =
    useState<boolean>(false);

  const hasBackgroundImage = !!backgroundImage || !!cachedBackgroundUrl;

  const hasBackgroundDescription = backgroundDescription.trim().length > 0;

  // load cached headshots
  useEffect(() => {
    if (!isPremium || tierLoading) return;

    let cancelled = false;

    async function loadCachedHeadshots() {
      try {
        setCachedHeadshotsLoading(true);

        const res = await fetch("/api/internal/user/aiAgents/headshot");
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
  }, [isPremium, tierLoading]);

  async function handleGenerate() {
    if (!referenceImage) return;

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("referenceImage", referenceImage);

      if (backgroundImage) {
        formData.append("backgroundImage", backgroundImage);
      }

      formData.append("backgroundDescription", backgroundDescription);

      formData.append("layout", layout);
      formData.append("attire", attire);

      const res = await fetch("/api/internal/user/aiAgents/headshot", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (showAiRateLimitToast(res, data, toast)) return;
        throw new Error(data?.error ?? "Generation failed");
      }

      // update app state
      setGeneratedUrl(data.url);

      if (!data.id) {
        toast.info(
          "Temporary result",
          "Free results are available in this browser session. Download or save this image as your portrait to keep it.",
        );
      }

      if (data.id) {
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
            layout,
          },
          ...prev,
        ]);

        setSelectedCachedHeadshotId(data.id);
      }
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Failed to generate headshot.";
      toast.error("Generation failed", message);
    } finally {
      setLoading(false);
    }
  }

  function handleBackStep() {
    window.history.back();
  }

  async function handleDownload() {
    if (!generatedUrl) return;

    const response = await fetch(generatedUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    const extension = generatedUrl.split(".").pop()?.split("?")[0] ?? "png";
    link.download = `nukleio-headshot-${Date.now()}-${crypto.randomUUID()}.${extension}`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async function handleUseThisHeadshot() {
    if (!generatedUrl) return;

    try {
      setUseThisHeadshotLoading(true);
      const response = await fetch(generatedUrl);
      const blob = await response.blob();
      const extension = generatedUrl.split(".").pop()?.split("?")[0] ?? "png";
      const imageFile = new File(
        [blob],
        `nukleio-headshot-${Date.now()}-${crypto.randomUUID()}.${extension}`,
        { type: blob.type }
      );
      const compressed = await compressImage(imageFile);
      const publicPortraitUrl = await uploadFile(compressed, "portraits");
      dispatch({
        type: "UPDATE_DOCUMENT",
        payload: { url: publicPortraitUrl, docType: "portrait_url" },
      });
      toast.success("Success", "Portrait successfully updated.");
    } catch {
      toast.error("Failed to update user portrait.");
    } finally {
      setUseThisHeadshotLoading(false);
    }
  }

  const GenerateButton = (
    <ButtonOne disabled={loading || !referenceImage} onClick={handleGenerate}>
      <div className={styles.generateButtonContent}>
        <WandSparkles size={20} />
        <span>Generate</span>
      </div>
    </ButtonOne>
  );

  const backButton: IButton = {
    name: "Back to Agents",
    icon: MoveLeft,
    onClick: handleBackStep,
  };

  return (
    <PageContentWrapper>
      <PageContentHeader
        title="Headshot Agent"
        buttonFour={backButton}
        className={styles.headshotPageContentContainer}
        icon={Bot}
      />

      <div className={styles.pageContentContainer}>
        {isPremium && (
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
                ariaLabel="Cached headshots"
                onChange={(id) => {
                  setSelectedCachedHeadshotId(id);

                  if (id === NEW_HEADSHOT_ID) {
                    setGeneratedUrl(null);
                    setBackgroundDescription("");
                    setLayout("1024x1024");
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
                    setBackgroundDescription(
                      selected.background_description ?? ""
                    );
                    setLayout(
                      (selected.layout as HeadshotLayout) ?? "1024x1024"
                    );
                    setAttire((selected.attire as HeadshotAttire) ?? "auto");
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
        )}

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
                    { value: "1024x1536", label: "Portrait" },
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
                  : "Describe the background of your headshot..."
              }
            />

            <AsyncButtonWrapper
              button={GenerateButton}
              onClick={handleGenerate}
              isDisabled={loading || (!referenceImage && !cachedReferenceUrl)}
            />
            <p className={styles.subtitle}>
              Generation uses {AI_CREDIT_COSTS.headshot.generate} AI credits.
            </p>
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
                  <button
                    className={styles.imageContainer}
                    onClick={() => setImageModalOpen(true)}
                    type="button"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={generatedUrl}
                      alt="Generated headshot"
                      className={styles.generatedImage}
                    />
                  </button>

                  <div className={styles.resultButtonsContainer}>
                    <ButtonOne
                      className={styles.resultButton}
                      onClick={handleDownload}
                    >
                      <Download size={20} />
                      Download
                    </ButtonOne>
                    <AsyncButtonWrapper
                      button={
                        <ButtonFour className={styles.resultButton}>
                          <Check size={20} />
                          Use This Headshot
                        </ButtonFour>
                      }
                      onClick={handleUseThisHeadshot}
                      isDisabled={useThisHeadshotLoading}
                    />
                  </div>

                  {imageModalOpen && (
                    <div
                      className={styles.imageModal}
                      onClick={() => setImageModalOpen(false)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={generatedUrl}
                        alt="Full generated headshot"
                        className={styles.modalImage}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContentWrapper>
  );
}
