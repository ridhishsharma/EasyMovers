import { prisma } from "@/lib"

export const photoService = {

  async getPhotos(

    referenceId: string

  ) {

    return prisma.inventoryPhoto.findMany({
  where: {
    inventory: {
      referenceId
    }
  }
})
  },

  async savePhoto(data: any) {

    return prisma.inventoryPhoto.create({

      data

    })

  },

  async deletePhoto(id: string) {

    return prisma.inventoryPhoto.delete({

      where: {

        id

      }

    })

  }

}