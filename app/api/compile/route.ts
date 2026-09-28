const COMPILER_ENDPOINT = "https://api.onlinecompiler.io/api/run-code-sync/";
const COMPILER_API_KEY = "08b221ed744154b9e7eff9c970dc86c0";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(COMPILER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: COMPILER_API_KEY,
      },
      body: JSON.stringify(body),
    });

    return Response.json(await response.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: "Backend execution failed", details: message },
      { status: 500 },
    );
  }
}
