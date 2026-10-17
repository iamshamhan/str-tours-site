import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim().max(254),
  password: z.string().min(1, "Enter your password.").max(256, "Password is too long."),
});
export type LoginValues = z.infer<typeof loginSchema>;
export const LOGIN_ERROR = "Unable to sign in. Check your credentials and try again.";
