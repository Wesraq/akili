import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="surface-clinical text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <p className="eyebrow opacity-75">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold md:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base opacity-85 md:text-lg">{description}</p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
