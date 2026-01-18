import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import { Prisma } from "@prisma/client";
import {
  generateChatAdvisorResponse,
  PortfolioData,
  StudentMemory,
} from "../prompts";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents a single chat message
 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/**
 * Represents a chat session with proper typing
 */
export interface ChatSessionData {
  id: string;
  userId: string;
  evaluationId: string | null;
  messages: ChatMessage[];
  createdAt: Date;
}

/**
 * Evaluation result structure from the database
 */
interface EvaluationResult {
  evaluation?: string;
  [key: string]: unknown;
}

/**
 * Request body for the chat endpoint
 */
interface ChatRequestBody {
  mode: string;
  message: string;
  evaluationId?: string | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Converts Evaluation result to StudentMemory
 * Extracts relevant information from the stored evaluation
 */
function evaluationToMemory(evaluationResult: EvaluationResult): StudentMemory {
  const evaluationText = evaluationResult.evaluation || "";
  const lowerEvaluation = evaluationText.toLowerCase();

  // Extract weaknesses from evaluation text
  const identifiedWeaknesses: string[] = [];
  const weaknessPatterns = [
    /weakness(?:es)?[:\s]*([^.]+)/gi,
    /missing[:\s]*([^.]+)/gi,
    /needs improvement[:\s]*([^.]+)/gi,
  ];

  for (const pattern of weaknessPatterns) {
    const match = evaluationText.match(pattern);
    if (match) {
      identifiedWeaknesses.push(match[1].trim());
    }
  }

  // Extract strengths from evaluation text
  const strengths: string[] = [];
  const strengthPatterns = [
    /strength(?:s)?[:\s]*([^.]+)/gi,
    /good[:\s]*([^.]+)/gi,
    /well[- ]done[:\s]*([^.]+)/gi,
  ];

  for (const pattern of strengthPatterns) {
    const match = evaluationText.match(pattern);
    if (match) {
      strengths.push(match[1].trim());
    }
  }

  // Determine last focused section based on content
  const sections = ['Headline', 'Bio', 'Skills', 'Projects', 'Experience', 'Education', 'Links'];
  let lastFocusedSection: string | null = null;
  for (const section of sections) {
    if (lowerEvaluation.includes(section.toLowerCase())) {
      lastFocusedSection = section;
    }
  }

  // Extract career goal if mentioned
  const careerGoalMatch = evaluationText.match(/career goal[:\s]*([^.]+)/gi);
  const careerGoal = careerGoalMatch ? careerGoalMatch[1].trim() : null;

  return {
    reviewedSections: sections,
    identifiedWeaknesses,
    strengths,
    lastFocusedSection,
    careerGoal,
    auditGenerated: true,
  };
}

/**
 * Gets or creates a chat session for the user
 * Returns the session and whether it was newly created
 */
async function getOrCreateChatSession(
  userId: string,
  evaluationId: string | null
): Promise<{ session: ChatSessionData; isNew: boolean }> {
  if (evaluationId) {
    // Try to find existing session for this evaluation, ordered by most recent
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        userId,
        evaluationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingSession) {
      return {
        session: {
          id: existingSession.id,
          userId: existingSession.userId,
          evaluationId: existingSession.evaluationId,
          messages: (existingSession.messages as unknown as ChatMessage[]) || [],
          createdAt: existingSession.createdAt,
        },
        isNew: false,
      };
    }

    // Create new session linked to evaluation
    const newSession = await prisma.chatSession.create({
      data: {
        userId,
        evaluationId,
        messages: [],
      },
    });

    return {
      session: {
        id: newSession.id,
        userId: newSession.userId,
        evaluationId: newSession.evaluationId,
        messages: [],
        createdAt: newSession.createdAt,
      },
      isNew: true,
    };
  }

  // Create standalone session without evaluation
  // First check if there's an existing session without evaluation
  const existingStandaloneSession = await prisma.chatSession.findFirst({
    where: {
      userId,
      evaluationId: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingStandaloneSession) {
    return {
      session: {
        id: existingStandaloneSession.id,
        userId: existingStandaloneSession.userId,
        evaluationId: existingStandaloneSession.evaluationId,
        messages: (existingStandaloneSession.messages as unknown as ChatMessage[]) || [],
        createdAt: existingStandaloneSession.createdAt,
      },
      isNew: false,
    };
  }

  const newSession = await prisma.chatSession.create({
    data: {
      userId,
      messages: [],
    },
  });

  return {
    session: {
      id: newSession.id,
      userId: newSession.userId,
      evaluationId: newSession.evaluationId,
      messages: [],
      createdAt: newSession.createdAt,
    },
    isNew: true,
  };
}

/**
 * Parses OpenAI response to extract text content
 * Handles different response formats from the API
 */
function parseOpenAIResponse(response: unknown): string {
  const responseObj = response as {
    output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
  };

  const textParts: string[] = [];
  for (const item of responseObj.output ?? []) {
    // Check if item has content property
    if ('content' in item && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part.type === "output_text" && typeof part.text === "string") {
          textParts.push(part.text);
        }
      }
    }
  }

