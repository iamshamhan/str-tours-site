"use client";
export default function GlobalError() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: "15vh 24px",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          background: "#FBFBFD",
          color: "#1D1D1F",
        }}
      >
        <main role="alert">
          <h1>Something went wrong, please try again.</h1>
          <button
            style={{ padding: "14px 24px", font: "inherit", cursor: "pointer" }}
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
