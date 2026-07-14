"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { ONBOARDING_STEPS } from "@/lib/mock-data";
import {
  buildOnboardingPayload,
  clearOnboardingDraft,
  locationDefaults,
  readOnboardingDraft,
  RADIUS_OPTIONS,
  writeOnboardingDraft,
} from "@/lib/user-profile";
import type { OnboardingProfileData, UserProfile } from "@/lib/types";

type Props = {
  profile: UserProfile;
};

const inputClass =
  "w-full rounded-xl border border-[#7a7974]/25 bg-[#f7f6f2] px-3 py-2 text-sm";

function buildStepValues(profile: UserProfile): Record<string, string> {
  const data = profile.profile_data ?? {};
  const values: Record<string, string> = {};
  for (const onboardingStep of ONBOARDING_STEPS) {
    if (["name", "location", "radius"].includes(onboardingStep.id)) continue;
    const key = onboardingStep.id as keyof OnboardingProfileData;
    values[onboardingStep.id] = (data[key] as string | undefined) ?? "";
  }
  return values;
}

export function OnboardingFlow({ profile }: Props) {
  const router = useRouter();
  const location = locationDefaults(profile);
  const localDraft = readOnboardingDraft(profile.user_id);

  const [step, setStep] = useState(
    localDraft?.step ?? profile.profile_data?.onboarding_step ?? 0
  );
  const [preferredName, setPreferredName] = useState(
    localDraft?.preferredName ?? profile.preferred_name ?? profile.first_name ?? ""
  );
  const [city, setCity] = useState(localDraft?.city ?? location.city);
  const [state, setState] = useState(localDraft?.state ?? location.state);
  const [zip, setZip] = useState(localDraft?.zip ?? location.zip);
  const [radius, setRadius] = useState<string>(
    localDraft?.radius ??
      RADIUS_OPTIONS.find((option) => option.miles === profile.search_radius_miles)?.label ??
      "Within 10 miles"
  );
  const [stepValues, setStepValues] = useState<Record<string, string>>(
    localDraft?.stepValues ?? buildStepValues(profile)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const autoSaveReady = useRef(false);
  const latestRef = useRef({
    preferredName,
    city,
    state,
    zip,
    radius,
    stepValues,
  });

  latestRef.current = { preferredName, city, state, zip, radius, stepValues };

  const safeStep = Math.min(Math.max(step, 0), ONBOARDING_STEPS.length - 1);
  const current = ONBOARDING_STEPS[safeStep];
  const isLast = safeStep === ONBOARDING_STEPS.length - 1;
  const isRestrictions = current.id === "restrictions";

  function setStepValue(stepId: string, value: string) {
    setStepValues((prev) => ({ ...prev, [stepId]: value }));
  }

  function writeLocalDraft(targetStep: number) {
    const latest = latestRef.current;
    writeOnboardingDraft(profile.user_id, {
      step: targetStep,
      preferredName: latest.preferredName,
      city: latest.city,
      state: latest.state,
      zip: latest.zip,
      radius: latest.radius,
      stepValues: latest.stepValues,
      updatedAt: new Date().toISOString(),
    });
  }

  async function persistToServer(
    targetStep: number,
    options: { completed?: boolean } = {}
  ): Promise<boolean> {
    const latest = latestRef.current;
    const payload = buildOnboardingPayload({
      step: targetStep,
      preferredName: latest.preferredName,
      city: latest.city,
      state: latest.state,
      zip: latest.zip,
      radius: latest.radius,
      stepValues: latest.stepValues,
      onboardingCompleted: options.completed ?? false,
    });

    try {
      const response = await fetch("/api/user-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responsePayload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responsePayload.error ?? "Could not save progress");
      }
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not save progress";
      setError(`${message} Your answers are still saved on this device.`);
      return false;
    }
  }

  async function saveProgress(
    targetStep: number,
    options: { completed?: boolean; exit?: boolean; silent?: boolean } = {}
  ): Promise<boolean> {
    writeLocalDraft(targetStep);

    // Always move the UI immediately — never block Back / Skip / Continue on the network
    if (!options.silent && !options.exit && !options.completed) {
      setStep(targetStep);
    }

    if (!options.silent) {
      setSaving(true);
      setError(null);
      setSaveMessage(null);
    }

    const ok = await persistToServer(targetStep, { completed: options.completed });

    if (options.silent) {
      if (ok) setSaveMessage("Progress saved.");
      return ok;
    }

    try {
      if (ok) {
        setSaveMessage("Progress saved.");
        if (options.completed || options.exit) {
          clearOnboardingDraft(profile.user_id);
          router.push("/dashboard");
          router.refresh();
          return true;
        }
      } else if (options.exit || options.completed) {
        // Still let them leave onboarding even if the server save failed
        router.push("/dashboard");
        return false;
      }

      return ok;
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!autoSaveReady.current) {
      autoSaveReady.current = true;
      return;
    }

    const timer = window.setTimeout(() => {
      void saveProgress(safeStep, { silent: true });
    }, 1500);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredName, city, state, zip, radius, stepValues, safeStep]);

  function validateCurrentStep(): string | null {
    if (current.id === "name" && !preferredName.trim()) {
      return "Please enter a preferred name.";
    }
    if (current.id === "location") {
      if (!city.trim() || !state.trim() || !zip.trim()) {
        return "Please enter your city, state, and ZIP code.";
      }
    }
    if (current.id === "categories" && !stepValues.categories?.trim()) {
      return "Please list at least one job category.";
    }
    if (current.id === "availability" && !stepValues.availability?.trim()) {
      return "Please share your availability.";
    }
    if (current.id === "transport" && !stepValues.transport?.trim()) {
      return "Please share your transportation situation.";
    }
    return null;
  }

  async function handleContinue() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isLast) {
      await saveProgress(safeStep, { completed: true });
      return;
    }

    await saveProgress(safeStep + 1);
  }

  async function handleSkip() {
    if (isLast) {
      await saveProgress(safeStep, { completed: true });
      return;
    }
    await saveProgress(safeStep + 1);
  }

  async function handleBack() {
    if (safeStep === 0) return;
    await saveProgress(safeStep - 1);
  }

  async function handleSaveOnly() {
    await saveProgress(safeStep);
  }

  async function handleSkipAll() {
    await saveProgress(safeStep, { exit: true });
  }

  async function handleLeaveToDashboard(event: React.MouseEvent) {
    event.preventDefault();
    await saveProgress(safeStep, { exit: true });
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-10">
      <button
        type="button"
        onClick={handleLeaveToDashboard}
        className="text-sm text-[#7a7974] hover:text-[#28251d]"
      >
        ← Back to dashboard
      </button>
      <p className="mt-4 text-xs font-medium text-[#7a7974]">
        Step {safeStep + 1} of {ONBOARDING_STEPS.length}
      </p>
      <p className="mt-1 text-xs text-[#437a22]">
        Progress saves automatically as you type and when you continue.
      </p>
      {saveMessage ? (
        <p className="mt-1 text-xs font-medium text-[#437a22]">{saveMessage}</p>
      ) : null}
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#7a7974]/20">
        <div
          className="h-full rounded-full bg-[#437a22] transition-all"
          style={{ width: `${((safeStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
        />
      </div>
      <h1 className="mt-6 text-2xl font-bold">{current.title}</h1>
      {current.optional ? (
        <p className="mt-1 text-sm text-[#7a7974]">Optional — you can skip this step.</p>
      ) : null}
      {isRestrictions ? (
        <Disclaimer className="mt-4">
          You can share only what helps us match you better. You can skip this. You control how
          this information is used.
        </Disclaimer>
      ) : null}
      <Card className="mt-6">
        {current.id === "name" && (
          <input
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            placeholder="Preferred name"
            className={inputClass}
          />
        )}
        {current.id === "location" && (
          <div className="space-y-3">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (e.g. Clarksville, Nashville)"
              className={inputClass}
            />
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State (e.g. TN)"
              className={inputClass}
            />
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="ZIP code"
              className={inputClass}
            />
          </div>
        )}
        {current.id === "radius" && (
          <select
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className={inputClass}
          >
            {RADIUS_OPTIONS.map((option) => (
              <option key={option.miles} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        {!["name", "location", "radius"].includes(current.id) && (
          <textarea
            rows={3}
            value={stepValues[current.id] ?? ""}
            onChange={(e) => setStepValue(current.id, e.target.value)}
            placeholder="Add details or skip..."
            className={inputClass}
          />
        )}
      </Card>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {safeStep > 0 ? (
          <Button variant="secondary" onClick={() => void handleBack()}>
            Back
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => void handleSaveOnly()}>
          {saving ? "Saving..." : "Save progress"}
        </Button>
        {current.optional ? (
          <Button variant="ghost" onClick={() => void handleSkip()} className="flex-1">
            Skip
          </Button>
        ) : null}
        <Button className="flex-1" onClick={() => void handleContinue()}>
          {saving ? "Saving..." : isLast ? "Finish" : "Continue"}
        </Button>
      </div>
      <button
        type="button"
        onClick={() => void handleSkipAll()}
        className="mt-4 block w-full text-center text-sm text-[#7a7974] hover:text-[#28251d]"
      >
        Skip onboarding for now
      </button>
      <p className="mt-3 text-center text-xs text-[#7a7974]">
        Need to finish later?{" "}
        <Link href="/dashboard" onClick={handleLeaveToDashboard} className="font-medium text-[#01696f]">
          Save and return to dashboard
        </Link>
      </p>
    </main>
  );
}
