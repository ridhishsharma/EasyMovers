"use client";

import { useState } from "react";

export default function AITestPage() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    referenceId: "REF-001",
    vendorId: "",
    leadId: "LEAD-001",
    customerCity: "Bhopal",
    destinationCity: "Indore",
    moveDistance: 190,
    estimatedWeight: 450,
    moveDate: "2026-08-01",
    isCorporateMove: false,
    isPremiumMove: false,
  });

  const [response, setResponse] = useState<any>(null);

  async function evaluateVendor() {
    setLoading(true);

    try {
      const res = await fetch("/api/ai/vendor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      setResponse(data);
    } catch (error) {
      console.error(error);

      setResponse({
        success: false,
        message: "Request Failed",
      });
    }

    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-6">
        EasyMovers Vendor AI Test
      </h1>

      <div className="grid grid-cols-2 gap-4">

        <input
          className="border p-2 rounded"
          placeholder="Reference ID"
          value={form.referenceId}
          onChange={(e) =>
            setForm({
              ...form,
              referenceId: e.target.value,
            })
          }
        />

        <input
          className="border p-2 rounded"
          placeholder="Vendor ID"
          value={form.vendorId}
          onChange={(e) =>
            setForm({
              ...form,
              vendorId: e.target.value,
            })
          }
        />

        <input
          className="border p-2 rounded"
          placeholder="Lead ID"
          value={form.leadId}
          onChange={(e) =>
            setForm({
              ...form,
              leadId: e.target.value,
            })
          }
        />

        <input
          className="border p-2 rounded"
          placeholder="Customer City"
          value={form.customerCity}
          onChange={(e) =>
            setForm({
              ...form,
              customerCity: e.target.value,
            })
          }
        />

        <input
          className="border p-2 rounded"
          placeholder="Destination City"
          value={form.destinationCity}
          onChange={(e) =>
            setForm({
              ...form,
              destinationCity: e.target.value,
            })
          }
        />

        <input
          type="number"
          className="border p-2 rounded"
          placeholder="Distance"
          value={form.moveDistance}
          onChange={(e) =>
            setForm({
              ...form,
              moveDistance: Number(e.target.value),
            })
          }
        />

        <input
          type="number"
          className="border p-2 rounded"
          placeholder="Weight"
          value={form.estimatedWeight}
          onChange={(e) =>
            setForm({
              ...form,
              estimatedWeight: Number(e.target.value),
            })
          }
        />

        <input
          type="date"
          className="border p-2 rounded"
          value={form.moveDate}
          onChange={(e) =>
            setForm({
              ...form,
              moveDate: e.target.value,
            })
          }
        />
      </div>

      <div className="mt-4 space-x-6">

        <label>

          <input
            type="checkbox"
            checked={form.isCorporateMove}
            onChange={(e) =>
              setForm({
                ...form,
                isCorporateMove: e.target.checked,
              })
            }
          />

          <span className="ml-2">
            Corporate Move
          </span>

        </label>

        <label>

          <input
            type="checkbox"
            checked={form.isPremiumMove}
            onChange={(e) =>
              setForm({
                ...form,
                isPremiumMove: e.target.checked,
              })
            }
          />

          <span className="ml-2">
            Premium Move
          </span>

        </label>

      </div>

      <button
        onClick={evaluateVendor}
        disabled={loading}
        className="mt-6 bg-blue-600 text-white px-6 py-3 rounded"
      >
        {loading
          ? "Evaluating..."
          : "Evaluate Vendor"}
      </button>

      {response && (
        <div className="mt-8">

          <h2 className="text-xl font-bold mb-2">
            API Response
          </h2>

          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(response, null, 2)}
          </pre>

        </div>
      )}

    </div>
  );
}