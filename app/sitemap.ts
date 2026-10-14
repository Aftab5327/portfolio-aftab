import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { getProjects } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1
    },
    ...getProjects().map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
      lastModified: project.pushedAt ? new Date(project.pushedAt) : lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
