import Image from "next/image";

type ProjectImageProps = {
  src: string;
  title: string;
  category?: string;
  /** next/image `sizes` for the rendered width. */
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * 16:9 project image. Without a `src` it renders a generated placeholder card
 * (title on the themed grid background) so every project has a visual.
 */
export default function ProjectImage({ src, title, category, sizes, priority = false, className = "" }: ProjectImageProps) {
  if (!src) {
    return (
      <div
        aria-hidden
        className={`relative flex aspect-video items-center justify-center overflow-hidden bg-panel2 ${className}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-[size:22px_22px] opacity-60" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal/10 blur-2xl" />
        <div className="relative px-6 text-center">
          <span className="font-mono text-xs text-teal">{"</>"}</span>
          <p className="mt-2 line-clamp-2 font-display text-lg font-bold leading-snug text-txt sm:text-xl">{title}</p>
          {category ? <p className="mt-1.5 font-mono text-[11px] text-txtdim">{category}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video overflow-hidden bg-panel2 ${className}`}>
      <Image
        src={src}
        alt={`${title} screenshot`}
        fill
        sizes={sizes}
        priority={priority}
        // Remote images (https URLs from PORTFOLIO.md) skip the optimizer, which would need remotePatterns.
        unoptimized={/^https?:\/\//i.test(src)}
        className="object-cover object-top"
      />
    </div>
  );
}
