"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { FormSection } from "@/components/form-section";
import { BrandLogo } from "@/components/brand-logo";

const HEARD_ABOUT_OPTIONS = [
  "Search engine",
  "Social media",
  "Friend or family",
  "Job fair or community event",
  "Employer referral",
  "Other",
];

const CONTACT_CONSENT_TEXT =
  "By submitting the form with this box checked, you confirm that you are the primary user and subscriber to the telephone number provided, and you agree to receive calls (including using artificial or prerecorded voice), texts, and WhatsApp messages from Destiny Manifesto and employers who use Destiny Manifesto at the telephone number provided above.";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#1570ef] focus:outline-none focus:ring-1 focus:ring-[#1570ef]";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

export function UserAccountForm() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [about, setAbout] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [contactConsent, setContactConsent] = useState(false);
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [heardAboutUs, setHeardAboutUs] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadResume(userId: string): Promise<string | null> {
    if (!resumeFile) return null;

    const ext = resumeFile.name.split(".").pop() ?? "pdf";
    const path = `${userId}/resume.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(path, resumeFile, { upsert: true });

    if (uploadError) {
      console.warn("Resume upload skipped:", uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from("resumes").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the Terms of Service to create an account.");
      return;
    }

    if (phone && contactConsent === false) {
      setError("Please accept the contact consent agreement when providing a phone number.");
      return;
    }

    if (phoneVisible && !phone) {
      setError("Add a phone number before making it visible to employers.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "job_seeker",
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setError("Account created but session is pending. Check your email to verify, then sign in.");
        router.push("/login?role=job-seeker");
        return;
      }

      let resumeUrl: string | null = null;
      if (resumeFile) {
        resumeUrl = await uploadResume(userId);
      }

      const profileRes = await fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          about: about || null,
          email,
          date_of_birth: dateOfBirth || null,
          phone: phone || null,
          phone_visible_to_employers: phoneVisible,
          contact_consent: contactConsent,
          street_address: streetAddress || null,
          city: city || null,
          county: county || null,
          state: state || null,
          zip_code: zipCode || null,
          resume_url: resumeUrl,
          heard_about_us: heardAboutUs || null,
        }),
      });

      if (!profileRes.ok) {
        const payload = await profileRes.json();
        setError(payload.error ?? "Account created but profile could not be saved. Try signing in to complete your profile.");
        router.push("/login?role=job-seeker");
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-6 flex justify-center">
        <BrandLogo size="sm" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Join as a job seeker and start discovering second-chance opportunities.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <FormSection title="Your name">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="firstName">
                  First name
                </label>
                <input
                  id="firstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="lastName">
                  Last name
                </label>
                <input
                  id="lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                  autoComplete="family-name"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Tell us a little about yourself" optional>
            <div>
              <label className={labelClass} htmlFor="about">
                Bio
              </label>
              <textarea
                id="about"
                rows={4}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className={inputClass}
                placeholder="Skills, goals, or what you're looking for in your next role..."
              />
            </div>
          </FormSection>

          <FormSection title="Contact & location">
            <div>
              <label className={labelClass} htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="dateOfBirth">
                Date of birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="phone">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="(555) 555-5555"
                autoComplete="tel"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">Make number visible to employers</p>
              <button
                type="button"
                role="switch"
                aria-checked={phoneVisible}
                onClick={() => setPhoneVisible((v) => !v)}
                className={`inline-flex min-w-[3.5rem] items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition ${
                  phoneVisible
                    ? "bg-[#1570ef] text-white shadow-sm"
                    : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {phoneVisible ? "Visible" : "Hidden"}
              </button>
            </div>

            {phone ? (
              <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                <input
                  type="checkbox"
                  checked={contactConsent}
                  onChange={(e) => setContactConsent(e.target.checked)}
                  className="mt-0.5 shrink-0"
                />
                <span>{CONTACT_CONSENT_TEXT}</span>
              </label>
            ) : null}

            <div>
              <label className={labelClass} htmlFor="streetAddress">
                Street address
              </label>
              <input
                id="streetAddress"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className={inputClass}
                autoComplete="street-address"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                  autoComplete="address-level2"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="county">
                  County
                </label>
                <input
                  id="county"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="state">
                  State
                </label>
                <input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={inputClass}
                  autoComplete="address-level1"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="zipCode">
                  ZIP code
                </label>
                <input
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className={inputClass}
                  autoComplete="postal-code"
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Resume" optional>
            <div>
              <label className={labelClass} htmlFor="resume">
                Upload resume (PDF or Word, max 5 MB)
              </label>
              <input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                className="w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && file.size > 5 * 1024 * 1024) {
                    setError("Resume must be 5 MB or smaller.");
                    e.target.value = "";
                    setResumeFile(null);
                    return;
                  }
                  setResumeFile(file);
                }}
              />
            </div>
          </FormSection>

          <FormSection title="How did you hear about us?" optional>
            <div>
              <label className={labelClass} htmlFor="heardAboutUs">
                Source
              </label>
              <select
                id="heardAboutUs"
                value={heardAboutUs}
                onChange={(e) => setHeardAboutUs(e.target.value)}
                className={inputClass}
              >
                <option value="">Select one (optional)</option>
                {HEARD_ABOUT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </FormSection>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <label className="flex cursor-pointer gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 shrink-0"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="text-[#1570ef] underline-offset-2 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="text-[#1570ef] underline-offset-2 hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#1570ef] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-[#125ecc] disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
