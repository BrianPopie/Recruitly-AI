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
You are a professional HR analyst. 

Job description:
${jobDesc}

Candidate CV:
${text}

Please analyze the candidate’s CV against the job description with the following instructions:

1. Provide a **match score (0–100)** indicating how well the candidate fits the job.
2. List **3 key strengths** that are directly relevant to the skills, experience, and qualifications mentioned in the job description. Do **not** include generic strengths unrelated to the job.
3. List **2 weaknesses** that could affect the candidate’s suitability for this specific role.
4. Respond in **plain, readable text** with headings, bullet points, and separators. 
5. Do **not** use JSON or any other format.  
6. Include the candidate's name or CV file name at the top.

Example format:

===== Candidate Name =====
Match Score: 85

Relevant Strengths:
- Strength 1 (directly relevant to job description)
- Strength 2
- Strength 3

Weaknesses:
- Weakness 1
- Weakness 2
`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
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
