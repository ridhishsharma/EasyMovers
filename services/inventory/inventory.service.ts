import { prisma } from "@/lib"

export const inventoryService = {

  async getInventory(

    referenceId: string

  ) {

    return prisma.inventory.findUnique({

      where: {

        referenceId

      },

      include: {

        items: true,

        photos: true

      }

    })

  },

  async saveDraft(

    referenceId: string,

    data: any

  ) {

    return prisma.inventory.upsert({

      where: {

        referenceId

      },

      create: {

        referenceId,

        leadId: data.leadId,

        ...data

      },

      update: data

    })

  },

  async submitInventory(

    referenceId: string

  ) {

    return prisma.inventory.update({

      where: {

        referenceId

      },

      data: {

        status: "SUBMITTED"

      }

    })

  }

}