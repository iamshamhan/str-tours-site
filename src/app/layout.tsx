import "./globals.css";
import "./design.css";
import "./map.css";
import { getPublicSettings } from "@/lib/settings/public";
import { themeScript,themeStyle } from "@/lib/settings/theme";
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings=await getPublicSettings();
  return <html lang="en" suppressHydrationWarning style={settings?themeStyle(settings):undefined}><head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head><body>{children}</body></html>;
}
