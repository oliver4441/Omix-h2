"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AccountSettings from "@/components/auth/AccountSettings";
import DepartmentLayout from "@/components/layouts/DepartmentLayout";

export default function BoardSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"account" | "board">("account");

  return (
    <DepartmentLayout department="board">
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("account")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "account"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Account Settings
        </button>
        <button
          onClick={() => setActiveTab("board")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "board"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Board Preferences
        </button>
      </div>

      {activeTab === "account" && <AccountSettings />}

      {activeTab === "board" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Meeting Defaults
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Meeting Duration (minutes)
                </label>
                <input
                  type="number"
                  defaultValue={120}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Venue
                </label>
                <input
                  type="text"
                  placeholder="e.g. Board Room"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Notifications
            </h3>
            <div className="space-y-3">
              {[
                { id: "meeting-remind", label: "Meeting reminders (24h before)" },
                { id: "minute-ready", label: "Minutes ready for review" },
                { id: "suggestion-status", label: "Suggestion status updates" },
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              AI Assistance
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Enable AI-powered features for board meetings.
            </p>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  Auto-generate meeting summaries
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  Proofread minutes with AI
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </DepartmentLayout>
  );
}

export const dynamic = "force-dynamic";
