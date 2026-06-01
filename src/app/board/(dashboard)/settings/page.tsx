"use client";

import { useState } from "react";
import AccountSettings from "@/components/auth/AccountSettings";
export const dynamic = "force-dynamic";

export default function BoardSettingsPage() {
  const [activeTab, setActiveTab] = useState<"account" | "board">("account");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and board preferences</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("account")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "account"
              ? "border-b-2 border-omix-500 text-omix-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Account Settings
        </button>
        <button
          onClick={() => setActiveTab("board")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "board"
              ? "border-b-2 border-omix-500 text-omix-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Board Preferences
        </button>
      </div>

      {activeTab === "account" && <AccountSettings />}

      {activeTab === "board" && (
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 glow-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Meeting Defaults</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default Meeting Duration (minutes)
                </label>
                <input
                  type="number"
                  defaultValue={120}
                  className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-200 focus:outline-none input-glow transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Default Venue
                </label>
                <input
                  type="text"
                  placeholder="e.g. Board Room"
                  className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none input-glow transition-all"
                />
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 glow-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
            <div className="space-y-3">
              {[
                { id: "meeting-remind", label: "Meeting reminders (24h before)" },
                { id: "minute-ready", label: "Minutes ready for review" },
                { id: "suggestion-status", label: "Suggestion status updates" },
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-border bg-surface-2 text-omix-500 focus:ring-omix-500"
                  />
                  <span className="text-sm text-gray-300">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 glow-sm">
            <h3 className="text-lg font-semibold text-white mb-4">AI Assistance</h3>
            <p className="text-sm text-gray-400 mb-4">
              Enable AI-powered features for board meetings.
            </p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-border bg-surface-2 text-omix-500 focus:ring-omix-500"
                />
                <span className="text-sm text-gray-300">Auto-generate meeting summaries</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-border bg-surface-2 text-omix-500 focus:ring-omix-500"
                />
                <span className="text-sm text-gray-300">Proofread minutes with AI</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
