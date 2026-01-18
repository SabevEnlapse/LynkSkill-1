import OpenAI from 'openai';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PortfolioData {
  fullName: string;
  headline?: string | null;
  bio?: string | null;
  skills?: string | null;
  projects?: string | null;
  experience?: string | null;
  education?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolioUrl?: string | null;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface StudentMemory {
  reviewedSections: string[];
  identifiedWeaknesses: string[];
  strengths: string[];
  lastFocusedSection: string | null;
  careerGoal: string | null;
  auditGenerated: boolean;
  improvementSuggestions: string[];
  questionsAsked: string[];
  topicsDiscussed: string[];
}

export type AssistantMode = 'PORTFOLIO_AUDIT' | 'CHAT_ADVISOR';

// ============================================================================
// ENHANCED PROMPTS WITH BETTER MEMORY AND PERSONALITY
// ============================================================================

export const PORTFOLIO_AUDIT_PROMPT = `You are Linky, a friendly and expert AI career advisor for LynkSkill. You're helping students aged 16-22 build impressive portfolios that land internships.

## YOUR PERSONALITY:
- Encouraging but honest - you give real feedback, not just praise
- Use casual but professional language (not academic)
- Add occasional emojis to be friendly 💡
- Be specific and actionable in all feedback
- Celebrate what they're doing well before addressing gaps

## STUDENT PORTFOLIO DATA:
**Name:** {{fullName}}
**Headline:** {{headline}}
**Bio:** {{bio}}
**Skills:** {{skills}}
**Projects:** {{projects}}
**Experience:** {{experience}}
**Education:** {{education}}

## YOUR TASK:
Provide a comprehensive but digestible portfolio audit. Be specific about what's working and what needs improvement.

## REQUIRED OUTPUT FORMAT:

### 🎯 Portfolio Overview
A 2-3 sentence summary of the overall impression. What stands out? What's the biggest opportunity for improvement?

### 📝 Headline
**What's working:** [Specific positives - be genuine, not generic]
**What needs work:** [Specific gaps or issues]
**Suggested improvement:**
\`\`\`
[Write an improved headline example that's specific to their skills/goals]
\`\`\`

### 👤 Bio
**What's working:** [Specific positives]
**What needs work:** [Specific gaps]
**Suggested improvement:**
\`\`\`
[Write a compelling bio example tailored to their background]
\`\`\`

### 💼 Projects
**What's working:** [Specific positives about their projects]
**What needs work:** [Missing details, weak descriptions, etc.]
**Suggested improvement:**
\`\`\`
[Show how to describe one project more effectively]
\`\`\`

### 🚀 Quick Wins (Top 3 Actions)
1. [Most impactful change they can make TODAY]
2. [Second priority improvement]
3. [Third priority improvement]

## RULES:
- Be specific to THEIR portfolio, not generic advice
- If a section is empty, acknowledge it and explain why it matters
- Every example you provide should be personalized to their actual data
- Keep the tone supportive but real
- Use markdown formatting for readability
- End with an encouraging note that invites questions`;

export const CHAT_ADVISOR_PROMPT = `You are Linky, a friendly AI career advisor on LynkSkill. You've been chatting with this student about their portfolio.

## YOUR PERSONALITY:
- Warm, supportive, but direct
- Give actionable advice, not fluffy encouragement
- Remember what you've discussed (use the conversation history!)
- Ask follow-up questions when helpful
- Use casual language, occasional emojis
- Be like a helpful mentor, not a formal advisor

## STUDENT'S PORTFOLIO:
**Name:** {{fullName}}
**Headline:** {{headline}}
**Bio:** {{bio}}
**Skills:** {{skills}}
**Projects:** {{projects}}
**Experience:** {{experience}}
**Education:** {{education}}
**LinkedIn:** {{linkedin}}
**GitHub:** {{github}}

## WHAT YOU KNOW ABOUT THEM (Memory):
**Strengths identified:** {{strengths}}
**Areas to improve:** {{identifiedWeaknesses}}
**Suggestions given:** {{improvementSuggestions}}
**Topics discussed:** {{topicsDiscussed}}
**Career goal:** {{careerGoal}}

## CONVERSATION SO FAR:
{{conversationHistory}}

## CURRENT QUESTION:
{{message}}

## HOW TO RESPOND:

1. **Reference what you know**: Use the conversation history and memory to give contextual responses. If they asked about bio before, connect your answer to that.

2. **Be specific**: If they ask "how to improve my projects", give them a concrete example based on THEIR actual projects.

3. **Provide examples when helpful**: Use code blocks for suggested text:
\`\`\`
Example suggestion here
\`\`\`

4. **Keep it focused**: Answer their specific question. Don't dump everything at once.

5. **Encourage follow-ups**: End with a related suggestion or question when natural.

## RESPONSE RULES:
- Max 150 words unless they ask for detailed examples
- Always be specific to their situation
- If they seem stuck, ask ONE clarifying question
- Don't repeat advice you've already given (check conversation history)
- If they ask about something not in their portfolio, offer to help them add it
- Be encouraging but genuine`;

export function formatPortfolioAuditPrompt(portfolioData: PortfolioData): string {
  return PORTFOLIO_AUDIT_PROMPT
    .replace('{{fullName}}', portfolioData.fullName || 'Student')
    .replace('{{headline}}', portfolioData.headline || 'Not provided')
    .replace('{{bio}}', portfolioData.bio || 'Not provided')
    .replace('{{skills}}', portfolioData.skills || 'Not provided')
    .replace('{{projects}}', portfolioData.projects || 'Not provided')
    .replace('{{experience}}', portfolioData.experience || 'Not provided')
    .replace('{{education}}', portfolioData.education || 'Not provided');
}

export function formatChatAdvisorPrompt(
  portfolioData: PortfolioData,
  memory: StudentMemory,
  conversation: ConversationMessage[],
  message: string
): string {
  // Build rich conversation history with context
  const conversationHistory = conversation
    .slice(-10) // Keep last 10 messages for better context
    .map(msg => {
      const role = msg.role === 'user' ? '**Student**' : '**Linky**';
      return `${role}: ${msg.content}`;
    })
    .join('\n\n');

  // Build topics discussed from questions
  const topicsDiscussed = memory.topicsDiscussed.length > 0 
    ? memory.topicsDiscussed.join(', ')
    : memory.questionsAsked.slice(-5).join(' | ') || 'Initial conversation';

  return CHAT_ADVISOR_PROMPT
    .replace('{{fullName}}', portfolioData.fullName || 'Student')
    .replace('{{headline}}', portfolioData.headline || 'Not set')
    .replace('{{bio}}', portfolioData.bio || 'Not set')
    .replace('{{skills}}', portfolioData.skills || 'Not listed')
    .replace('{{projects}}', portfolioData.projects || 'None added yet')
    .replace('{{experience}}', portfolioData.experience || 'Not listed')
    .replace('{{education}}', portfolioData.education || 'Not listed')
    .replace('{{linkedin}}', portfolioData.linkedin || 'Not linked')
    .replace('{{github}}', portfolioData.github || 'Not linked')
    .replace('{{strengths}}', memory.strengths.length > 0 ? memory.strengths.join(', ') : 'Not analyzed yet')
    .replace('{{identifiedWeaknesses}}', memory.identifiedWeaknesses.length > 0 ? memory.identifiedWeaknesses.join(', ') : 'Not analyzed yet')
    .replace('{{improvementSuggestions}}', memory.improvementSuggestions.length > 0 ? memory.improvementSuggestions.join(', ') : 'None given yet')
    .replace('{{topicsDiscussed}}', topicsDiscussed)
    .replace('{{careerGoal}}', memory.careerGoal || 'Not mentioned yet')
    .replace('{{conversationHistory}}', conversationHistory || 'This is the start of the conversation')
    .replace('{{message}}', message);
}

/**
 * Parses OpenAI response to extract text content
 */
function parseOpenAIResponse(response: unknown): string {
  const responseObj = response as {
    output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
  };

  const textParts: string[] = [];
  for (const item of responseObj.output ?? []) {
    if ('content' in item && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part.type === "output_text" && typeof part.text === "string") {
          textParts.push(part.text);
        }
      }
    }
  }

  return textParts.join(" ") || "No response generated.";
}

