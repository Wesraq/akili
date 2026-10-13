import labChemistry from "@/assets/lab-chemistry.jpg";
import labHaematology from "@/assets/lab-haematology.jpg";
import labHistopathology from "@/assets/lab-histopathology.jpg";
import labMolecular from "@/assets/lab-molecular.jpg";
import { labGallery } from "@/lib/site-data";

const images: Record<(typeof labGallery)[number]["id"], string> = {
  chemistry: labChemistry,
  haematology: labHaematology,
  molecular: labMolecular,
  histopathology: labHistopathology,
};

export function LabGallery({
  limit,
  countrySlug,
}: {
  limit?: number;
  countrySlug?: string;
}) {
  const filtered = countrySlug
    ? labGallery.filter((lab) => lab.countrySlug === countrySlug)
    : labGallery;
  const items = limit ? filtered.slice(0, limit) : filtered;

  if (items.length === 0) {
    return (
      <p className="rounded-sm border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Lab gallery images for this market are coming soon. Contact the local office for a site
        visit or demo.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((lab) => (
        <figure
          key={lab.id}
          className="overflow-hidden rounded-sm border border-border bg-card shadow-card"
        >
          <img
            src={images[lab.id]}
            alt={`${lab.title} laboratory equipped with systems supplied by AKILI LABS`}
            width={1600}
            height={900}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover"
          />
          <figcaption className="p-5">
            <p className="text-xs font-medium text-primary">{lab.country}</p>
            <h3 className="mt-1 font-display text-base font-semibold">{lab.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{lab.caption}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
