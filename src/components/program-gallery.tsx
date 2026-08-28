import { CmsImage } from "@/components/cms-image";
import type { PublicMedia } from "@/lib/db/queries/public";

type GalleryItem = PublicMedia & { caption: string | null };

export function ProgramGallery({ images }: { images: GalleryItem[] }) {
  if (images.length === 0) return null;

  return (
    <ul className="mt-(--space-block) list-none m-0 p-0 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image, i) => (
        <li key={`${image.path}-${i}`}>
          <div className="relative aspect-square w-full overflow-hidden rounded-(--radius) bg-surface">
            <CmsImage
              media={image}
              alt={image.altText ?? image.caption ?? ""}
              sizes="(min-width: 1024px) 25rem, (min-width: 640px) 50vw, 100vw"
            />
          </div>
          {image.caption && (
            <p className="m-0 mt-2 text-step--1 text-quiet">{image.caption}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
