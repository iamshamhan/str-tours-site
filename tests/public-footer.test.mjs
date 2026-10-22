import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Exercise the real TSX component with React's server renderer, without a browser
// session, real publication changes, or extra runtime/testing dependencies.
const source = readFileSync(
  new URL("../src/components/public/footer.tsx", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
  },
});
const compiledModule = { exports: {} };
new Function("require", "module", "exports", compiled.outputText)(
  createRequire(import.meta.url),
  compiledModule,
  compiledModule.exports,
);
const { Footer } = compiledModule.exports;

test("empty footer has no fallback text or brand", () => {
  assert.equal(renderToStaticMarkup(createElement(Footer, { items: [], copy: null })), "");
});
test("footer groups, copy and external link protections render safely", () => {
  const html = renderToStaticMarkup(
    createElement(Footer, {
      items: [
        {
          id: "test",
          label: "<script>bad</script>",
          href: "https://example.com",
          group_name: "Explore",
          open_in_new_tab: true,
        },
      ],
      copy: {
        heading: "A heading",
        description: "A body",
        copyright: "Owner copyright",
        legal_notice: "",
      },
    }),
  );
  assert.match(html, /Explore/);
  assert.match(html, /Owner copyright/);
  assert.match(html, /A body/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});
