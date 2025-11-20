/**
 * Web Scraper Ingestor
 *
 * Generic web scraper for team sites, beat reporters, and sports blogs
 * Uses HTMLRewriter for efficient edge-based HTML parsing
 */

import type { Article } from '../types';

interface ScraperConfig {
  url: string;
  leagueId?: string;
  selectors: {
    articleList?: string; // Container for article list
    articleItem: string; // Individual article elements
    title: string; // Article title selector
    link: string; // Article link selector
    excerpt?: string; // Article excerpt selector
    author?: string; // Author selector
    date?: string; // Publication date selector
    image?: string; // Image selector
  };
  baseUrl?: string; // Base URL for relative links
}

export class WebScraper {
  /**
   * Scrape articles from a website using custom selectors
   */
  async scrape(config: ScraperConfig): Promise<Article[]> {
    try {
      console.log(`[Web Scraper] Scraping: ${config.url}`);

      const response = await fetch(config.url, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
          Accept: 'text/html',
        },
      });

      if (!response.ok) {
        throw new Error(`Scrape failed: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      return this.parseHtml(html, config);
    } catch (error) {
      console.error('[Web Scraper] Scrape failed:', config.url, error);
      throw error;
    }
  }

  /**
   * Parse HTML and extract articles using selectors
   */
  private parseHtml(html: string, config: ScraperConfig): Article[] {
    const articles: Article[] = [];

    // Simple DOM parsing using regex (Cloudflare Workers don't have DOM APIs)
    // For production, consider using HTMLRewriter or a streaming parser

    try {
      // Extract article elements based on selectors
      const articlePattern = this.buildArticlePattern(config.selectors.articleItem);
      const articleMatches = html.match(articlePattern);

      if (!articleMatches) {
        console.warn('[Web Scraper] No articles found with selector:', config.selectors.articleItem);
        return articles;
      }

      for (const articleHtml of articleMatches) {
        try {
          const article = this.extractArticleData(articleHtml, config);
          if (article) {
            articles.push(article);
          }
        } catch (error) {
          console.error('[Web Scraper] Failed to parse article:', error);
        }
      }

      console.log(`[Web Scraper] Parsed ${articles.length} articles from ${config.url}`);
      return articles;
    } catch (error) {
      console.error('[Web Scraper] HTML parsing failed:', error);
      return articles;
    }
  }

  /**
   * Build regex pattern for article elements
   */
  private buildArticlePattern(selector: string): RegExp {
    // Convert CSS selector to approximate regex
    // This is a simplified approach - production code should use HTMLRewriter
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`<[^>]*class="[^"]*${escapedSelector}[^"]*"[^>]*>.*?</[^>]+>`, 'gis');
  }

  /**
   * Extract article data from HTML fragment
   */
  private extractArticleData(articleHtml: string, config: ScraperConfig): Article | null {
    try {
      // Extract title
      const title = this.extractBySelector(articleHtml, config.selectors.title);
      if (!title) return null;

      // Extract link
      const linkHref = this.extractLinkHref(articleHtml, config.selectors.link);
      if (!linkHref) return null;

      // Resolve relative URLs
      const url = this.resolveUrl(linkHref, config.baseUrl || config.url);

      // Extract optional fields
      const excerpt = this.extractBySelector(articleHtml, config.selectors.excerpt || '');
      const author = this.extractBySelector(articleHtml, config.selectors.author || '');
      const dateStr = this.extractBySelector(articleHtml, config.selectors.date || '');
      const imageUrl = this.extractImageUrl(
        articleHtml,
        config.selectors.image || '',
        config.baseUrl || config.url
      );

      // Parse date
      const publishedAt = dateStr ? this.parseDate(dateStr) : new Date().toISOString();

      return {
        externalId: this.generateExternalId(url),
        title: this.cleanText(title),
        excerpt: excerpt ? this.cleanText(excerpt) : undefined,
        contentHtml: undefined, // Would require fetching individual article pages
        author: author ? this.cleanText(author) : undefined,
        publishedAt,
        url,
        imageUrl,
        leagueId: config.leagueId,
      };
    } catch (error) {
      console.error('[Web Scraper] Article extraction failed:', error);
      return null;
    }
  }

  /**
   * Extract text content by CSS selector
   */
  private extractBySelector(html: string, selector: string): string | null {
    if (!selector) return null;

    // Simple regex-based extraction (production code should use HTMLRewriter)
    const classMatch = selector.match(/\.([a-zA-Z0-9_-]+)/);
    if (!classMatch) return null;

    const className = classMatch[1];
    const pattern = new RegExp(
      `<[^>]*class="[^"]*${className}[^"]*"[^>]*>(.*?)</[^>]+>`,
      'is'
    );
    const match = html.match(pattern);

    if (!match) return null;

    // Remove HTML tags and return text
    return match[1].replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Extract href attribute from link element
   */
  private extractLinkHref(html: string, selector: string): string | null {
    if (!selector) {
      // Fallback: find first <a> tag
      const linkMatch = html.match(/<a[^>]*href="([^"]+)"/i);
      return linkMatch ? linkMatch[1] : null;
    }

    const classMatch = selector.match(/\.([a-zA-Z0-9_-]+)/);
    if (!classMatch) return null;

    const className = classMatch[1];
    const pattern = new RegExp(
      `<a[^>]*class="[^"]*${className}[^"]*"[^>]*href="([^"]+)"`,
      'i'
    );
    const match = html.match(pattern);

    return match ? match[1] : null;
  }

  /**
   * Extract image URL
   */
  private extractImageUrl(html: string, selector: string, baseUrl: string): string | undefined {
    if (!selector) {
      // Fallback: find first <img> tag
      const imgMatch = html.match(/<img[^>]*src="([^"]+)"/i);
      if (imgMatch) {
        return this.resolveUrl(imgMatch[1], baseUrl);
      }
      return undefined;
    }

    const classMatch = selector.match(/\.([a-zA-Z0-9_-]+)/);
    if (!classMatch) return undefined;

    const className = classMatch[1];
    const pattern = new RegExp(`<img[^>]*class="[^"]*${className}[^"]*"[^>]*src="([^"]+)"`, 'i');
    const match = html.match(pattern);

    if (match) {
      return this.resolveUrl(match[1], baseUrl);
    }

    return undefined;
  }

  /**
   * Resolve relative URLs to absolute
   */
  private resolveUrl(href: string, baseUrl: string): string {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href;
    }

    if (href.startsWith('//')) {
      return `https:${href}`;
    }

    // Parse base URL
    const base = new URL(baseUrl);

    if (href.startsWith('/')) {
      // Absolute path
      return `${base.origin}${href}`;
    } else {
      // Relative path
      return `${base.origin}${base.pathname}${href}`;
    }
  }

  /**
   * Generate external ID from URL
   */
  private generateExternalId(url: string): string {
    // Use URL as external ID (hash it for consistency)
    return url;
  }

  /**
   * Parse date string
   */
  private parseDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Clean text content
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Scrape team site news (predefined configs)
   */
  static getTeamSiteConfig(teamSite: 'cardinals' | 'dodgers' | 'yankees'): ScraperConfig {
    const configs: Record<string, ScraperConfig> = {
      cardinals: {
        url: 'https://www.mlb.com/cardinals/news',
        leagueId: 'mlb',
        baseUrl: 'https://www.mlb.com',
        selectors: {
          articleItem: 'article',
          title: '.article-item__headline',
          link: 'a.article-item__link',
          excerpt: '.article-item__preview',
          author: '.article-item__contributor-name',
          date: '.article-item__date',
          image: '.article-item__image img',
        },
      },
      dodgers: {
        url: 'https://www.mlb.com/dodgers/news',
        leagueId: 'mlb',
        baseUrl: 'https://www.mlb.com',
        selectors: {
          articleItem: 'article',
          title: '.article-item__headline',
          link: 'a.article-item__link',
          excerpt: '.article-item__preview',
          author: '.article-item__contributor-name',
          date: '.article-item__date',
          image: '.article-item__image img',
        },
      },
      yankees: {
        url: 'https://www.mlb.com/yankees/news',
        leagueId: 'mlb',
        baseUrl: 'https://www.mlb.com',
        selectors: {
          articleItem: 'article',
          title: '.article-item__headline',
          link: 'a.article-item__link',
          excerpt: '.article-item__preview',
          author: '.article-item__contributor-name',
          date: '.article-item__date',
          image: '.article-item__image img',
        },
      },
    };

    return configs[teamSite];
  }
}
