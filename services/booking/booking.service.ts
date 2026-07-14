import { prisma } from "@/lib"

export const bookingService = {

  async create(data: any) {

    return prisma.booking.create({

      data

    })

  }

}