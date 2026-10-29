"use client";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  tripSchema,
  reviewSubmissionSchema,
  type TripInput,
  type ReviewInput,
} from "@/lib/public/submission-schema";
import { submitTrip, submitPublicReview, beginPublicSubmission } from "@/app/(public)/actions";
import { Turnstile } from "@/components/turnstile";
import type { Ui } from "@/lib/public/ui";
const subscribe = () => () => {};
export function Inquiry({
  ui,
  tourId = null,
  tourTitle,
  tours = [],
  privacy = false,
}: {
  ui: Ui;
  tourId?: string | null;
  tourTitle?: string;
  tours?: { id: string; title: string }[];
  privacy?: boolean;
}) {
  const ready = useSyncExternalStore(
      subscribe,
      () => true,
      () => false,
    ),
    [pending, start] = useTransition(),
    [feedback, setFeedback] = useState(""),
    [sent, setSent] = useState(false);
  const [challengeToken, setChallengeToken] = useState(""),
    [challengeReset, setChallengeReset] = useState(0);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TripInput>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      name: "",
      email: "",
      country: "",
      whatsapp: "",
      startDate: "",
      endDate: "",
      travellers: 1,
      interests: "",
      budget: "",
      message: "",
      tourId,
      website: "",
      startedAt: 0,
    },
  });
  const [formTicket, setFormTicket] = useState("");
  useEffect(() => {
    let active = true;
    beginPublicSubmission("inquiry")
      .then((ticket) => {
        if (!active) return;
        if (ticket) {
          setValue("startedAt", ticket.startedAt);
          setFormTicket(ticket.ticket);
        } else setFeedback(ui.error);
      })
      .catch(() => {
        if (active) setFeedback(ui.error);
      });
    return () => {
      active = false;
    };
  }, [setValue, ui.error]);
  if (!ui.formHeading || !ui.submit || !ui.consent) return null;
  return (
    <section id="inquire" className="trip-form public-section">
      <h2>{ui.formHeading}</h2>
      {tourId && tourTitle && (
        <p className="inquiry-tour">
          {ui.tour}: <strong>{tourTitle}</strong>
        </p>
      )}
      {sent ? (
        <p role="status" className="form-success">
          {ui.success}
        </p>
      ) : (
        <form
          method="post"
          noValidate
          onSubmit={handleSubmit(
            (v) =>
              start(async () => {
                try {
                  const r = await submitTrip({ ...v, challengeToken, formTicket });
                  setFeedback(ui[r.status] ?? ui.error ?? "");
                  if (r.status === "success") setSent(true);
                } catch {
                  setFeedback(ui.error ?? "");
                } finally {
                  setChallengeToken("");
                  setChallengeReset((n) => n + 1);
                }
              }),
            () => setFeedback(ui.validation ?? ""),
          )}
        >
          <fieldset disabled={pending || !ready || !formTicket} className="form-grid">
            {(
              [
                "name",
                "email",
                "country",
                "whatsapp",
                "startDate",
                "endDate",
                "travellers",
                "interests",
                "budget",
              ] as const
            ).map((key) => (
              <label key={key}>
                {ui[key]}
                <input
                  type={
                    key === "email"
                      ? "email"
                      : key === "whatsapp"
                        ? "tel"
                        : key === "startDate" || key === "endDate"
                          ? "date"
                          : key === "travellers"
                            ? "number"
                            : "text"
                  }
                  min={key === "travellers" ? 1 : undefined}
                  max={key === "travellers" ? 100 : undefined}
                  autoComplete={
                    key === "name"
                      ? "name"
                      : key === "email"
                        ? "email"
                        : key === "country"
                          ? "country-name"
                          : key === "whatsapp"
                            ? "tel"
                            : undefined
                  }
                  {...register(key, key === "travellers" ? { valueAsNumber: true } : {})}
                  aria-invalid={!!errors[key]}
                  aria-describedby={errors[key] ? `trip-${key}-error` : undefined}
                />
                {errors[key] && <small id={`trip-${key}-error`}>{ui.validation}</small>}
              </label>
            ))}
            {!tourId && tours.length > 0 && (
              <label>
                {ui.tour}
                <select {...register("tourId", { setValueAs: (v) => v || null })}>
                  <option value="">{ui.all}</option>
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="form-wide">
              {ui.message}
              <textarea rows={5} {...register("message")} aria-invalid={!!errors.message} />
              {errors.message && <small>{ui.validation}</small>}
            </label>
            <div className="honeypot" aria-hidden="true">
              <label>
                Website
                <input {...register("website")} tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <label className="consent form-wide">
              <input type="checkbox" {...register("consent")} aria-invalid={!!errors.consent} />
              <span>
                {ui.consent}
                {privacy && ui.privacyLabel && (
                  <>
                    {" "}
                    <Link href="/privacy">{ui.privacyLabel}</Link>
                  </>
                )}
              </span>
            </label>
            <Turnstile
              action="trip_inquiry"
              onToken={setChallengeToken}
              resetKey={challengeReset}
              label={ui.verification ?? ""}
              errorLabel={ui.verificationFailed ?? ""}
            />
            <button type="submit" disabled={!challengeToken} className="public-button">
              {pending ? ui.sending : ui.submit}
            </button>
          </fieldset>
          <p role="status">{feedback}</p>
        </form>
      )}
    </section>
  );
}
export function PublicReviewForm({
  ui,
  tours,
}: {
  ui: Ui;
  tours: { id: string; title: string }[];
}) {
  const ready = useSyncExternalStore(
      subscribe,
      () => true,
      () => false,
    ),
    [pending, start] = useTransition(),
    [feedback, setFeedback] = useState(""),
    [sent, setSent] = useState(false);
  const [challengeToken, setChallengeToken] = useState(""),
    [challengeReset, setChallengeReset] = useState(0);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSubmissionSchema),
    defaultValues: {
      name: "",
      country: "",
      rating: 5,
      message: "",
      date: "",
      tourId: null,
      website: "",
      startedAt: 0,
    },
  });
  const [formTicket, setFormTicket] = useState("");
  useEffect(() => {
    let active = true;
    beginPublicSubmission("review")
      .then((ticket) => {
        if (!active) return;
        if (ticket) {
          setValue("startedAt", ticket.startedAt);
          setFormTicket(ticket.ticket);
        } else setFeedback(ui.error);
      })
      .catch(() => {
        if (active) setFeedback(ui.error);
      });
    return () => {
      active = false;
    };
  }, [setValue, ui.error]);
  if (!ui.reviewHeading || !ui.submitReview || !ui.reviewConsent) return null;
  return (
    <section className="trip-form public-section">
      <h2>{ui.reviewHeading}</h2>
      {sent ? (
        <p role="status">{ui.reviewSuccess}</p>
      ) : (
        <form
          method="post"
          noValidate
          onSubmit={handleSubmit(
            (v) =>
              start(async () => {
                try {
                  const r = await submitPublicReview({ ...v, challengeToken, formTicket });
                  setFeedback(
                    r.status === "success" ? ui.reviewSuccess : (ui[r.status] ?? ui.error ?? ""),
                  );
                  if (r.status === "success") setSent(true);
                } catch {
                  setFeedback(ui.error ?? "");
                } finally {
                  setChallengeToken("");
                  setChallengeReset((n) => n + 1);
                }
              }),
            () => setFeedback(ui.validation ?? ""),
          )}
        >
          <fieldset className="form-grid" disabled={pending || !ready || !formTicket}>
            <label>
              {ui.name}
              <input {...register("name")} autoComplete="name" aria-invalid={!!errors.name} />
            </label>
            <label>
              {ui.country}
              <input {...register("country")} autoComplete="country-name" />
            </label>
            <label>
              {ui.rating}
              <select {...register("rating", { valueAsNumber: true })}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {ui.reviewDate}
              <input type="date" {...register("date")} />
            </label>
            <label>
              {ui.tour}
              <select {...register("tourId", { setValueAs: (v) => v || null })}>
                <option value="">{ui.all}</option>
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-wide">
              {ui.reviewBody}
              <textarea rows={5} {...register("message")} aria-invalid={!!errors.message} />
            </label>
            <div className="honeypot" aria-hidden="true">
              <label>
                Website
                <input {...register("website")} tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <label className="consent form-wide">
              <input type="checkbox" {...register("consent")} aria-invalid={!!errors.consent} />
              <span>{ui.reviewConsent}</span>
            </label>
            <Turnstile
              action="public_review"
              onToken={setChallengeToken}
              resetKey={challengeReset}
              label={ui.verification ?? ""}
              errorLabel={ui.verificationFailed ?? ""}
            />
            <button type="submit" disabled={!challengeToken} className="public-button">
              {pending ? ui.sending : ui.submitReview}
            </button>
          </fieldset>
          <p role="status">{feedback}</p>
        </form>
      )}
    </section>
  );
}