export async function generatePortfolioAudit(
  portfolioData: PortfolioData, 
  openai: OpenAI
): Promise<string> {
  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: formatPortfolioAuditPrompt(portfolioData),
    });
    return parseOpenAIResponse(response);
  } catch (error) {
    console.error("Error generating portfolio audit:", error);
    throw new Error("Failed to generate portfolio audit");
  }
}

export async function generateChatAdvisorResponse(
  portfolioData: PortfolioData,
  memory: StudentMemory,
  conversationOrMessage: ConversationMessage[] | string,
  openai: OpenAI
): Promise<string> {
  // Handle both array (full conversation) and string (single message) inputs
  let conversationHistory: ConversationMessage[];
  let currentMessage: string;

  if (Array.isArray(conversationOrMessage)) {
    // Full conversation array passed - extract last user message
    conversationHistory = conversationOrMessage;
    const lastUserMessage = conversationHistory.filter(m => m.role === 'user').pop();
    currentMessage = lastUserMessage?.content || '';
  } else {
    // Single message string passed - build history from memory
    currentMessage = conversationOrMessage;
    conversationHistory = memory.questionsAsked.map((q, i) => ({
      role: 'user' as const,
      content: q,
      timestamp: new Date(Date.now() - (memory.questionsAsked.length - i) * 60000).toISOString()
    }));
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: formatChatAdvisorPrompt(portfolioData, memory, conversationHistory, currentMessage),
    });
    return parseOpenAIResponse(response);
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw new Error("Failed to generate chat response");
  }
}

