import { loadLinkEditor } from "@/lib/navigation/admin";
import { LinkEditor } from "@/components/admin/link-editor";
export default async function FooterPage() {
  const initial = await loadLinkEditor("footer");
  return (
    <section className="max-w-5xl">
      <h1 className="text-3xl font-semibold">Footer</h1>
      {initial ? (
        <LinkEditor initial={initial} />
      ) : (
        <p role="alert" className="mt-6">
          Footer could not be loaded safely. Refresh to retry.
        </p>
      )}
    </section>
  );
}
