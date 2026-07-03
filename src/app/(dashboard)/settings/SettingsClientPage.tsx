"use client";

import { useState, useTransition } from "react";
import { updateProfile, changePassword, updateSettings, updateEmailSettings } from "@/app/actions/settings";
import { User, ShieldCheck, Mail, Save, RefreshCw, KeyRound } from "lucide-react";

interface UserDetails {
  user_name: string;
  user_email: string;
  user_phone: string;
  user_image: string | null;
}

interface SiteSettings {
  settings_title: string | null;
  settings_company: string | null;
  settings_email: string | null;
  settings_phone: string | null;
  settings_address: string | null;
  settings_logo: string | null;
  settings_favicon: string | null;
  settings_mailer: string | null;
  settings_host: string | null;
  settings_port: number | null;
  settings_uname: string | null;
  settings_pwd: string | null;
  settings_encryption: string | null;
  settings_faddress: string | null;
  settings_fname: string | null;
}

export default function SettingsClientPage({
  initialUser,
  initialSettings,
}: {
  initialUser: UserDetails;
  initialSettings: SiteSettings | null;
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "site" | "email">("profile");
  const [isPending, startTransition] = useTransition();

  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const [siteSuccess, setSiteSuccess] = useState<string | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);

  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateProfile(formData);
      if (res.success) {
        setProfileSuccess(res.success);
        window.location.reload();
      } else if (res.error) {
        setProfileError(res.error);
      }
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwSuccess(null);
    setPwError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await changePassword(formData);
      if (res.success) {
        setPwSuccess(res.success);
        e.currentTarget.reset();
      } else if (res.error) {
        setPwError(res.error);
      }
    });
  };

  const handleSiteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSiteSuccess(null);
    setSiteError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateSettings(formData);
      if (res.success) {
        setSiteSuccess(res.success);
        window.location.reload();
      } else if (res.error) {
        setSiteError(res.error);
      }
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailSuccess(null);
    setEmailError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateEmailSettings(formData);
      if (res.success) {
        setEmailSuccess(res.success);
      } else if (res.error) {
        setEmailError(res.error);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">Settings</h2>
        <p className="text-sm text-slate-400">Configure profile, agency parameters, and mail SMTP settings</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "profile"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <User className="w-4 h-4" /> My Profile
        </button>
        <button
          onClick={() => setActiveTab("site")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "site"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Site Configuration
        </button>
        <button
          onClick={() => setActiveTab("email")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "email"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Mail className="w-4 h-4" /> Email / SMTP
        </button>
      </div>

      {/* Profile & Password tab content */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile details */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-3">
              Profile Details
            </h3>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {profileError && <div className="text-sm font-semibold text-red-400 bg-red-950/20 border border-red-800/40 p-3 rounded-lg">{profileError}</div>}
              {profileSuccess && <div className="text-sm font-semibold text-green-400 bg-green-950/20 border border-green-800/40 p-3 rounded-lg">{profileSuccess}</div>}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  name="user_name"
                  required
                  defaultValue={initialUser.user_name}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  name="user_email"
                  required
                  defaultValue={initialUser.user_email}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="user_phone"
                  required
                  defaultValue={initialUser.user_phone}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Profile Photo</label>
                <input
                  type="file"
                  name="user_image"
                  accept="image/*"
                  className="block w-full text-slate-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-slate-200 file:cursor-pointer hover:file:bg-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
              >
                {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Profile</>}
              </button>
            </form>
          </div>

          {/* Change password */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-3">
              Change Password
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {pwError && <div className="text-sm font-semibold text-red-400 bg-red-950/20 border border-red-800/40 p-3 rounded-lg">{pwError}</div>}
              {pwSuccess && <div className="text-sm font-semibold text-green-400 bg-green-950/20 border border-green-800/40 p-3 rounded-lg">{pwSuccess}</div>}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  name="current_password"
                  required
                  placeholder="••••••••"
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  name="new_password"
                  required
                  placeholder="Min 6 characters"
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  placeholder="Repeat new password"
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
              >
                {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><KeyRound className="w-4 h-4" /> Change Password</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Site Settings Tab */}
      {activeTab === "site" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-3">
            Global Site Settings
          </h3>
          <form onSubmit={handleSiteSubmit} className="space-y-4">
            {siteError && <div className="text-sm font-semibold text-red-400 bg-red-950/20 border border-red-800/40 p-3 rounded-lg">{siteError}</div>}
            {siteSuccess && <div className="text-sm font-semibold text-green-400 bg-green-950/20 border border-green-800/40 p-3 rounded-lg">{siteSuccess}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Website Title</label>
                <input
                  type="text"
                  name="settings_title"
                  required
                  defaultValue={initialSettings?.settings_title || ""}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
                <input
                  type="text"
                  name="settings_company"
                  required
                  defaultValue={initialSettings?.settings_company || ""}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Support Email</label>
                <input
                  type="email"
                  name="settings_email"
                  required
                  defaultValue={initialSettings?.settings_email || ""}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Support Phone</label>
                <input
                  type="text"
                  name="settings_phone"
                  required
                  defaultValue={initialSettings?.settings_phone || ""}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Company Address</label>
                <textarea
                  name="settings_address"
                  required
                  rows={2}
                  defaultValue={initialSettings?.settings_address || ""}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Header Logo</label>
                <input
                  type="file"
                  name="settings_logo"
                  accept="image/*"
                  className="block w-full text-slate-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Favicon Asset</label>
                <input
                  type="file"
                  name="settings_favicon"
                  accept="image/*"
                  className="block w-full text-slate-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center gap-2 py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
              {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Site Config</>}
            </button>
          </form>
        </div>
      )}

      {/* Email Configurations */}
      {activeTab === "email" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-800 pb-3">
            SMTP Server Configuration
          </h3>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {emailError && <div className="text-sm font-semibold text-red-400 bg-red-950/20 border border-red-800/40 p-3 rounded-lg">{emailError}</div>}
            {emailSuccess && <div className="text-sm font-semibold text-green-400 bg-green-950/20 border border-green-800/40 p-3 rounded-lg">{emailSuccess}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Mailer Driver</label>
                <input
                  type="text"
                  name="settings_mailer"
                  required
                  placeholder="e.g. smtp"
                  defaultValue={initialSettings?.settings_mailer || ""}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">SMTP Host</label>
                <input
                  type="text"
                  name="settings_host"
                  required
                  placeholder="e.g. smtp.mailtrap.io"
                  defaultValue={initialSettings?.settings_host || ""}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">SMTP Port</label>
                <input
                  type="number"
                  name="settings_port"
                  required
                  placeholder="e.g. 587 or 465"
                  defaultValue={initialSettings?.settings_port || ""}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">SMTP Username</label>
                <input
                  type="text"
                  name="settings_uname"
                  required
                  defaultValue={initialSettings?.settings_uname || ""}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">SMTP Password</label>
                <input
                  type="password"
                  name="settings_pwd"
                  required
                  defaultValue={initialSettings?.settings_pwd || ""}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Mail Encryption</label>
                <input
                  type="text"
                  name="settings_encryption"
                  required
                  placeholder="e.g. tls or ssl"
                  defaultValue={initialSettings?.settings_encryption || ""}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Sender Email</label>
                <input
                  type="email"
                  name="settings_faddress"
                  required
                  defaultValue={initialSettings?.settings_faddress || ""}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Sender Display Name</label>
                <input
                  type="text"
                  name="settings_fname"
                  required
                  defaultValue={initialSettings?.settings_fname || ""}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center gap-2 py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
              {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save SMTP Mailer</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
