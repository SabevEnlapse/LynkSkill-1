import OpenAI from 'openai';

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

export const PORTFOLIO_AUDIT_PROMPT = `You are a professional career advisor helping students (ages 16-22) improve their portfolios.
## REQUIRED OUTPUT FORMAT:
### Portfolio Summary
One short paragraph highlighting clear strengths and gaps.
### Headline
What is good: [1-2 lines]
What is missing: [1-2 lines]
Improved example: \`\`\`[Example]\`\`\`
### Bio
What is good: [1-2 lines]
What is missing: [1-2 lines]
Improved example: \`\`\`[Example]\`\`\`
### Projects
What is good: [1-2 lines]
What is missing: [1-2 lines]
Improved example: \`\`\`[Example]\`\`\`
## STUDENT DATA: {{fullName}}, {{headline}}, {{bio}}, {{projects}}
## RULES: Use Markdown. Be direct. No filler.`;

export const CHAT_ADVISOR_PROMPT = `You are Linky, a friendly AI career advisor helping students improve their portfolios. You have already audited this portfolio and have been chatting with the student.

## STUDENT PORTFOLIO DATA:
Name: {{fullName}}
Headline: {{headline}}
Bio: {{bio}}
Skills: {{skills}}
Projects: {{projects}}
Experience: {{experience}}
Education: {{education}}

## PORTFOLIO AUDIT INSIGHTS:
Identified Weaknesses: {{identifiedWeaknesses}}
Strengths: {{strengths}}
Improvement Suggestions: {{improvementSuggestions}}
Reviewed Sections: {{reviewedSections}}

## CONVERSATION HISTORY:
{{conversationHistory}}

## YOUR ROLE:
You are a helpful, encouraging, and knowledgeable career advisor. Your goal is to help the student improve their portfolio step by step.

## RULES:
1. Answer the student's specific question directly and thoughtfully
2. Reference the portfolio audit insights when relevant
3. Consider the conversation history to maintain context
4. Be supportive but professional - you're talking to students aged 16-22
5. Provide actionable, specific advice
6. If the student asks about something not covered in the audit, provide general guidance
7. Keep responses concise but comprehensive (3-6 sentences typically)
8. Use markdown formatting for better readability
9. Track what topics you've discussed to avoid repetition

## CURRENT QUESTION: {{message}}`;

export function formatPortfolioAuditPrompt(portfolioData: PortfolioData): string {
  // Simple mapping of data to prompt
  return PORTFOLIO_AUDIT_PROMPT
    .replace('{{fullName}}', portfolioData.fullName)
    .replace('{{headline}}', portfolioData.headline || 'Not provided')
    .replace('{{bio}}', portfolioData.bio || 'Not provided')
    .replace('{{projects}}', portfolioData.projects || 'Not provided');
}

export function formatChatAdvisorPrompt(
  portfolioData: PortfolioData,
  memory: StudentMemory,
  conversation: ConversationMessage[],
  message: string
): string {
  // Format conversation history for the prompt
  const conversationHistory = conversation
    .slice(-6) // Keep last 6 messages for context
    .map(msg => `${msg.role === 'user' ? 'Student' : 'Linky'}: ${msg.content}`)
    .join('\n');

  return CHAT_ADVISOR_PROMPT
    .replace('{{fullName}}', portfolioData.fullName || 'Not provided')
    .replace('{{headline}}', portfolioData.headline || 'Not provided')
    .replace('{{bio}}', portfolioData.bio || 'Not provided')
    .replace('{{skills}}', portfolioData.skills || 'Not provided')
    .replace('{{projects}}', portfolioData.projects || 'Not provided')
    .replace('{{experience}}', portfolioData.experience || 'Not provided')
    .replace('{{education}}', portfolioData.education || 'Not provided')
    .replace('{{identifiedWeaknesses}}', memory.identifiedWeaknesses.join(', ') || 'None identified')
    .replace('{{strengths}}', memory.strengths.join(', ') || 'None identified')
    .replace('{{improvementSuggestions}}', memory.improvementSuggestions.join(', ') || 'None yet')
    .replace('{{reviewedSections}}', memory.reviewedSections.join(', ') || 'None yet')
    .replace('{{conversationHistory}}', conversationHistory || 'No previous conversation')
    .replace('{{message}}', message);
}

export async function generatePortfolioAudit(portfolioData: PortfolioData, openai: OpenAI): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: formatPortfolioAuditPrompt(portfolioData),
  });
  // Access the text content from the response structure
  const output = response.output?.[0];
  if (output && 'content' in output && Array.isArray(output.content) && output.content[0] && 'text' in output.content[0]) {
    return output.content[0].text;
  }
  return "No response generated.";
}

export async function generateChatAdvisorResponse(
  portfolioData: PortfolioData,
  memory: StudentMemory,
  conversation: ConversationMessage[],
  openai: OpenAI
): Promise<string> {
  const lastMessage = conversation[conversation.length - 1];
  const userMessage = lastMessage?.role === 'user' ? lastMessage.content : '';
  
  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: formatChatAdvisorPrompt(portfolioData, memory, conversation, userMessage),
  });
  // Access the text content from the response structure
  const output = response.output?.[0];
  if (output && 'content' in output && Array.isArray(output.content) && output.content[0] && 'text' in output.content[0]) {
    return output.content[0].text;
  }
  return "No response generated.";
}

export const INSIGHT_EXTRACTION_PROMPT = `You are analyzing a portfolio audit to extract structured insights.

## PORTFOLIO AUDIT:
{{auditContent}}

## TASK:
Extract the following information from the audit and return ONLY valid JSON:
{
  "weaknesses": ["list of identified weaknesses"],
  "strengths": ["list of identified strengths"],
  "suggestions": ["list of improvement suggestions"],
  "sections": ["list of portfolio sections reviewed"]
}

## RULES:
- Return ONLY valid JSON, no other text
- If a category has no items, return an empty array
- Extract at least 3-5 items per category if available
- Be specific and concise`;

export function formatInsightExtractionPrompt(auditContent: string): string {
  return INSIGHT_EXTRACTION_PROMPT.replace('{{auditContent}}', auditContent);
}

export async function extractInsightsFromAudit(auditContent: string, openai: OpenAI): Promise<{
  weaknesses: string[];
  strengths: string[];
  suggestions: string[];
  sections: string[];
}> {
  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: formatInsightExtractionPrompt(auditContent),
    });
    
    // Access the text content from the response structure
    const output = response.output?.[0];
    let content = "{}";
    if (output && 'content' in output && Array.isArray(output.content) && output.content[0] && 'text' in output.content[0]) {
      content = output.content[0].text;
    }
    
    // Try to parse JSON, handle potential markdown code blocks
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    
    const insights = JSON.parse(jsonStr);
    
    return {
      weaknesses: insights.weaknesses || [],
      strengths: insights.strengths || [],
      suggestions: insights.suggestions || [],
      sections: insights.sections || []
    };
  } catch (error) {
    console.error("Error extracting insights:", error);
    return {
      weaknesses: [],
      strengths: [],
      suggestions: [],
      sections: []
    };
  }
}
