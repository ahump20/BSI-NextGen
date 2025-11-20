/**
 * AI-Powered Content Analyzer
 *
 * Uses Cloudflare Workers AI to analyze sports content and extract:
 * - Category (news, analysis, rumor, injury, trade)
 * - Sentiment (positive, neutral, negative)
 * - Topics and entities (teams, players, coaches, keywords)
 * - Trending score
 */

import type { AIAnalysisResult } from '../types';

export class ContentAnalyzer {
  private ai: Ai;

  constructor(ai: Ai) {
    this.ai = ai;
  }

  /**
   * Analyze article content with AI
   */
  async analyze(title: string, content: string, leagueId?: string): Promise<AIAnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(title, content, leagueId);

      const response = await this.ai.run('@cf/meta/llama-3-8b-instruct', {
        prompt,
        max_tokens: 512,
      });

      return this.parseAIResponse(response);
    } catch (error) {
      console.error('[Content Analyzer] AI analysis failed:', error);
      return this.getFallbackAnalysis(title, content);
    }
  }

  /**
   * Build structured prompt for AI analysis
   */
  private buildAnalysisPrompt(title: string, content: string, leagueId?: string): string {
    // Clean and truncate content to fit token limits
    const cleanContent = this.cleanContent(content).slice(0, 2000);
    const league = leagueId ? ` in ${leagueId.toUpperCase()}` : '';

    return `Analyze this sports article${league} and provide a JSON response with the following fields:

Article Title: ${title}

Article Content: ${cleanContent}

Provide your analysis as valid JSON:
{
  "category": "news|analysis|rumor|injury|trade|other",
  "sentiment": "positive|neutral|negative",
  "trending_score": 0-100,
  "topics": [
    {"type": "team|player|coach|keyword", "value": "name", "confidence": 0-100}
  ]
}

Guidelines:
- category: Classify the article type (news=factual report, analysis=opinion/stats, rumor=speculation, injury=player health, trade=roster moves)
- sentiment: Overall tone (positive=optimistic/good news, neutral=factual, negative=criticism/bad news)
- trending_score: How likely this will trend (0-100, consider recency, importance, controversy)
- topics: Extract all mentioned teams, players, coaches as separate entries with confidence scores
- Include up to 10 most relevant topics

Respond ONLY with valid JSON, no other text.`;
  }

  /**
   * Parse AI response into structured result
   */
  private parseAIResponse(response: any): AIAnalysisResult {
    try {
      // Extract JSON from AI response
      const text = response.response || JSON.stringify(response);

      // Find JSON block (handles cases where AI adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize the response
      return {
        category: this.normalizeCategory(parsed.category),
        sentiment: this.normalizeSentiment(parsed.sentiment),
        trending_score: Math.max(0, Math.min(100, parsed.trending_score || 0)),
        topics: (parsed.topics || [])
          .filter((t: any) => t.type && t.value)
          .map((t: any) => ({
            type: this.normalizeTopicType(t.type),
            value: String(t.value).trim(),
            confidence: Math.max(0, Math.min(100, t.confidence || 50)),
          }))
          .slice(0, 10), // Limit to 10 topics
      };
    } catch (error) {
      console.error('[Content Analyzer] Failed to parse AI response:', error);
      throw error;
    }
  }

  /**
   * Fallback analysis when AI fails
   */
  private getFallbackAnalysis(title: string, content: string): AIAnalysisResult {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    // Simple keyword-based category detection
    let category: AIAnalysisResult['category'] = 'other';
    if (titleLower.match(/\b(injured?|hurt|out|placed on|returns? from)\b/)) {
      category = 'injury';
    } else if (titleLower.match(/\b(traded?|signs?|acquire[ds]?|deal|contract)\b/)) {
      category = 'trade';
    } else if (titleLower.match(/\b(rumor|report|sources?|could|might|possibly)\b/)) {
      category = 'rumor';
    } else if (titleLower.match(/\b(analysis|breakdown|preview|recap|grades?)\b/)) {
      category = 'analysis';
    } else {
      category = 'news';
    }

    // Simple sentiment detection
    let sentiment: AIAnalysisResult['sentiment'] = 'neutral';
    const positiveWords = contentLower.match(/\b(win|won|victory|great|excellent|impressive|star|best)\b/g);
    const negativeWords = contentLower.match(/\b(lose|lost|defeat|poor|terrible|worst|struggle|injured)\b/g);

    if (positiveWords && negativeWords) {
      sentiment = (positiveWords.length > negativeWords.length) ? 'positive' : 'negative';
    } else if (positiveWords && positiveWords.length > 2) {
      sentiment = 'positive';
    } else if (negativeWords && negativeWords.length > 2) {
      sentiment = 'negative';
    }

    // Basic trending score
    const recencyBoost = 50; // Recent articles get base boost
    const categoryBoost = category === 'trade' || category === 'injury' ? 20 : 0;
    const trending_score = Math.min(100, recencyBoost + categoryBoost);

    return {
      category,
      sentiment,
      trending_score,
      topics: [], // No topic extraction in fallback
    };
  }

  /**
   * Clean HTML and reduce content size
   */
  private cleanContent(content: string): string {
    return content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[a-z]+;/gi, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
  }

  /**
   * Normalize category to valid enum value
   */
  private normalizeCategory(category: string): AIAnalysisResult['category'] {
    const normalized = category?.toLowerCase();
    const valid: AIAnalysisResult['category'][] = ['news', 'analysis', 'rumor', 'injury', 'trade', 'other'];
    return valid.includes(normalized as any) ? (normalized as AIAnalysisResult['category']) : 'other';
  }

  /**
   * Normalize sentiment to valid enum value
   */
  private normalizeSentiment(sentiment: string): AIAnalysisResult['sentiment'] {
    const normalized = sentiment?.toLowerCase();
    const valid: AIAnalysisResult['sentiment'][] = ['positive', 'neutral', 'negative'];
    return valid.includes(normalized as any) ? (normalized as AIAnalysisResult['sentiment']) : 'neutral';
  }

  /**
   * Normalize topic type to valid enum value
   */
  private normalizeTopicType(type: string): 'team' | 'player' | 'coach' | 'keyword' {
    const normalized = type?.toLowerCase();
    const valid = ['team', 'player', 'coach', 'keyword'];
    return valid.includes(normalized) ? (normalized as any) : 'keyword';
  }

  /**
   * Batch analyze multiple articles
   */
  async analyzeBatch(
    articles: Array<{ title: string; content: string; leagueId?: string }>
  ): Promise<AIAnalysisResult[]> {
    const results = await Promise.allSettled(
      articles.map(a => this.analyze(a.title, a.content, a.leagueId))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`[Content Analyzer] Batch analysis failed for article ${index}:`, result.reason);
        return this.getFallbackAnalysis(articles[index].title, articles[index].content);
      }
    });
  }
}
