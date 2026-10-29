"use server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { invalidatePublicContent } from "@/lib/public/cache";
import { revalidatePath } from "next/cache";
const routeSchema = z
  .array(
    z.object({
      tour_id: z.uuid(),
      day_id: z.uuid(),
      expected: z.string().datetime({ offset: true }),
    }),
  )
  .min(1)
  .max(100)
  .refine((rows) => new Set(rows.map((r) => r.tour_id)).size === rows.length);
export async function addPlaceToRoutes(placeId: string, expected: string, input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = routeSchema.safeParse(input);
  if (
    !z.uuid().safeParse(placeId).success ||
    !z.string().datetime({ offset: true }).safeParse(expected).success ||
    !parsed.success
  )
    return { ok: false, message: "Choose a tour and itinerary day for each route." };
  const { data, error } = await supabase.rpc("add_place_to_routes", {
    p_place: placeId,
    p_expected: expected,
    p_routes: parsed.data,
  });
  if (error)
    return {
      ok: false,
      message:
        "Routes were not changed. Reload if a place or tour was edited, and check every selected day.",
    };
  invalidatePublicContent();
  revalidatePath("/admin/places");
  revalidatePath("/admin/tours");
  return {
    ok: true,
    message: `Added to ${data} route${data === 1 ? "" : "s"}. Open a tour to adjust the stop order.`,
  };
}
