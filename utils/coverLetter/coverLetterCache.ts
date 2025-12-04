const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function getJobCacheKey(
  jobUrl: string,
  jobTitle: string,
  companyName: string
) {
  return `coverletter:${jobUrl}|${jobTitle}|${companyName}`;
}

/** Save draft + conversationId with timestamp */
export function cacheDraft(
  jobUrl: string,
  jobTitle: string,
  companyName: string,
  draft: string,
  conversationId: string
) {
  const key = getJobCacheKey(jobUrl, jobTitle, companyName);

  const data = {
    draft,
    conversationId,
    timestamp: Date.now(),
  };

  localStorage.setItem(key, JSON.stringify(data));

  // Optionally clean up old entries after saving
  cleanupDraftCache();
}

/** Load draft if it exists AND is not expired */
export function loadCachedDraft(
  jobUrl: string,
  jobTitle: string,
  companyName: string
): { draft: string; conversationId: string } | null {
  const key = getJobCacheKey(jobUrl, jobTitle, companyName);
  const raw = localStorage.getItem(key);

  if (!raw) return null;

  try {
    const data = JSON.parse(raw);

    // If expired delete + return null
    if (Date.now() - data.timestamp > ONE_WEEK_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return {
      draft: data.draft,
      conversationId: data.conversationId,
    };
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

/** Remove all expired cover letter cache entries */
export function cleanupDraftCache() {
  const now = Date.now();

  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith("coverletter:")) continue;

    try {
      const data = JSON.parse(localStorage.getItem(key) || "{}");

      if (!data.timestamp || now - data.timestamp > ONE_WEEK_MS) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
}
