import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { InquiryForm } from "@/components/admin/inquiry-form";
export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin(),
    { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await supabase
    .from("inquiries")
    .select("*,tours(title)")
    .eq("id", id)
    .single();
  if (error) return <p role="alert">Unable to load inquiry.</p>;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Inquiry · {data.name}</h1>
      <dl className="grid gap-4 sm:grid-cols-2">
        {[
          "email",
          "phone",
          "country",
          "travel_date",
          "travel_end_date",
          "travelers",
          "interests",
          "budget",
          "consent",
          "consent_at",
          "created_at",
        ].map((key) => (
          <div key={key}>
            <dt className="text-sm capitalize text-slate-500">{key.replaceAll("_", " ")}</dt>
            <dd>{String(data[key] ?? "—")}</dd>
          </div>
        ))}
        <div>
          <dt>Tour</dt>
          <dd>{data.tours?.title ?? "—"}</dd>
        </div>
      </dl>
      <div className="rounded-xl border bg-white p-5 whitespace-pre-wrap">{data.message}</div>
      <InquiryForm
        key={data.updated_at}
        initial={{ id, updated_at: data.updated_at, status: data.status, notes: data.notes }}
      />
    </div>
  );
}
