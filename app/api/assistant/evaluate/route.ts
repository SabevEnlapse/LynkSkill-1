import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import {
  generatePortfolioAudit,
  PortfolioData,
} from "../prompts";
import { Prisma } from "@prisma/client";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Request body for the evaluation endpoint
 */
interface EvaluationRequestBody {
  mode: string;
  portfolioData: PortfolioData;
}

/**
 * Evaluation result structure stored in database
 */
interface EvaluationResult {
  evaluation: string;
  generatedAt: string;
}

/**
 * API response structure
 */
interface EvaluationResponse {
  success: boolean;
  evaluation?: string;
  evaluationId?: string;
  error?: string;
}

/**
 * Error types for better error handling
 */
enum EvaluationErrorType {
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_REQUEST = "INVALID_REQUEST",
  API_KEY_MISSING = "API_KEY_MISSING",
  EVALUATION_EXISTS = "EVALUATION_EXISTS",
  OPENAI_TIMEOUT = "OPENAI_TIMEOUT",
  OPENAI_API_ERROR = "OPENAI_API_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Custom error class for evaluation errors
 */
class EvaluationError extends Error {
  constructor(
    public type: EvaluationErrorType,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "EvaluationError";
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates the request body structure
 */
function validateRequestBody(body: unknown): body is EvaluationRequestBody {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const { mode, portfolioData } = body as Partial<EvaluationRequestBody>;

  if (typeof mode !== "string") {
    return false;
  }

  if (typeof portfolioData !== "object" || portfolioData === null) {
    return false;
  }

  const pd = portfolioData as Partial<PortfolioData>;
  if (typeof pd.fullName !== "string" || pd.fullName.trim() === "") {
    return false;
  }

  return true;
}

/**
 * Validates the mode is PORTFOLIO_AUDIT
 */
function validateMode(mode: string): void {
  if (mode !== "PORTFOLIO_AUDIT") {
    throw new EvaluationError(
      EvaluationErrorType.INVALID_REQUEST,
      "Invalid mode. Expected 'PORTFOLIO_AUDIT'.",
      400
    );
  }
}

/**
 * Validates portfolio data structure
 */
function validatePortfolioData(portfolioData: PortfolioData): void {
  if (!portfolioData.fullName || typeof portfolioData.fullName !== "string") {
    throw new EvaluationError(
      EvaluationErrorType.INVALID_REQUEST,
      "Invalid request: 'portfolioData.fullName' is required and must be a string.",
      400
    );
  }
}

/**
 * Validates request size to prevent large payloads
 */
function validateRequestSize(req: Request): void {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 10240) {
    throw new EvaluationError(
      EvaluationErrorType.INVALID_REQUEST,
      "Request payload too large. Maximum 10KB allowed.",
      400
    );
  }
}

// ============================================================================
// DATABASE FUNCTIONS
// ============================================================================

/**
 * Checks if an evaluation already exists for the user
 */
async function checkExistingEvaluation(userId: string): Promise<boolean> {
  try {
    const existing = await prisma.evaluation.findFirst({
      where: { userId },
      select: { id: true },
    });
    return existing !== null;
  } catch (error) {
    console.error("Error checking existing evaluation:", error);
    throw new EvaluationError(
      EvaluationErrorType.DATABASE_ERROR,
      "Failed to check existing evaluation.",
      500
    );
  }
}

/**
 * Stores evaluation result in database asynchronously
 * This runs after the response is sent to the client
 */
async function storeEvaluationAsync(
  userId: string,
  portfolioData: PortfolioData,
  evaluationResult: string
): Promise<void> {
  try {
    const result: EvaluationResult = {
      evaluation: evaluationResult,
      generatedAt: new Date().toISOString(),
    };

    await prisma.evaluation.create({
      data: {
        userId,
        portfolioData: portfolioData as unknown as Prisma.InputJsonValue,
        result: result as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.error("Error storing evaluation asynchronously:", error);
    // Don't throw - this is a background operation
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Converts errors to appropriate HTTP responses
 */
function handleError(error: unknown): NextResponse<EvaluationResponse> {
  console.error("Evaluation error:", error);

  // Handle custom EvaluationError
  if (error instanceof EvaluationError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: error.statusCode }
    );
  }

  // Handle OpenAI timeout errors
  if (error instanceof Error) {
    if (error.name === "AbortError" || error.message.includes("timeout")) {
      return NextResponse.json(
        {
          success: false,
          error: "AI request timed out. Please try again.",
        },
        { status: 504 }
      );
    }

    if (error.message.includes("API key")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid OpenAI API configuration.",
        },
        { status: 500 }
      );
    }
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      success: false,
      error: "Failed to generate evaluation. Please try again.",
    },
    { status: 500 }
  );
}

// ============================================================================
// MAIN ROUTE HANDLER
// ============================================================================

export async function POST(req: Request): Promise<NextResponse<EvaluationResponse>> {
  try {
    // -----------------------------------------------------------------------
    // STEP 1: Authentication
    // -----------------------------------------------------------------------
    const { userId } = await auth();
    if (!userId) {
      throw new EvaluationError(
        EvaluationErrorType.UNAUTHORIZED,
        "Unauthorized: Please sign in to access the AI assistant.",
        401
      );
    }

    // -----------------------------------------------------------------------
    // STEP 2: Environment validation
    // -----------------------------------------------------------------------
    if (!process.env.OPENAI_API_KEY) {
      throw new EvaluationError(
        EvaluationErrorType.API_KEY_MISSING,
        "Missing OPENAI_API_KEY in server environment",
        500
      );
    }

    // -----------------------------------------------------------------------
    // STEP 3: Request validation
    // -----------------------------------------------------------------------
    validateRequestSize(req);

    const body = await req.json();

    if (!validateRequestBody(body)) {
      throw new EvaluationError(
        EvaluationErrorType.INVALID_REQUEST,
        "Invalid request body structure.",
        400
      );
    }

    const { mode, portfolioData } = body;

    validateMode(mode);
    validatePortfolioData(portfolioData);

    // -----------------------------------------------------------------------
    // STEP 4: Check for existing evaluation (one-time only)
    // -----------------------------------------------------------------------
    const hasExistingEvaluation = await checkExistingEvaluation(userId);
    if (hasExistingEvaluation) {
      throw new EvaluationError(
        EvaluationErrorType.EVALUATION_EXISTS,
        "Evaluation already exists for this user. Each user can only have one evaluation.",
        409
      );
    }

    // -----------------------------------------------------------------------
    // STEP 5: Generate portfolio audit using OpenAI
    // -----------------------------------------------------------------------
    const evaluationResult = await generatePortfolioAudit(portfolioData, openai);

    // -----------------------------------------------------------------------
    // STEP 6: Return response immediately (before DB write)
    // -----------------------------------------------------------------------
    const response = NextResponse.json({
      success: true,
      evaluation: evaluationResult,
    } as EvaluationResponse);

    // -----------------------------------------------------------------------
    // STEP 7: Store evaluation asynchronously (after response is sent)
    // -----------------------------------------------------------------------
    // This runs in the background and doesn't block the response
    storeEvaluationAsync(userId, portfolioData, evaluationResult).catch(
      (error) => {
        console.error("Async evaluation storage failed:", error);
      }
    );

    return response;

  } catch (error) {
    return handleError(error);
  }
}
