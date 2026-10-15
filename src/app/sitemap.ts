import type { MetadataRoute } from "next"
import { env } from "@/lib/env"

export default function sitemap(): MetadataRoute.Sitemap {
  return env.siteUrl && env.indexable ? [{ url: `${env.siteUrl}/`, changeFrequency: "monthly", priority: 1 }] : []
}
