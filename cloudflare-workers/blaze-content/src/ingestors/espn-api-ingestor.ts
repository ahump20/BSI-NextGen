/**
 * ESPN API Ingestor
 *
 * Fetches sports news directly from ESPN's public APIs
 * Supports multiple sports leagues (MLB, NFL, NBA, NCAA Football, College Baseball)
 */

import type { Article } from '../types';

export class ESPNAPIIngestor {
  private readonly baseUrl = 'https://site.api.espn.com/apis/site/v2/sports';

  /**
   * Fetch news articles from ESPN API
   */
  async fetch(leagueId: string): Promise<Article[]> {
    try {
      console.log(`[ESPN API Ingestor] Fetching news for league: ${leagueId}`);

      const sportPath = this.getSportPath(leagueId);
      if (!sportPath) {
        throw new Error(`Unsupported league: ${leagueId}`);
      }

      const url = `${this.baseUrl}/${sportPath}/news`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ESPN API fetch failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseNewsResponse(data, leagueId);
    } catch (error) {
      console.error('[ESPN API Ingestor] Fetch failed:', leagueId, error);
      throw error;
    }
  }

  /**
   * Get sport-specific API path
   */
  private getSportPath(leagueId: string): string | null {
    const pathMap: Record<string, string> = {
      mlb: 'baseball/mlb',
      nfl: 'football/nfl',
      nba: 'basketball/nba',
      'ncaa-football': 'football/college-football',
      'college-baseball': 'baseball/college-baseball',
      'ncaa-basketball': 'basketball/mens-college-basketball',
    };

    return pathMap[leagueId] || null;
  }

  /**
   * Parse ESPN news API response
   */
  private parseNewsResponse(data: any, leagueId: string): Article[] {
    const articles: Article[] = [];

    if (!data.articles || !Array.isArray(data.articles)) {
      console.warn('[ESPN API Ingestor] No articles found in response');
      return articles;
    }

    for (const item of data.articles) {
      try {
        if (!item.headline || !item.links?.web?.href) continue;

        articles.push({
          externalId: String(item.id),
          title: this.cleanText(item.headline),
          excerpt: this.cleanText(item.description) || undefined,
          contentHtml: this.buildContentHtml(item),
          author: this.extractAuthor(item),
          publishedAt: item.published || new Date().toISOString(),
          url: item.links.web.href,
          imageUrl: this.extractImage(item),
          leagueId,
        });
      } catch (error) {
        console.error('[ESPN API Ingestor] Failed to parse article:', item.headline, error);
      }
    }

    console.log(`[ESPN API Ingestor] Parsed ${articles.length} articles from ESPN API`);
    return articles;
  }

  /**
   * Build HTML content from ESPN article data
   */
  private buildContentHtml(item: any): string | undefined {
    const parts: string[] = [];

    // Add story (main content)
    if (item.story) {
      parts.push(`<p>${this.cleanText(item.story)}</p>`);
    }

    // Add byline
    if (item.byline) {
      parts.push(`<p><em>By ${this.cleanText(item.byline)}</em></p>`);
    }

    // Add categories as tags
    if (item.categories && Array.isArray(item.categories)) {
      const tags = item.categories
        .map((cat: any) => cat.description)
        .filter(Boolean)
        .join(', ');
      if (tags) {
        parts.push(`<p><strong>Topics:</strong> ${tags}</p>`);
      }
    }

    return parts.length > 0 ? parts.join('\n') : undefined;
  }

  /**
   * Extract author information
   */
  private extractAuthor(item: any): string | undefined {
    // ESPN provides byline which may include author name
    if (item.byline) {
      // Remove "By " prefix if present
      const cleaned = item.byline.replace(/^By\s+/i, '').trim();
      return cleaned || undefined;
    }

    return undefined;
  }

  /**
   * Extract image URL from ESPN article
   */
  private extractImage(item: any): string | undefined {
    // ESPN images structure: item.images[0].url
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      const image = item.images[0];
      if (image.url) {
        return image.url;
      }
    }

    // Alternative: check links.api.news.href for image
    if (item.links?.api?.news?.href) {
      // ESPN news API links sometimes contain image references
      // This would require a second fetch, so we skip for now
      return undefined;
    }

    return undefined;
  }

  /**
   * Clean text content
   */
  private cleanText(text: string | undefined): string | undefined {
    if (!text) return undefined;

    // Remove HTML tags if present
    let cleaned = text.replace(/<[^>]*>/g, '');

    // Decode HTML entities
    cleaned = cleaned
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ');

    // Trim and collapse whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned || undefined;
  }

  /**
   * Fetch team-specific news
   */
  async fetchTeamNews(leagueId: string, teamId: string): Promise<Article[]> {
    try {
      const sportPath = this.getSportPath(leagueId);
      if (!sportPath) {
        throw new Error(`Unsupported league: ${leagueId}`);
      }

      const url = `${this.baseUrl}/${sportPath}/teams/${teamId}/news`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `ESPN team news fetch failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return this.parseNewsResponse(data, leagueId);
    } catch (error) {
      console.error('[ESPN API Ingestor] Team news fetch failed:', leagueId, teamId, error);
      throw error;
    }
  }

  /**
   * Fetch headline news (top stories)
   */
  async fetchHeadlines(leagueId: string, limit: number = 10): Promise<Article[]> {
    try {
      const sportPath = this.getSportPath(leagueId);
      if (!sportPath) {
        throw new Error(`Unsupported league: ${leagueId}`);
      }

      const url = `${this.baseUrl}/${sportPath}/news?limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ESPN headlines fetch failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const articles = this.parseNewsResponse(data, leagueId);

      // Return only the requested limit
      return articles.slice(0, limit);
    } catch (error) {
      console.error('[ESPN API Ingestor] Headlines fetch failed:', leagueId, error);
      throw error;
    }
  }
}
