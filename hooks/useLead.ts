
"use client"

import { useEffect, useState } from "react"

export interface LeadData {

  id: string

  referenceId: string

  customerName: string

  mobileNumber: string

  email?: string

  moveType: string

  pickupCity: string

  destinationCity: string

  movingDate?: string

  status: string

}

export default function useLead(

  referenceId: string

) {

  const [lead, setLead] =

    useState<LeadData | null>(null)

  const [loading, setLoading] =

    useState(true)

  const [error, setError] =

    useState<string | null>(null)

  //-----------------------------------------------------

  async function loadLead() {

    if (!referenceId) return

    try {

      setLoading(true)

      setError(null)

      const response = await fetch(

        `/api/lead?referenceId=${referenceId}`,

        {

          cache: "no-store"

        }

      )

      if (!response.ok) {

        throw new Error(

          "Unable to load lead."

        )

      }

      const data = await response.json()

      setLead(data)

    }

    catch (err: any) {

      console.error(err)

      setError(

        err.message ||

        "Something went wrong."

      )

    }

    finally {

      setLoading(false)

    }

  }

  //-----------------------------------------------------

  useEffect(() => {

    loadLead()

  }, [referenceId])

  //-----------------------------------------------------

  return {

    lead,

    loading,

    error,

    reload: loadLead

  }

}
 
