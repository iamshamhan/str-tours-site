import { requireAdmin } from "@/lib/admin/auth";
import { MediaLibrary } from "@/components/admin/media-library";
export default async function MediaPage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Media library</h1>
      <MediaLibrary />
    </div>
  );
}
