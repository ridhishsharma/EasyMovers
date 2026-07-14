/* ============================================================
   Easy Movers Enterprise Platform

   Vendor Marketplace

   Vendor Hook

   File: useVendors.ts

   Version: 1.0

============================================================ */

import {

  useCallback,

  useEffect,

  useMemo,

  useState,

} from "react"

import {

  DEFAULT_PAGE_SIZE,

  DEFAULT_SORT,

  DEFAULT_VENDOR_FILTER,

} from "../vendor.constants"

import {

  vendorService,

} from "../vendor.service"

import type {

  Vendor,

} from "../vendor.types"

/* ============================================================
   Hook
============================================================ */

export function useVendors() {

  /* ========================================================
     State
  ======================================================== */

  const [

    vendors,

    setVendors,

  ] = useState<Vendor[]>([])

  const [

    loading,

    setLoading,

  ] = useState(true)

  const [

    error,

    setError,

  ] = useState<string | null>(null)

  const [

    search,

    setSearch,

  ] = useState("")

  const [

    filter,

    setFilter,

  ] = useState(DEFAULT_VENDOR_FILTER)

  const [

    sort,

    setSort,

  ] = useState(DEFAULT_SORT)

  const [

    page,

    setPage,

  ] = useState(1)

  const [

    pageSize,

    setPageSize,

  ] = useState(DEFAULT_PAGE_SIZE)

  const [

    total,

    setTotal,

  ] = useState(0)

  const [

    selectedVendor,

    setSelectedVendor,

  ] = useState<Vendor | null>(null)

  /* ========================================================
     Load Vendors
  ======================================================== */

  const loadVendors = useCallback(

    async () => {

      try {

        setLoading(true)

        setError(null)

        const result =

          await vendorService.queryVendors({

            search,

            filter,

            sort,

            page,

            pageSize,

          })

        setVendors(result.data)

        setTotal(result.total)

      }

      catch (err) {

        console.error(err)

        setError(

          "Unable to load vendors.",

        )

      }

      finally {

        setLoading(false)

      }

    },

    [

      search,

      filter,

      sort,

      page,

      pageSize,

    ],

  )
  /* ========================================================
     Initial Load

     Reload whenever query changes

  ======================================================== */

  useEffect(() => {

    loadVendors()

  }, [loadVendors])

  /* ========================================================
     Search
  ======================================================== */

  const updateSearch = useCallback(

    (value: string) => {

      setSearch(value)

      setPage(1)

    },

    [],

  )

  /* ========================================================
     Filter
  ======================================================== */

  const updateFilter = useCallback(

    (value: string) => {

      setFilter(value)

      setPage(1)

    },

    [],

  )

  /* ========================================================
     Sort
  ======================================================== */

  const updateSort = useCallback(

    (value: string) => {

      setSort(value)

      setPage(1)

    },

    [],

  )

  /* ========================================================
     Pagination
  ======================================================== */

  const nextPage = useCallback(() => {

    setPage(previous => previous + 1)

  }, [])

  const previousPage = useCallback(() => {

    setPage(previous =>

      Math.max(previous - 1, 1),

    )

  }, [])

  const goToPage = useCallback(

    (value: number) => {

      setPage(value)

    },

    [],

  )

  const changePageSize = useCallback(

    (value: number) => {

      setPageSize(value)

      setPage(1)

    },

    [],

  )

  /* ========================================================
     Vendor Selection
  ======================================================== */

  const selectVendor = useCallback(

    (vendor: Vendor | null) => {

      setSelectedVendor(vendor)

    },

    [],

  )

  /* ========================================================
     Refresh

  ======================================================== */

  const refresh = useCallback(

    async () => {

      await loadVendors()

    },

    [loadVendors],

  )

  /* ========================================================
     Reset Filters

  ======================================================== */

  const reset = useCallback(() => {

    setSearch("")

    setFilter(DEFAULT_VENDOR_FILTER)

    setSort(DEFAULT_SORT)

    setPage(1)

  }, [])

  /* ========================================================
     Featured Vendors
  ======================================================== */

  const featuredVendors = useMemo(

    () =>

      vendors.filter(

        vendor => vendor.featured,

      ),

    [vendors],

  )

  /* ========================================================
     Premium Vendors
  ======================================================== */

  const premiumVendors = useMemo(

    () =>

      vendors.filter(

        vendor => vendor.premium,

      ),

    [vendors],

  )

  /* ========================================================
     AI Recommended Vendors
  ======================================================== */

  const recommendedVendors = useMemo(

    () =>

      [...vendors]

        .sort(

          (a, b) =>

            b.rating.aiScore -

            a.rating.aiScore,

        )

        .slice(0, 3),

    [vendors],

  )

  /* ========================================================
     Pagination

  ======================================================== */

  const totalPages = useMemo(

    () =>

      Math.max(

        1,

        Math.ceil(

          total / pageSize,

        ),

      ),

    [total, pageSize],

  )

  const hasNextPage =

    page < totalPages

  const hasPreviousPage =

    page > 1

  /* ========================================================
     Hook Return
  ======================================================== */

  return {

    vendors,

    featuredVendors,

    premiumVendors,

    recommendedVendors,

    selectedVendor,

    loading,

    error,

    search,

    filter,

    sort,

    page,

    pageSize,

    total,

    totalPages,

    hasNextPage,

    hasPreviousPage,

    updateSearch,

    updateFilter,

    updateSort,

    nextPage,

    previousPage,

    goToPage,

    changePageSize,

    selectVendor,

    refresh,

    reset,

  }

}

/* ============================================================
   End of File
============================================================ */