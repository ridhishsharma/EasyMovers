import { prisma } from "@/lib"

export const quotationService = {

  async get(referenceId: string) {

    return prisma.quotation.findUnique({

      where: {

        referenceId

      }

    })

  },

  async save(data: any) {

    return prisma.quotation.upsert({

      where: {

        referenceId: data.referenceId

      },

      create: data,

      update: data

    })

  }

}