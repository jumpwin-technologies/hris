/** Page metadata for `BaseHead` and layouts. */
export interface SeoProps {
  /** Page title. Defaults to `SITE_TITLE`. */
  title?: string;
  /** Page and social description. Defaults to `SITE_DESCRIPTION`. */
  description?: string;
  /** Social image. Omit when the page has no public image. */
  image?: string;
  /** Open Graph type. */
  type?: "website" | "article";
  /** Override `NOINDEX_ROUTES` for this page's robots tag. */
  noindex?: boolean;
}
