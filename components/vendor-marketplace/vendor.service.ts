/* ============================================================
   Easy Movers Enterprise Platform

   Vendor Marketplace

   Vendor Service

   File: vendor.service.ts

   Version: 1.0

   NOTE

   Current Source
   --------------
   vendor.mock.ts

   Future Source
   -------------
   Vendor API
   Supabase

============================================================ */

import {

  DEFAULT_PAGE_SIZE,

} from "./vendor.constants"

import {

  MOCK_VENDORS,

} from "./vendor.mock"

import type {

  Vendor,

} from "./vendor.types"

/* ============================================================
   Vendor Service
============================================================ */

class VendorService {

  /* ========================================================
     Get All Vendors
  ======================================================== */

  async getVendors(): Promise<Vendor[]> {

    return Promise.resolve(MOCK_VENDORS)

  }

  /* ========================================================
     Get Vendor By Id
  ======================================================== */

  async getVendorById(

    id: string,

  ): Promise<Vendor | undefined> {

    return Promise.resolve(

      MOCK_VENDORS.find(

        vendor => vendor.id === id,

      ),

    )

  }

  /* ========================================================
     Featured Vendors
  ======================================================== */

  async getFeaturedVendors(): Promise<Vendor[]> {

    return Promise.resolve(

      MOCK_VENDORS.filter(

        vendor => vendor.featured,

      ),

    )

  }

  /* ========================================================
     Premium Vendors
  ======================================================== */

  async getPremiumVendors(): Promise<Vendor[]> {

    return Promise.resolve(

      MOCK_VENDORS.filter(

        vendor => vendor.premium,

      ),

    )

  }

  /* ========================================================
     Verified Vendors
  ======================================================== */

  async getVerifiedVendors(): Promise<Vendor[]> {

    return Promise.resolve(

      MOCK_VENDORS.filter(

        vendor => vendor.verified,

      ),

    )

  }

  /* ========================================================
     Search Vendors
  ======================================================== */

  async searchVendors(

    keyword: string,

  ): Promise<Vendor[]> {

    if (!keyword.trim()) {

      return this.getVendors()

    }

    const search = keyword.toLowerCase()

    return Promise.resolve(

      MOCK_VENDORS.filter(

        vendor =>

          vendor.name

            .toLowerCase()

            .includes(search) ||

          vendor.companyName

            ?.toLowerCase()

            .includes(search) ||

          vendor.description

            .toLowerCase()

            .includes(search),

      ),

    )

  }

  /* ========================================================
     Filter Vendors
  ======================================================== */

  async filterVendors(

    filter: string,

  ): Promise<Vendor[]> {

    if (filter === "all") {

      return this.getVendors()

    }

    return Promise.resolve(

      MOCK_VENDORS.filter(vendor => {

        switch (filter) {

          case "premium":

            return vendor.premium

          case "insured":

            return vendor.insurance.available

          case "household":

          case "office":

          case "storage":

          case "vehicle":

          case "international":

            return vendor.services.some(service =>

              service.id === filter ||

              service.name

                .toLowerCase()

                .includes(filter),

            )

          default:

            return true

        }

      }),

    )

  }

  /* ========================================================
     AI Recommended Vendors
  ======================================================== */

  async getRecommendedVendors(

    minimumScore = 90,

  ): Promise<Vendor[]> {

    return Promise.resolve(

      MOCK_VENDORS

        .filter(

          vendor =>

            vendor.rating.aiScore >= minimumScore,

        )

        .sort(

          (a, b) =>

            b.rating.aiScore -

            a.rating.aiScore,

        ),

    )

  }

  /* ========================================================
     Sort Vendors
  ======================================================== */

