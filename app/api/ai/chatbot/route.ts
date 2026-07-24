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
          "Chatbot API route is available.",
        data: body,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to process chatbot request.",
      },
      {
        status: 500,
      },
    );
  }
}