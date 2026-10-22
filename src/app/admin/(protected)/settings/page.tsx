import { requireAdmin } from "@/lib/admin/auth";
import { settingsForEditor } from "@/lib/settings/schema";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("site_settings")
    .select("slug,value,published")
    .in("slug", ["site-config", "business", "contact", "theme", "seo-defaults"]);
  const settings = error ? null : settingsForEditor(data ?? []);
  return (
    <section className="max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight">Site settings</h1>
      <p className="mt-3 text-slate-600">
        Review placeholder content before publishing. These fields are public information; never
        enter secrets.
      </p>
      {settings ? (
        <SettingsForm initial={settings} />
      ) : (
        <p role="alert" className="mt-8">
          Settings could not be loaded safely. Refresh to retry; existing data has not been changed.
        </p>
      )}
    </section>
  );
}
