import { prisma } from "@/lib"

export const callbackService = {

  async save(data: any) {

    return prisma.callbackRequest.create({

      data

    })

  }

}