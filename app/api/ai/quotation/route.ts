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
          "Quotation AI route is available.",
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
          "Invalid quotation request.",
      },
      {
        status: 400,
      },
    );
  }
}