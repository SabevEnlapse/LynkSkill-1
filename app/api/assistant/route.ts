import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { readFileSync } from "fs";
import { join } from "path";
import {
  generatePortfolioAudit,
  generateChatAdvisorResponse,
  StudentMemory,
  ConversationMessage,
  extractInsightsFromAudit
} from "./prompts";

// PRODUCTION FIX: Force read .env to bypass stale cache
function getApiKey(): string | null {
    try {
        const envPath = join(process.cwd(), '.env');
        const envContent = readFileSync(envPath, 'utf-8');
        const match = envContent.match(/^OPENAI_API_KEY=(.+)$/m);
        return match ? match[1].replace(/["']/g, '') : process.env.OPENAI_API_KEY || null;
    } catch {
        return process.env.OPENAI_API_KEY || null;
    }
}

const apiKey = getApiKey();
const openai = apiKey ? new OpenAI({ apiKey, timeout: 60000 }) : ({} as OpenAI);

// Enhanced In-Memory Cache for Session Context with Conversation History
const memoryCache = new Map<string, {
    memory: StudentMemory;
    conversation: ConversationMessage[];
    timestamp: number;
}>();

// Clean up old sessions (older than 2 hours)
setInterval(() => {
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    for (const [userId, data] of memoryCache.entries()) {
        if (now - data.timestamp > twoHours) {
            memoryCache.delete(userId);
        }
    }
}, 60 * 60 * 1000); // Run every hour

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!apiKey) return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });

        const body = await req.json();
        const { message, portfolio, resetChat } = body;

        // Get or initialize session data
        let sessionData = memoryCache.get(userId);
        
        if (!sessionData || resetChat) {
            sessionData = {
                memory: {
                    reviewedSections: [],
                    identifiedWeaknesses: [],
                    strengths: [],
                    lastFocusedSection: null,
                    careerGoal: null,
                    auditGenerated: false,
                    improvementSuggestions: [],
                    questionsAsked: [],
                    topicsDiscussed: []
                },
                conversation: [],
                timestamp: Date.now()
            };
        }

        let reply: string;
        let mode = 'PORTFOLIO_AUDIT';

        // Handle chat mode after audit is generated
        if (message && sessionData.memory.auditGenerated) {
            mode = 'CHAT_ADVISOR';
            
            // Add user message to conversation history
            sessionData.conversation.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });
            
            // Track questions asked for memory
            sessionData.memory.questionsAsked.push(message);
            
            // Generate response with full conversation context
            reply = await generateChatAdvisorResponse(
                portfolio,
                sessionData.memory,
                sessionData.conversation,
                openai
            );
            
            // Add assistant response to conversation
            sessionData.conversation.push({
                role: 'assistant',
                content: reply,
                timestamp: new Date().toISOString()
            });
            
            // Update timestamp
            sessionData.timestamp = Date.now();
            
        } else {
            // Generate initial portfolio audit
            mode = 'PORTFOLIO_AUDIT';
            reply = await generatePortfolioAudit(portfolio, openai);
            
            // Extract insights from the audit to build memory
            const insights = await extractInsightsFromAudit(reply, openai);
            
            // Update memory with extracted insights
            sessionData.memory.auditGenerated = true;
            sessionData.memory.identifiedWeaknesses = insights.weaknesses || [];
            sessionData.memory.strengths = insights.strengths || [];
            sessionData.memory.improvementSuggestions = insights.suggestions || [];
            sessionData.memory.reviewedSections = insights.sections || [];
            
            // Add the audit as the first assistant message
            sessionData.conversation.push({
                role: 'assistant',
                content: reply,
                timestamp: new Date().toISOString()
            });
            
            sessionData.timestamp = Date.now();
        }

        // Save updated session data
        memoryCache.set(userId, sessionData);
        
        return NextResponse.json({
            reply,
            mode,
            conversation: sessionData.conversation,
            memory: sessionData.memory
        });

    } catch (error) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: "AI Service Unavailable" }, { status: 500 });
    }
}
