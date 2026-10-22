import Link from "next/link";
import { getPublicSettings } from "@/lib/settings/public";
export default async function NotFound() {
  const s = await getPublicSettings();
  return (
    <main id="main-content" className="public-site public-not-found">
      {s && (
        <>
          <h1>{s.ui.notFoundTitle}</h1>
          <p>{s.ui.notFoundBody}</p>
          {s.ui.backHome && (
            <Link href="/" className="public-button">
              {s.ui.backHome}
            </Link>
          )}
        </>
      )}
    </main>
  );
}
