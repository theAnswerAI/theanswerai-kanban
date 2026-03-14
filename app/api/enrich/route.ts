import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { title, listName, boardName } = await req.json();
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });

const prompt = `You are a project management expert. Return ONLY a JSON object for this task. No markdown, no explanation, no extra text.

Task: "${title}"
List: "${listName}"  
Board: "${boardName}"

JSON format:
{"domain":"industry name","description":"Two sentences about this task.","subtasks":["step 1","step 2","step 3"],"priority":"medium","estimated_hours":4,"labels":["Label1"]}`;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
        }),
      }
    );
    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: "Gemini API error", details: err }, { status: 500 });
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json({
      description: parsed.description || "",
      subtasks: parsed.subtasks || [],
      priority: parsed.priority || "medium",
      estimated_hours: parsed.estimated_hours || 2,
      labels: parsed.labels || [],
      domain: parsed.domain || "General",
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to parse AI response", details: String(err) }, { status: 500 });
  }
}