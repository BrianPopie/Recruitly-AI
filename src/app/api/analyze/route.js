import { NextResponse } from "next/server";
import OpenAI from "openai";
import { pdf } from "pdf-parse"; // ✅ named import for ESM

export const runtime = "nodejs";

// Extract text from PDF
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text.trim();
  } catch (err) {
    console.error("PDF parsing error:", err);
    return "";
  }
}

export async function POST(req) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const formData = await req.formData();
    const jobDesc = formData.get("jobDesc");
    const files = formData.getAll("files");

    if (!jobDesc || files.length === 0) {
      return new NextResponse("Missing job description or files.", { status: 400 });
    }

    let output = `📄 Job Description:\n${jobDesc}\n\n`;

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await extractTextFromPDF(buffer);

      if (!text) {
        output += `===== ${file.name} =====\n⚠️ Could not extract text from this PDF.\n\n`;
        continue;
      }

      const prompt = `
You are Recruitly AI — a professional HR analyst specializing in candidate evaluation and talent fit analysis.

Analyze the following CV based on the given job description.

Job Description:
${jobDesc}

Candidate CV:
${text}

Follow these instructions carefully:

1. Provide a **Match Score (0–100)** that reflects how well the candidate’s skills, experience, and qualifications align with the job requirements.
2. Identify **3 key strengths** that are clearly and directly relevant to the job description.
3. Identify **2 weaknesses or gaps** that could limit the candidate’s performance or fit for the role.
4. Maintain a **professional and structured tone** — use headings, bullet points, and short, clear sentences.
5. Do **not** use JSON, tables, or code blocks.
6. Include the **candidate’s name** (or CV file name) at the top.
7. End with a **concise summary (2–3 sentences)** highlighting the candidate’s overall fit and hiring potential.

Use the following output format exactly:

──────────────────────────────
Candidate: [Full Name or File Name]
Match Score: [Number]/100

🔹 **Key Strengths**
- Strength 1 (relevant to job)
- Strength 2
- Strength 3

🔸 **Weaknesses / Gaps**
- Weakness 1
- Weakness 2

🧭 **Summary**
A short, objective summary of the candidate’s overall fit for the position and hiring recommendation.
──────────────────────────────
`;


      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });

      const analysis = response.choices?.[0]?.message?.content?.trim() || "No response.";
      output += `===== ${file.name} =====\n${analysis}\n\n`;
    }

    return new NextResponse(output, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    console.error("Error in analyze route:", err);
    return new NextResponse(`Failed to analyze CVs: ${err.message}`, { status: 500 });
  }
}
