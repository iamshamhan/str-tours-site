import type { EditableLink, emptyCopy } from "@/lib/navigation/schema";
export function Footer({ items, copy }: { items: EditableLink[]; copy: typeof emptyCopy | null }) {
  if (
    !items.length &&
    !copy?.heading &&
    !copy?.description &&
    !copy?.copyright &&
    !copy?.legal_notice
  )
    return null;
  const groups = [...new Set(items.map((item) => item.group_name))];
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        {(copy?.heading || copy?.description) && (
          <section className="footer-intro">
            {copy.heading && <h2>{copy.heading}</h2>}
            {copy.description && <p>{copy.description}</p>}
          </section>
        )}
        {groups.map((group) => (
          <section key={group}>
            {group && <h2>{group}</h2>}
            <ul>
              {items
                .filter((item) => item.group_name === group)
                .map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      target={item.open_in_new_tab ? "_blank" : undefined}
                      rel={item.open_in_new_tab ? "noopener noreferrer" : undefined}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      {(copy?.copyright || copy?.legal_notice) && (
        <div className="footer-bottom">
          {copy.copyright && <p>{copy.copyright}</p>}
          {copy.legal_notice && <p>{copy.legal_notice}</p>}
        </div>
      )}
    </footer>
  );
}
