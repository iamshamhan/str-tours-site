import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { entityConfig, isEntity, type Section } from "@/lib/editor/schema";
import { editorOptions } from "@/lib/editor/data";
import { RecordForm } from "@/components/admin/record-form";
export default async function RecordPage({
  params,
}: {
  params: Promise<{ section: string; id: string }>;
}) {
  const { supabase } = await requireAdmin(),
    { section, id } = await params;
  if (!isEntity(section)) notFound();
  const config = entityConfig[section],
    options =
      section === "reviews" || section === "faqs" || section === "pages"
        ? await editorOptions()
        : { tours: [], places: [] };
  if (id === "new")
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Create · {config.label}</h1>
        <RecordForm
          section={section}
          initial={{
            ...config.defaults,
            id: crypto.randomUUID(),
            slug: "",
            published: false,
            updated_at: null,
          }}
          tours={options.tours}
          places={options.places}
        />
      </div>
    );
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await supabase.from(config.table).select("*").eq("id", id).single();
  if (error) return <p role="alert">Unable to load this record.</p>;
  let sections: Section[] = [];
  if (section === "pages") {
    const r = await supabase
      .from("page_sections")
      .select("id,type,published,content")
      .eq("page_id", id)
      .order("sort_order")
      .order("id");
    if (r.error) return <p role="alert">Unable to load sections.</p>;
    sections = r.data as Section[];
  }
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Edit · {config.label}</h1>
      <RecordForm
        key={data.updated_at}
        section={section}
        initial={{ ...config.defaults, ...data }}
        initialSections={sections}
        tours={options.tours}
        places={options.places}
      />
    </div>
  );
}
