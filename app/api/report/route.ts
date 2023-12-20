import { OpenAIStream, StreamingTextResponse } from "ai";
import { Configuration, OpenAIApi } from "openai-edge";
import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";
import { getRelativePercentages } from "lib/utils";
import { ArchetypeValues } from "lib/types";

export const runtime = "edge";

// Opt out of caching for all data requests in the route segment
export const dynamic = "force-dynamic";

const getScoresUpdateMessage = (scores: number[]) => {
  return `🌟 Thinking Styles Reassessed! 🌟

Your journey of self-discovery continues with fresh insights. Here's how your thinking styles now align:

- Explorer: ${scores[0]}%
- Analyst: ${scores[1]}%
- Designer: ${scores[2]}%
- Optimizer: ${scores[3]}%
- Connector: ${scores[4]}%
- Nurturer: ${scores[5]}%
- Energizer: ${scores[6]}%
- Achiever: ${scores[7]}%

Embrace these insights and continue to explore the unique facets of your thought processes!`;
};

const createReportGenerationPrompt = ({
  explorer,
  analyst,
  designer,
  optimizer,
  connector,
  nurturer,
  energizer,
  achiever,
}: ArchetypeValues) => {
  // Identify the dominant thinking style based on the highest score
  const scores = { explorer, analyst, designer, optimizer, connector, nurturer, energizer, achiever };
  const dominantStyle = (Object.keys(scores) as (keyof typeof scores)[]).reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  );

  // Start the prompt with the dominant thinking style
  return `
Generate a comprehensive insight report titled within the context of thinking styles and 'Shift Thinking': 'Your Thinking Style Results' in markdown format for a user primarily identified as a "${dominantStyle}". Explicitly state their dominant thinking style the beginning of the report. The user's thinking style profile is as follows: explorer(${explorer}), analyst(${analyst}), designer(${designer}), optimizer(${optimizer}), connector(${connector}), nurturer(${nurturer}), energizer(${energizer}), achiever(${achiever}). Without explicitly stating it, align the report on the teachings of Mark Bonchek and shift.to methodology. The report should:

1. Focus primarily on the "${dominantStyle}" thinking archetype, offering detailed strategies for personal growth, learning, decision-making, problem-solving, and maintaining motivation.
2. Include insights and personalized advice for the highest scored thinking styles, ensuring a comprehensive understanding of the user's multifaceted thinking approach.
3. Provide recommendations for enhancing interpersonal relationships, considering their communicative and caring scores.
4. Offer ideas for managing change and uncertainty in both personal and professional contexts.
5. Suggest techniques for maintaining energy and motivation, specifically tailored to activities that best suit their dominant thinking archetype.
6. Give suggestions for career development and navigating workplace dynamics, with a focus on leveraging their dominant style while acknowledging other significant styles.
7. Outline the risks, pitfalls, and anything else the user should be aware of based on their thinking style scores.

End the report with a short summary of key takeaways for maintaining balance and overall well-being, emphasizing the importance of their dominant thinking style in various aspects of life.
`;
};

export async function POST(req: NextRequest) {
  const { scores } = (await req.json()) as { scores: ArchetypeValues & { id: string; user_id: string } };

  const userId = scores.user_id;

  if (!userId) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const model = process.env.GPT_MODEL;

  if (!model) {
    return new Response("No GPT model set", {
      status: 500,
    });
  }

  const content = createReportGenerationPrompt(scores);
  const scoresUpdate = getScoresUpdateMessage(getRelativePercentages(scores as ArchetypeValues));

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Replace with your API key
  });
  const openai = new OpenAIApi(configuration);

  // Request the OpenAI API for the response based on the prompt
  const response = await openai.createChatCompletion({
    model,
    stream: true,
    messages: [
      {
        role: "user",
        content,
      },
    ],
    temperature: 0.2,
  });

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      await sql`
        INSERT INTO reports (user_id, scores_id, report)
        VALUES (${userId}, ${scores.id}, ${completion})
        RETURNING *;
      `;
      await sql`INSERT INTO chat_messages (user_id, content, role) VALUES (${userId}, ${scoresUpdate}, 'assistant')`;
    },
  });

  return new StreamingTextResponse(stream);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Check if userId is not null or undefined
    if (!userId) {
      throw new Error("The user ID must be provided.");
    }

    // Query to select the latest reports row for the given user ID
    const { rows: reports } = await sql`
      SELECT reports.*, scores.explorer, scores.analyst, scores.designer, 
            scores.optimizer, scores.connector, scores.nurturer, 
            scores.energizer, scores.achiever
      FROM reports
      INNER JOIN scores ON reports.scores_id = scores.id
      WHERE reports.user_id = ${userId}
      ORDER BY reports.created_at DESC
      LIMIT 1;
    `;

    // Check if we got a result back
    if (reports.length === 0) {
      return NextResponse.json(
        {
          error: "No report found for the given user ID.",
        },
        {
          status: 404,
        }
      );
    }

    // Return the latest scores row
    return NextResponse.json(
      {
        message: "Latest report retrieved successfully.",
        report: reports[0],
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    // Return an error response
    return NextResponse.json(
      {
        error: "An error occurred while processing your request.",
      },
      {
        status: 500,
      }
    );
  }
}
