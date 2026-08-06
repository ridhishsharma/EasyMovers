import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const destination =
      await prisma.destinationDetails.upsert({
        where: {
          referenceId:
            body.referenceId,
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
        },
      });

    return NextResponse.json({
      success: true,
      destination,
    });
  } catch (error) {
    console.error(
      "Destination POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to save destination details.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET(
  request: Request
) {
  try {
    const {
      searchParams,
    } = new URL(
      request.url
    );

    const referenceId =
      searchParams.get(
        "referenceId"
      );

    if (!referenceId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "referenceId is required.",
        },
        {
          status: 400,
        }
      );
    }

    const destination =
      await prisma.destinationDetails.findFirst({
        where: {
          referenceId,
        },
      });

    return NextResponse.json({
      success: true,
      destination,
    });
  } catch (error) {
    console.error(
      "Destination GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to retrieve destination details.",
      },
      {
        status: 500,
      }
    );
  }
}