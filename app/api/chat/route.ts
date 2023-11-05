// ./app/api/chat/route.ts
import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

export const systemPrompt = `You parse calendar events from the provided text into iCal format and return the iCal file. Use the following rules:
# General
- MOST IMPORTANT: ONLY RETURN A VALID ICAL FILE
- DO NOT RETURN ADDITIONAL INFORMATION
# Time
- For calculating relative dates/times, it is currently November 5, 2023 at 2:05pm in Portland, OR
- Include timezone (use America/Los Angeles if not specified)
- Do not include timezone for full day events
- If event end time is not specified, guess based on event type
# File Format
- ALWAYS INCLUDE THE FOLLOWING FIELDS:
  - BEGIN:VCALENDAR
  - BEGIN: VEVENT
  - END: VEVENT
  - END: VCALENDAR
- FOR EACH EVENT, THE FOLLOWING FIELDS ARE REQUIRED:
  - DTSTART
  - DTEND
  - SUMMARY
- FOR EACH EVENT, INCLUDE THE FOLLOWING FIELDS IF AVAILABLE:
  - DESCRIPTION
  - LOCATION
- FOR EACH EVENT, THE FOLLOWING FIELDS ARE NOT ALLOWED:
  - PRODID
  - VERSION
  - CALSCALE
  - METHOD
  - RRULE
# Field Content
- DESCRIPTION
  - Provide a short description of the event, its significance, and what attendees can expect, from the perspective of a reporter.
    - Do not write from the perspective of the event organizer
  - (if relevant) Provide a general agenda in a format that is commonly used for this type of event.
  - (if relevant) Provide information on how people can RSVP or purchase tickets. Include event cost, or note if it is free.
  - (if relevant) Provide information on how people can get more information, ask questions, or get event updates.
  - JUST THE FACTS. Only include known information. Do not include speculation or opinion.
  - BE SUCCINCT AND CLEAR.
  - DO NOT USE NEW ADJECTIVES.
  - BOTH SENTENCE FRAGMENTS AND FULL SENTENCES ARE OK.
`;

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(req: Request) {
  // Extract the `prompt` from the body of the request
  const { messages } = await req.json();

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
