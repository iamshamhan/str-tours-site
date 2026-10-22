import { z } from "zod";
const optionalDate = z.union([z.literal(""), z.iso.date()]);
export const tripSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    email: z.email().max(254),
    country: z.string().trim().min(1).max(100),
    whatsapp: z
      .string()
      .trim()
      .max(50)
      .refine((v) => !v || /^\+?[0-9 ()-]{7,40}$/.test(v)),
    startDate: optionalDate,
    endDate: optionalDate,
    travellers: z.number().int().min(1).max(100),
    interests: z.string().trim().max(2000),
    budget: z.string().trim().max(300),
    message: z.string().trim().min(10).max(5000),
    consent: z.literal(true),
    tourId: z.uuid().nullable(),
    website: z.string().max(300),
    startedAt: z.number().int().positive(),
  })
  .superRefine((v, ctx) => {
    if (v.startDate && v.endDate && v.endDate < v.startDate)
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "Invalid date range" });
    if (v.startDate && v.startDate < new Date().toISOString().slice(0, 10))
      ctx.addIssue({ code: "custom", path: ["startDate"], message: "Date is in the past" });
  });
export const reviewSubmissionSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    country: z.string().trim().max(100),
    rating: z.number().int().min(1).max(5),
    message: z.string().trim().min(10).max(5000),
    date: optionalDate,
    tourId: z.uuid().nullable(),
    consent: z.literal(true),
    website: z.string().max(300),
    startedAt: z.number().int().positive(),
  })
  .refine((v) => !v.date || v.date <= new Date().toISOString().slice(0, 10), {
    path: ["date"],
    message: "Date is in the future",
  });
export type TripInput = z.infer<typeof tripSchema>;
export type ReviewInput = z.infer<typeof reviewSubmissionSchema>;
