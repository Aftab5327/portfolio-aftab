import type { MetadataRoute } from "next";
import { getBuildLogPosts } from "@/lib/build-log";
import { AI_DOCS_PATH, AUTOMATION_DOCS_PATH, LOG_PATH, RESUME_PAGE_PATH, STATS_PATH, siteUrl } from "@/lib/config";
import { getProjects } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" = "monthly") => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority
  });

  return [
    page("", 1),
    page(RESUME_PAGE_PATH, 0.8),
    page(STATS_PATH, 0.6, "daily"),
    page(LOG_PATH, 0.6, "weekly"),
    page(AI_DOCS_PATH, 0.5),
    page(AUTOMATION_DOCS_PATH, 0.5),
    ...getProjects().map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
      lastModified: project.pushedAt ? new Date(project.pushedAt) : lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7
    })),
    ...getBuildLogPosts().map((post) => ({
      url: `${siteUrl}/log/${post.slug}`,
      lastModified: new Date(`${post.date}T09:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.4
    }))
  ];
}
