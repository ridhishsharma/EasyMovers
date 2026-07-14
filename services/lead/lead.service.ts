import { prisma } from "@/lib"

export const leadService = {

  async getLead(referenceId: string) {

    return prisma.lead.findUnique({

      where: {

        referenceId

      }

    })

  },

  async updateLead(

    referenceId: string,

    data: any

  ) {

    return prisma.lead.update({

      where: {

        referenceId

      },

      data

    })

  }

}