  async sortVendors(

    vendors: Vendor[],

    sortBy: string,

  ): Promise<Vendor[]> {

    const sorted = [...vendors]

    switch (sortBy) {

      case "rating":

        sorted.sort(

          (a, b) =>

            b.rating.rating -

            a.rating.rating,

        )

        break

      case "recommended":

        sorted.sort(

          (a, b) =>

            b.rating.aiScore -

            a.rating.aiScore,

        )

        break

      case "price-low":

        sorted.sort(

          (a, b) =>

            a.pricing.startingPrice -

            b.pricing.startingPrice,

        )

        break

      case "price-high":

        sorted.sort(

          (a, b) =>

            b.pricing.startingPrice -

            a.pricing.startingPrice,

        )

        break

      case "experience":

        sorted.sort(

          (a, b) =>

            (a.establishedYear ?? 9999) -

            (b.establishedYear ?? 9999),

        )

        break

      default:

        break

    }

    return Promise.resolve(sorted)

  }

  /* ========================================================
     Paginate Vendors
  ======================================================== */

  async paginateVendors(

    vendors: Vendor[],

    page = 1,

    pageSize = DEFAULT_PAGE_SIZE,

  ): Promise<Vendor[]> {

    const start = (page - 1) * pageSize

    const end = start + pageSize

    return Promise.resolve(

      vendors.slice(start, end),

    )

  }

  /* ========================================================
     Search + Filter + Sort Pipeline

     Single method used by UI

  ======================================================== */

  async queryVendors({

    search = "",

    filter = "all",

    sort = "recommended",

    page = 1,

    pageSize = DEFAULT_PAGE_SIZE,

  }: {

    search?: string

    filter?: string

    sort?: string

    page?: number

    pageSize?: number

  }): Promise<{

    data: Vendor[]

    total: number

    page: number

    pageSize: number

  }> {

    let vendors = await this.searchVendors(search)

    vendors = await this.filterVendorsFromList(

      vendors,

      filter,

    )

    vendors = await this.sortVendors(

      vendors,

      sort,

    )

    const total = vendors.length

    vendors = await this.paginateVendors(

      vendors,

      page,

      pageSize,

    )

    return {

      data: vendors,

      total,

      page,

      pageSize,

    }

  }

  /* ========================================================
     Internal Filter

     Used after Search

  ======================================================== */

  private async filterVendorsFromList(

    vendors: Vendor[],

    filter: string,

  ): Promise<Vendor[]> {

    if (filter === "all") {

      return vendors

    }

    return vendors.filter(vendor => {

      switch (filter) {

        case "premium":

          return vendor.premium

        case "insured":

          return vendor.insurance.available

        default:

          return vendor.services.some(service =>

            service.id === filter ||

            service.name

              .toLowerCase()

              .includes(filter),

          )

      }

    })

  }

  /* ========================================================
     Marketplace Statistics
  ======================================================== */

  async getMarketplaceStatistics() {

    const vendors = await this.getVendors()

    const totalVendors = vendors.length

    const verifiedVendors = vendors.filter(

      vendor => vendor.verified,

    ).length

    const premiumVendors = vendors.filter(

      vendor => vendor.premium,

    ).length

    const featuredVendors = vendors.filter(

      vendor => vendor.featured,

    ).length

    const averageRating =

      vendors.reduce(

        (sum, vendor) =>

          sum + vendor.rating.rating,

        0,

      ) / Math.max(vendors.length, 1)

    return {

      totalVendors,

      verifiedVendors,

      premiumVendors,

      featuredVendors,

      averageRating,

    }

  }

  /* ========================================================
     Future CRUD Methods

     Replace mock implementation with Vendor API

  ======================================================== */

  async createVendor(

    vendor: Vendor,

  ): Promise<Vendor> {

    console.warn(

      "createVendor() currently uses mock implementation.",

    )

    return Promise.resolve(vendor)

  }

  async updateVendor(

    vendor: Vendor,

  ): Promise<Vendor> {

    console.warn(

      "updateVendor() currently uses mock implementation.",

    )

    return Promise.resolve(vendor)

  }

  async deleteVendor(

    vendorId: string,

  ): Promise<boolean> {

    console.warn(

      `deleteVendor(${vendorId}) currently uses mock implementation.`,

    )

    return Promise.resolve(true)

  }

  /* ========================================================
     Future API Integration

     Example

     async getVendors() {

       return api.get("/vendors")

     }

  ======================================================== */

}

/* ============================================================
   Singleton Instance
============================================================ */

export const vendorService =

  new VendorService()

export default vendorService