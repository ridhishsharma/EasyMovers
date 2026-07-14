import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json()

    const destination =
      await prisma.destinationDetails.upsert({

        where: {
          referenceId:
            body.referenceId
        },

        update: {

          propertyType:
            body.propertyType,

          floorNumber:
            body.floorNumber,

          liftAvailable:
            body.liftAvailable,

          parkingDistance:
            body.parkingDistance,

          installationServices:
            body.installationServices,

          additionalServices:
            body.additionalServices,

          specialInstructions:
            body.specialInstructions,

        },

        create: {

          referenceId:
            body.referenceId,

          propertyType:
            body.propertyType,

          floorNumber:
            body.floorNumber,

          liftAvailable:
            body.liftAvailable,

          parkingDistance:
            body.parkingDistance,

          installationServices:
            body.installationServices,

          additionalServices:
            body.additionalServices,

          specialInstructions:
            body.specialInstructions,

        }

      })

    return NextResponse.json({

      success: true,

      destination

    })

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      {
        success: false
      },
      {
        status: 500
      }
    )

  }

}

export async function GET(
  req: Request
) {

  try {

    const { searchParams } =
      new URL(req.url)

    const referenceId =
      searchParams.get(
        "referenceId"
      )

    if (!referenceId) {

      return NextResponse.json(
        {
          success: false
        },
        {
          status: 400
        }
      )

    }

    const destination =
      await prisma.destinationDetails.findFirst({

        where: {
          referenceId
        }

      })

    return NextResponse.json({

      success: true,

      destination

    })

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      {
        success: false
      },
      {
        status: 500
      }
    )

  }

}