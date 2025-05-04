export const revalidate = 0;

export async function GET() {
  return Response.json({ version: Date.now() });
}
