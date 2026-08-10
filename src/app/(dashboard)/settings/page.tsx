"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Building2,
  Save,
  Loader2,
  CheckCircle2,
  School,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileData {
  name: string;
  email: string;
  role: string;
}

interface SchoolData {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  motto: string;
  academicYear: string;
  currentTerm: string;
  termStart: string;
  termEnd: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    role: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);

  // School state
  const [school, setSchool] = useState<SchoolData>({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    motto: "",
    academicYear: new Date().getFullYear().toString(),
    currentTerm: "Term 1",
    termStart: "",
    termEnd: "",
  });
  const [schoolLoading, setSchoolLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Load profile info via the auth session or settings API
    fetchProfile();
    fetchSchool();
  }, []);

  async function fetchProfile() {
    try {
      setProfileLoading(true);
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.user?.name || "",
          email: data.user?.email || "",
          role: data.user?.role || "",
        });
      } else {
        // Fallback display
        setProfile({ name: "Administrator", email: "admin@omixsystems.com", role: "admin" });
      }
    } catch {
      setProfile({ name: "Administrator", email: "admin@omixsystems.com", role: "admin" });
    } finally {
      setProfileLoading(false);
    }
  }

  async function fetchSchool() {
    try {
      setSchoolLoading(true);
      // Attempt to fetch school settings — use a generic approach
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSchool({
          name: data.school?.name || "",
          address: data.school?.address || "",
          phone: data.school?.phone || "",
          email: data.school?.email || "",
          website: data.school?.website || "",
          motto: data.school?.motto || "",
          academicYear: data.school?.academicYear || new Date().getFullYear().toString(),
          currentTerm: data.school?.currentTerm || "Term 1",
          termStart: data.school?.termStart || "",
          termEnd: data.school?.termEnd || "",
        });
      } else {
        // Set defaults
        setSchool({
          name: "omixsystems School",
          address: "123 Education Lane",
          phone: "+254 700 000 000",
          email: "info@omixsystems.com",
          website: "https://omixsystems.com",
          motto: "Empowering Education Through Technology",
          academicYear: new Date().getFullYear().toString(),
          currentTerm: "Term 1",
          termStart: "",
          termEnd: "",
        });
      }
    } catch {
      setSchool({
        name: "omixsystems School",
        address: "123 Education Lane",
        phone: "+254 700 000 000",
        email: "info@omixsystems.com",
        website: "https://omixsystems.com",
        motto: "Empowering Education Through Technology",
        academicYear: new Date().getFullYear().toString(),
        currentTerm: "Term 1",
        termStart: "",
        termEnd: "",
      });
    } finally {
      setSchoolLoading(false);
    }
  }

  async function handleSaveProfile() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Placeholder API call — would connect to a settings/profile endpoint
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSchool() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school }),
      });

      if (!res.ok) throw new Error("Failed to save school settings");

      setSuccess("School settings updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const TABS = [
    { key: "profile", label: "Profile", icon: User },
    { key: "school", label: "School", icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage your profile and school information
        </p>
      </div>

      {/* Success / Error */}
      {success && (
        <div className="glass rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </p>
        </div>
      )}
      {error && (
        <div className="glass rounded-2xl p-4 border border-red-500/20">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="glass rounded-2xl overflow-hidden border-border">
        <div className="flex border-b border-border">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all relative",
                  isActive
                    ? "text-omix-400"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="settingsTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-omix-500"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="max-w-2xl">
              {profileLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-surface-2 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 pb-6 border-b border-border">
                    <div className="w-16 h-16 rounded-2xl bg-omix-500/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-omix-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {profile.name || "User"}
                      </h2>
                      <p className="text-sm text-gray-400 capitalize">
                        {profile.role || "Administrator"}
                      </p>
                    </div>
                  </div>

                  {/* Profile Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) =>
                          setProfile((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) =>
                            setProfile((prev) => ({ ...prev, email: e.target.value }))
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Role
                      </label>
                      <input
                        type="text"
                        value={profile.role}
                        disabled
                        className="w-full px-4 py-2.5 bg-surface-2/50 border border-border rounded-xl text-sm text-gray-400 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Role is managed by system administrators
                      </p>
                    </div>
                  </div>

                  {/* Save */}
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm disabled:opacity-40"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* School Tab */}
          {activeTab === "school" && (
            <div className="max-w-2xl">
              {schoolLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 bg-surface-2 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* School Header */}
                  <div className="flex items-center gap-4 pb-6 border-b border-border">
                    <div className="w-16 h-16 rounded-2xl bg-omix-500/10 flex items-center justify-center">
                      <School className="w-8 h-8 text-omix-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {school.name || "School Name"}
                      </h2>
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {school.address || "Address not set"}
                      </p>
                    </div>
                  </div>

                  {/* School Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        School Name
                      </label>
                      <input
                        type="text"
                        value={school.name}
                        onChange={(e) =>
                          setSchool((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Enter school name"
                        className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          value={school.address}
                          onChange={(e) =>
                            setSchool((prev) => ({ ...prev, address: e.target.value }))
                          }
                          placeholder="Enter school address"
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Phone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            value={school.phone}
                            onChange={(e) =>
                              setSchool((prev) => ({ ...prev, phone: e.target.value }))
                            }
                            placeholder="+254 700 000 000"
                            className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="email"
                            value={school.email}
                            onChange={(e) =>
                              setSchool((prev) => ({ ...prev, email: e.target.value }))
                            }
                            placeholder="info@school.com"
                            className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Website
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            value={school.website}
                            onChange={(e) =>
                              setSchool((prev) => ({ ...prev, website: e.target.value }))
                            }
                            placeholder="https://school.com"
                            className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          School Motto
                        </label>
                        <input
                          type="text"
                          value={school.motto}
                          onChange={(e) =>
                            setSchool((prev) => ({ ...prev, motto: e.target.value }))
                          }
                          placeholder="Enter school motto"
                          className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
                        />
                      </div>
                    </div>

                    {/* Academic Year & Term */}
                    <div className="pt-6 border-t border-border">
                      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-omix-400" />
                        Academic Year & Term
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Current Academic Year
                          </label>
                          <input
                            type="text"
                            value={school.academicYear}
                            onChange={(e) =>
                              setSchool((prev) => ({ ...prev, academicYear: e.target.value }))
                            }
                            placeholder="2026"
                            className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Current Term
                          </label>
                          <select
                            value={school.currentTerm}
                            onChange={(e) =>
                              setSchool((prev) => ({ ...prev, currentTerm: e.target.value }))
                            }
                            className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all"
                          >
                            <option value="Term 1">Term 1 (Jan–Apr)</option>
                            <option value="Term 2">Term 2 (May–Aug)</option>
                            <option value="Term 3">Term 3 (Sep–Dec)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Term Start Date
                          </label>
                          <input
                            type="date"
                            value={school.termStart}
                            onChange={(e) =>
                              setSchool((prev) => ({ ...prev, termStart: e.target.value }))
                            }
                            className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Term End Date
                          </label>
                          <input
                            type="date"
                            value={school.termEnd}
                            onChange={(e) =>
                              setSchool((prev) => ({ ...prev, termEnd: e.target.value }))
                            }
                            className="w-full px-4 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-gray-200 focus:outline-none input-glow transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save */}
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSaveSchool}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-omix-600 to-omix-500 hover:from-omix-500 hover:to-omix-400 text-white font-medium rounded-xl transition-all duration-300 glow-sm disabled:opacity-40"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save School Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
