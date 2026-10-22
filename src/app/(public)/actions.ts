"use server";
import { after } from "next/server";
import { notifyOwner } from "@/lib/public/notify";
import { issueSubmissionTicket, savePublicSubmission } from "@/lib/supabase/submissions";

export async function beginPublicSubmission(kind: "inquiry" | "review") {
  return issueSubmissionTicket(kind);
}
export async function submitTrip(input: unknown) {
  const result = await savePublicSubmission("inquiry", input);
  if (
    result.status === "success" &&
    input &&
    typeof input === "object" &&
    !("website" in input && input.website)
  )
    after(notifyOwner);
  return result;
}
export async function submitPublicReview(input: unknown) {
  return savePublicSubmission("review", input);
}
