export default function Loading() {
  return (
    <div className="admin-skeleton" role="status" aria-label="Loading workspace">
      <div />
      <div className="skeleton-stat-grid">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} />
        ))}
      </div>
      <div />
      <span className="visually-hidden">Loading…</span>
    </div>
  );
}