  return textParts.join(" ") || "No response text found.";
}

/**
 * Generates a simple chat response without portfolio context
 * Used when no evaluation is available
 */
async function generateSimpleChatResponse(
  message: string,
  sessionMessages: ChatMessage[]
): Promise<string> {
  // Build conversation history for context
  const recentMessages = sessionMessages.slice(-6); // Last 3 exchanges
  const historyText = recentMessages
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const simplePrompt = `You are Linky, a friendly AI career advisor helping students improve their portfolios.

## YOUR ROLE:
- Answer ONLY what the student asks
- Keep replies short and actionable
- Provide examples only if relevant to their question
- Ask one clarifying question if needed to give better advice

## TONE:
- Professional
- Supportive
- Direct
- Not academic

## STRICT RULES:
- Answer ONLY the specific question asked
- Keep response under 5 lines if possible
- Use code blocks for any examples
- No long explanations
- No filler sentences
- If you need more info, ask ONE clarifying question
- Be direct and actionable

## CONVERSATION HISTORY:
${historyText}

## STUDENT QUESTION:
${message}`;

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: simplePrompt,
    });

    return parseOpenAIResponse(response);
  } catch (error) {
    console.error("OpenAI API error in simple chat:", error);
    throw new Error("Failed to generate response from AI");
  }
}

// ============================================================================
// MAIN API ROUTE
// ============================================================================

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to access the AI assistant." },
        { status: 401 }
      );
    }

    // Validate OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in server environment" },
        { status: 500 }
      );
    }

    // Validate request size (max 10KB)
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 10240) {
      return NextResponse.json(
        { error: "Request payload too large. Maximum 10KB allowed." },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body: ChatRequestBody = await req.json();
    const { mode, message, evaluationId } = body;

    if (mode !== "CHAT_ADVISOR") {
      return NextResponse.json(
        { error: "Invalid mode. Expected 'CHAT_ADVISOR'." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Invalid request: 'message' field is required and must be a string." },
        { status: 400 }
      );
    }

    // Get or create chat session
    const { session } = await getOrCreateChatSession(userId, evaluationId || null);

    // Get evaluation context if available
    let portfolioData: PortfolioData | null = null;
    let memory: StudentMemory | null = null;

    if (session.evaluationId) {
      const evaluation = await prisma.evaluation.findUnique({
        where: { id: session.evaluationId },
      });

      if (evaluation) {
        try {
          portfolioData = evaluation.portfolioData as unknown as PortfolioData;
          memory = evaluationToMemory(evaluation.result as unknown as EvaluationResult);
        } catch (error) {
          console.error("Error parsing evaluation data:", error);
          // Continue without portfolio context if parsing fails
        }
      }
    }

    let responseText: string;

    // Generate response based on available context
    if (!portfolioData || !memory) {
      // Simple chat response without portfolio context
      responseText = await generateSimpleChatResponse(message, session.messages);
    } else {
      // Generate chat response with portfolio context
      responseText = await generateChatAdvisorResponse(
        portfolioData,
        memory,
        message,
        openai
      );
    }

    // Store messages in session using transaction for data integrity
    await prisma.$transaction(async (tx) => {
      // Add user message
      const currentSession = await tx.chatSession.findUnique({
        where: { id: session.id },
      });

      if (!currentSession) {
        throw new Error("Session not found");
      }

      const messages = (currentSession.messages as unknown as ChatMessage[]) || [];
      messages.push({
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      });

      messages.push({
        role: "assistant",
        content: responseText,
        timestamp: new Date().toISOString(),
      });

      await tx.chatSession.update({
        where: { id: session.id },
        data: { messages: messages as unknown as Prisma.InputJsonValue },
      });
    });

    return NextResponse.json({
      success: true,
      response: responseText,
    });

  } catch (error) {
    console.error("Chat error:", error);

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (error.name === "AbortError" || errorMessage.includes("timeout")) {
        return NextResponse.json(
          { error: "AI request timed out. Please try again." },
          { status: 504 }
        );
      }

      if (errorMessage.includes("api key") || errorMessage.includes("authentication")) {
        return NextResponse.json(
          { error: "Invalid OpenAI API configuration." },
          { status: 500 }
        );
      }

      if (errorMessage.includes("rate limit") || errorMessage.includes("quota")) {
        return NextResponse.json(
          { error: "AI service rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      if (errorMessage.includes("invalid request") || errorMessage.includes("validation")) {
        return NextResponse.json(
          { error: "Invalid request to AI service." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to get response from AI. Please try again." },
      { status: 500 }
    );
  }
}
