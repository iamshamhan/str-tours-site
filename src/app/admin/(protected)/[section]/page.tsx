import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { adminSections } from "@/lib/admin/navigation";

export default async function Placeholder({ params }: { params: Promise<{ section: string }> }) {
  await requireAdmin();
  const { section } = await params;
  const item = adminSections.find((item) => item.slug === section);
  if (!item) notFound();
  return <><h1 className="text-3xl font-semibold tracking-tight">{item.label}</h1>
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-8">
      <h2 className="font-semibold">Coming in a later phase</h2>
      <p className="mt-2 text-sm text-neutral-500">This section is reserved for the {item.label.toLowerCase()} editor.</p>
    </section></>;
}
