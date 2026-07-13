"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyProfile } from "@/lib/types";

type Props = {
  profile: CompanyProfile | null;
  redirectToNewJobAfterSave?: boolean;
};

export function CompanyProfileForm({ profile, redirectToNewJobAfterSave = false }: Props) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(profile?.company_name ?? "");
  const [website, setWebsite] = useState(profile?.website ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [felonFriendly, setFelonFriendly] = useState(profile?.felon_friendly ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: companyName,
        website,
        location,
        description,
        felon_friendly: felonFriendly,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const payload = await res.json();
      setError(payload.error ?? "Failed to save profile");
      return;
    }

    setSuccess("Profile saved");
    if (redirectToNewJobAfterSave && companyName.trim()) {
      router.push("/jobs/new");
      router.refresh();
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Company Profile</h2>

      <div>
        <label className="mb-1 block text-sm font-medium">Company Name</label>
        <input
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Website</label>
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="https://company.com"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Location</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="City, State"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={felonFriendly}
          onChange={(e) => setFelonFriendly(e.target.checked)}
        />
        This company is felon-friendly
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
