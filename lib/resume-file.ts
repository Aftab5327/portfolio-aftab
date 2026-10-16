/**
 * Which PDF the site's "View my CV" / "Download resume" links point at. With
 * profile.resume.source = "uploaded" that's the designed PDF in public/; otherwise the
 * resume generated from the profile (/resume.pdf). Both /resume.pdf and the /resume web
 * page keep working either way. Kept import-light so scripts can use it too.
 */
import { RESUME_PATH } from "./config";

export type ResumeFile = {
  /** Site path to link to. */
  href: string;
  /** Name for the download attribute. */
  fileName: string;
  source: "uploaded" | "generated";
};

type ResumeSettings = { source: "uploaded" | "generated"; uploadedPath?: string };

export function primaryResume(settings: ResumeSettings, firstName: string): ResumeFile {
  if (settings.source === "uploaded" && settings.uploadedPath) {
    return { href: settings.uploadedPath, fileName: settings.uploadedPath.slice(settings.uploadedPath.lastIndexOf("/") + 1), source: "uploaded" };
  }
  return { href: RESUME_PATH, fileName: `${firstName}-Resume.pdf`, source: "generated" };
}
