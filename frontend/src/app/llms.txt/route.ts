import fs from "fs";
import path from "path";

export const dynamic = "force-static";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "llms.txt");
    const content = fs.readFileSync(filePath, "utf8");
    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return new Response("# KemKendra\n> Global B2B Chemical Marketplace\nVisit https://kemkendra.online", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
