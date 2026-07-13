"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { LogoutButton } from "@/components/logout-button";
import {
  calculateProfileCompletion,
  displayName,
  radiusFromLabel,
  RADIUS_OPTIONS,
  radiusLabel,
} from "@/lib/user-profile";
import type { UserProfile } from "@/lib/types";

type Props = {
  profile: UserProfile;
};

const inputClass = "mt-1 w-full rounded-xl border px-3 py-2 text-sm";

export function SettingsForm({ profile }: Props) {
  const router = useRouter();
  const [preferredName, setPreferredName] = useState(
    profile.preferred_name ?? profile.first_name ?? ""
  );
  const [city, setCity] = useState(profile.city ?? "");
  const [state, setState] = useState(profile.state ?? "");
  const [zip, setZip] = useState(profile.zip_code ?? "");
  const [radius, setRadius] = useState(radiusLabel(profile.search_radius_miles));
  const [matchingDetails, setMatchingDetails] = useState(
    profile.profile_data?.matching_details ??
      profile.profile_data?.restrictions ??
      ""
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completion = calculateProfileCompletion(profile);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/user-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_name: preferredName.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          zip_code: zip.trim() || null,
          search_radius_miles: radiusFromLabel(radius),
          profile_data: {
            matching_details: matchingDetails.trim() || null,
            restrictions: matchingDetails.trim() || null,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save profile");
      }

      setMessage("Profile saved.");
      router.refresh();
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : "Could not save profile";
      setError(text);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Profile completion</span>
          <span className="text-sm font-bold text-[#437a22]">{completion}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#7a7974]/20">
          <div
            className="h-full rounded-full bg-[#437a22]"
            style={{ width: `${completion}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[#7a7974]">
          Signed in as {displayName(profile)} · {profile.email}
        </p>
        {!profile.onboarding_completed ? (
          <p className="mt-2 text-xs text-[#7a7974]">
            <a href="/onboarding" className="font-medium text-[#01696f] hover:underline">
              Resume onboarding
            </a>{" "}
            to improve your matches.
          </p>
        ) : null}
      </Card>

      <Card className="mb-4 space-y-4">
        <label className="block text-sm font-medium">
          Preferred name
          <input
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            className={inputClass}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-medium">
            City
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            State
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            ZIP
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Search radius
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
        </label>
        <Button variant="secondary" disabled={saving} onClick={handleSave}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
        {message ? <p className="text-sm text-[#437a22]">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </Card>

      <Card className="mb-4">
        <h2 className="font-semibold">Privacy & matching</h2>
        <p className="mt-2 text-sm text-[#7a7974]">
          Update optional conviction-related restrictions for job matching, or remove them
          anytime.
        </p>
        <Disclaimer className="mt-3">
          You can share only what helps us match you better. You control how this information is
          used.
        </Disclaimer>
        <textarea
          rows={4}
          value={matchingDetails}
          onChange={(e) => setMatchingDetails(e.target.value)}
          placeholder="Optional matching details..."
          className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
        />
        <Button variant="secondary" className="mt-3" disabled={saving} onClick={handleSave}>
          {saving ? "Saving..." : "Save matching details"}
        </Button>
      </Card>

      <Card>
        <h2 className="font-semibold">Account</h2>
        <div className="mt-2">
          <LogoutButton />
        </div>
      </Card>
    </div>
  );
}
