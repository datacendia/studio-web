import type { MetadataRoute } from "next"
import { env } from "@/lib/env"

/** Closed to crawlers until the name is final (SITE_INDEXABLE); the admin is never crawled. */
export default function robots(): MetadataRoute.Robots {
  if (!env.indexable) return { rules: { userAgent: "*", disallow: "/" } }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    ...(env.siteUrl ? { sitemap: `${env.siteUrl}/sitemap.xml` } : {}),
  }
}
