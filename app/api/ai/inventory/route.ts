import {
  NextRequest,
  NextResponse,
} from "next/server";

export async function POST(
  request: NextRequest,
) {
  try {
    const body: unknown =
      await request.json();

    return NextResponse.json(
      {
        success: true,
        message:
          "Inventory AI route is available.",
        data: body,
      },
      {
        status: 200,
      },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "Invalid inventory request.",
      },
      {
        status: 400,
      },
    );
  }
}