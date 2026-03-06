"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddMemberPage() {
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [visitsTotal, setVisitsTotal] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, secondName, visitsTotal }),
      });

      if (response.ok) {
        router.push("/admin/members");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create member");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error creating member:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="mb-8">
        <Link 
          href="/admin/members" 
          className="text-indigo-600 hover:text-indigo-900 flex items-center mb-4"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Add New Member</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <form onSubmit={handleCreateMember} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-3"
              placeholder="e.g. Ivan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Second Name</label>
            <input
              type="text"
              required
              value={secondName}
              onChange={(e) => setSecondName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-3"
              placeholder="e.g. Ivanov"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Visits</label>
            <input
              type="number"
              required
              min="1"
              value={visitsTotal}
              onChange={(e) => setVisitsTotal(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-3"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push("/admin/members")}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition"
            >
              {isSubmitting ? "Creating..." : "Create Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
