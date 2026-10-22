import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
export function sourceModule(path, mocks = {}, modules = new Map()) {
  const file = resolve(path);
  if (modules.has(file)) return modules.get(file).exports;
  const record = { exports: {} };
  modules.set(file, record);
  const js = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const native = createRequire(file),
    require = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name === "server-only") return {};
      if (name === "next/cache") return { unstable_cache: (fn) => fn, revalidateTag: () => {} };
      if (name.startsWith("@/") || name.startsWith(".")) {
        const base = name.startsWith("@/")
          ? resolve("src", name.slice(2))
          : resolve(dirname(file), name);
        const target = [base, base + ".ts", base + ".tsx", base + ".mjs"].find(existsSync);
        if (target) return sourceModule(target, mocks, modules);
      }
      return native(name);
    };
  new Function("require", "module", "exports", js)(require, record, record.exports);
  return record.exports;
}
