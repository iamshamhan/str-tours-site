import { loadLinkEditor } from "@/lib/navigation/admin";
import { LinkEditor } from "@/components/admin/link-editor";
export default async function NavigationPage() {
  const initial = await loadLinkEditor("navigation");
  return <section className="max-w-5xl"><h1 className="text-3xl font-semibold">Navigation</h1>
    {initial ? <LinkEditor initial={initial} /> : <p role="alert" className="mt-6">Navigation could not be loaded safely. Refresh to retry.</p>}
  </section>;
}