export const INSIGHT_EXTRACTION_PROMPT = `Analyze this portfolio audit and extract structured insights.

## AUDIT CONTENT:
{{auditContent}}

## EXTRACT INTO JSON:
Return ONLY valid JSON with this exact structure:
{
  "weaknesses": ["specific weakness 1", "specific weakness 2", ...],
  "strengths": ["specific strength 1", "specific strength 2", ...],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", ...],
  "sections": ["Headline", "Bio", "Projects", ...],
  "careerGoal": "extracted career goal if mentioned, or null"
}

## RULES:
- Extract 3-5 items per category minimum
- Be specific, not generic (e.g., "bio is too short" not just "bio needs work")
- Include the actual sections that were reviewed
- Return ONLY the JSON object, no other text`;

export function formatInsightExtractionPrompt(auditContent: string): string {
  return INSIGHT_EXTRACTION_PROMPT.replace('{{auditContent}}', auditContent);
}

export async function extractInsightsFromAudit(
  auditContent: string, 
  openai: OpenAI
): Promise<{
  weaknesses: string[];
  strengths: string[];
  suggestions: string[];
  sections: string[];
  careerGoal: string | null;
}> {
  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: formatInsightExtractionPrompt(auditContent),
    });
    
    const content = parseOpenAIResponse(response);
    
    // Try to parse JSON, handle potential markdown code blocks
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    
    const insights = JSON.parse(jsonStr);
    
    return {
      weaknesses: insights.weaknesses || [],
      strengths: insights.strengths || [],
      suggestions: insights.suggestions || [],
      sections: insights.sections || ['Headline', 'Bio', 'Projects'],
      careerGoal: insights.careerGoal || null
    };
  } catch (error) {
    console.error("Error extracting insights:", error);
    return {
      weaknesses: [],
      strengths: [],
      suggestions: [],
      sections: ['Headline', 'Bio', 'Projects'],
      careerGoal: null
    };
  }
}
