import { prisma } from "@/lib"

export const propertyService = {

  async get(referenceId: string) {

    return prisma.destinationDetails.findUnique({

      where: {

        referenceId

      }

    })

  },

  async save(

    referenceId: string,

    data: any

  ) {

    return prisma.destinationDetails.upsert({

      where: {

        referenceId

      },

      create: {

        referenceId,

        ...data

      },

      update: data

    })

  }

}