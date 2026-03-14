import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { title, listName, boardName } = await req.json();

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
  }

  const prompt = `You are a project management AI assistant. A task card has been created with the title: "${title}"
It is in the "${listName}" list of the "${boardName}" board.

Generate a JSON response with exactly this structure and nothing else:
{
  "description": "A clear 2-sentence description of what this task involves and why it matters",
  "subtasks": ["subtask 1", "subtask 2", "subtask 3", "subtask 4"],
  "priority": "low or medium or high or urgent",
  "estimated_hours": 3,
  "labels": ["label1", "label2"]
}

Rules:
- description must be 2 sentences, specific to the task title
- subtasks must be 3-5 concrete actionable steps
- priority must be exactly one of: low, medium, high, urgent
- estimated_hours must be a number between 0.5 and 16
- labels pick from: Design, Engineering, Marketing, Docs, AI, Research
- Return only valid JSON, no markdown, no backticks, no explanation`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini error:", err);
      return NextResponse.json({ error: "Gemini API error" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Strip markdown code fences if present
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Enrichment failed:", err);
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}