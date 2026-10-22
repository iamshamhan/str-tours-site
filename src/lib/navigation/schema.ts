import { z } from "zod";

export function safeLink(value: string): boolean {
  if (!value || /[\s\\\u0000-\u001f\u007f]/.test(value)) return false;
  if (/%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/i.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//") && !/^\/%2f/i.test(value)) return true;
  if (/^#[A-Za-z0-9_-]+$/.test(value)) return true;
  if (/^mailto:[^@?]+@[^@?]+\.[^@?]+$/.test(value)) return true;
  if (/^tel:\+?[0-9()-]+$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}
export const linkSchema = z.object({
  id: z.uuid(),
  label: z.string().trim().min(1, "Add a label.").max(100),
  href: z
    .string()
    .trim()
    .max(2048)
    .refine(safeLink, "Use /path, #section, https://, mailto: or tel:."),
  published: z.boolean(),
  open_in_new_tab: z.boolean(),
  parent_id: z.uuid().nullable(),
  group_name: z.string().trim().max(100),
});
export type EditableLink = z.infer<typeof linkSchema>;
export const copySchema = z.object({
  heading: z.string().trim().max(160),
  description: z.string().trim().max(2000),
  copyright: z.string().trim().max(400),
  legal_notice: z.string().trim().max(2000),
  published: z.boolean(),
  menu_label: z.string().trim().min(1).max(60),
  close_label: z.string().trim().min(1).max(60),
  whatsapp_label: z.string().trim().min(1).max(100),
});
// Internal editor defaults: these labels are persisted, not public fallbacks.
export const emptyCopy = {
  heading: "",
  description: "",
  copyright: "",
  legal_notice: "",
  published: false,
  menu_label: "Menu",
  close_label: "Close menu",
  whatsapp_label: "Chat on WhatsApp",
};
export const editorSchema = z
  .object({
    kind: z.enum(["navigation", "footer"]),
    items: z.array(linkSchema).max(100),
    deleted: z.array(z.uuid()).max(100),
    copy: copySchema,
  })
  .superRefine((value, ctx) => {
    const ids = new Set(value.items.map((item) => item.id));
    if (ids.size !== value.items.length)
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: "Duplicate items are not allowed.",
      });
    value.items.forEach((item, index) => {
      if (value.deleted.includes(item.id))
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "label"],
          message: "Reload before saving this deleted item.",
        });
      if (value.kind === "navigation" && item.parent_id) {
        const parent = value.items.find((other) => other.id === item.parent_id);
        if (!parent || parent.parent_id || item.id === item.parent_id)
          ctx.addIssue({
            code: "custom",
            path: ["items", index, "parent_id"],
            message: "Choose a top-level item. Only one dropdown level is supported.",
          });
      }
      if (value.kind === "footer" && !item.group_name)
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "group_name"],
          message: "Add a group name.",
        });
    });
  });
export type LinkEditorData = z.infer<typeof editorSchema>;

export function whatsappHref(number: string): string | null {
  const digits = number.replace(/[ ()+-]/g, "");
  return /^[1-9][0-9]{6,14}$/.test(digits) ? `https://wa.me/${digits}` : null;
}
