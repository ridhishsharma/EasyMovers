
"use client"

import {
  Phone,
  Save,
  Send
} from "lucide-react"

interface ActionBarProps {

  onCallExpert: () => void

  onSaveDraft: () => void

  onSubmit: () => void

  isSaving?: boolean

  isSubmitting?: boolean

}

export default function ActionBar({

  onCallExpert,

  onSaveDraft,

  onSubmit,

  isSaving = false,

  isSubmitting = false

}: ActionBarProps) {

  return (

    <div className="sticky bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur">

      <div className="mx-auto flex max-w-7xl flex-col gap-3 p-4 md:flex-row md:justify-end">

        {/* Call Expert */}

        <button

          type="button"

          onClick={onCallExpert}

          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-green-600 bg-green-50 px-6 font-medium text-green-700 transition hover:bg-green-100"

        >

          <Phone size={18} />

          Call Expert

        </button>

        {/* Save Draft */}

        <button

          type="button"

          disabled={isSaving}

          onClick={onSaveDraft}

          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"

        >

          <Save size={18} />

          {isSaving

            ? "Saving..."

            : "Save Draft"}

        </button>

        {/* Submit */}

        <button

          type="button"

          disabled={isSubmitting}

          onClick={onSubmit}

          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"

        >

          <Send size={18} />

          {isSubmitting

            ? "Submitting..."

            : "Submit Inventory"}

        </button>

      </div>

    </div>

  )

}
 
