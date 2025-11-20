/**
 * RSS Feed Ingestor
 *
 * Fetches and parses RSS/Atom feeds to extract articles
 */

import { XMLParser } from 'fast-xml-parser';
import type { Article } from '../types';

export class RSSIngestor {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
    });
  }

  /**
   * Fetch and parse RSS feed
   */
  async fetch(url: string): Promise<Article[]> {
    try {
      console.log(`[RSS Ingestor] Fetching feed: ${url}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
      });

      if (!response.ok) {
        throw new Error(`Feed fetch failed: ${response.status} ${response.statusText}`);
      }

      const xml = await response.text();
      const parsed = this.parser.parse(xml);

      // Detect feed type (RSS 2.0 or Atom)
      if (parsed.rss) {
        return this.parseRSS(parsed.rss.channel);
      } else if (parsed.feed) {
        return this.parseAtom(parsed.feed);
      } else {
        throw new Error('Unknown feed format');
      }
    } catch (error) {
      console.error('[RSS Ingestor] Fetch failed:', url, error);
      throw error;
    }
  }

  /**
   * Parse RSS 2.0 format
   */
  private parseRSS(channel: any): Article[] {
    const items = Array.isArray(channel.item) ? channel.item : [channel.item];
    const articles: Article[] = [];

    for (const item of items) {
      if (!item || !item.title || !item.link) continue;

      try {
        articles.push({
          externalId: item.guid?.['#text'] || item.guid || undefined,
          title: this.cleanText(item.title),
          excerpt: this.cleanText(item.description) || undefined,
          contentHtml: item['content:encoded'] || item.description || undefined,
          author: this.extractAuthor(item),
          publishedAt: this.parseDate(item.pubDate || item['dc:date']),
          url: item.link,
          imageUrl: this.extractImage(item),
        });
      } catch (error) {
        console.error('[RSS Ingestor] Failed to parse item:', item.title, error);
      }
    }

    console.log(`[RSS Ingestor] Parsed ${articles.length} articles from RSS feed`);
    return articles;
  }

  /**
   * Parse Atom format
   */
  private parseAtom(feed: any): Article[] {
    const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
    const articles: Article[] = [];

    for (const entry of entries) {
      if (!entry || !entry.title || !entry.link) continue;

      try {
        const link = Array.isArray(entry.link)
          ? entry.link.find((l: any) => l['@_rel'] === 'alternate' || !l['@_rel'])
          : entry.link;

        articles.push({
          externalId: entry.id || undefined,
          title: this.cleanText(entry.title),
          excerpt: this.cleanText(entry.summary) || undefined,
          contentHtml: entry.content?.['#text'] || entry.content || undefined,
          author: entry.author?.name || undefined,
          publishedAt: this.parseDate(entry.published || entry.updated),
          url: link?.['@_href'] || link,
          imageUrl: this.extractAtomImage(entry),
        });
      } catch (error) {
        console.error('[RSS Ingestor] Failed to parse entry:', entry.title, error);
      }
    }

    console.log(`[RSS Ingestor] Parsed ${articles.length} articles from Atom feed`);
    return articles;
  }

  /**
   * Clean text (remove HTML tags, trim whitespace)
   */
  private cleanText(text: string | undefined): string | undefined {
    if (!text) return undefined;

    // Remove HTML tags
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
   * Extract author from RSS item
   */
  private extractAuthor(item: any): string | undefined {
    if (item.author) return item.author;
    if (item['dc:creator']) return item['dc:creator'];
    return undefined;
  }

  /**
   * Extract image URL from RSS item
   */
  private extractImage(item: any): string | undefined {
    // Media RSS
    if (item['media:content']?.['@_url']) {
      return item['media:content']['@_url'];
    }

    // Media thumbnail
    if (item['media:thumbnail']?.['@_url']) {
      return item['media:thumbnail']['@_url'];
    }

    // Enclosure
    if (item.enclosure?.['@_type']?.startsWith('image/')) {
      return item.enclosure['@_url'];
    }

    // Extract from content
    if (item.description || item['content:encoded']) {
      const content = item['content:encoded'] || item.description;
      const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) return imgMatch[1];
    }

    return undefined;
  }

  /**
   * Extract image URL from Atom entry
   */
  private extractAtomImage(entry: any): string | undefined {
    // Media thumbnail
    if (entry['media:thumbnail']?.['@_url']) {
      return entry['media:thumbnail']['@_url'];
    }

    // Link with type image
    if (Array.isArray(entry.link)) {
      const imageLink = entry.link.find((l: any) =>
        l['@_type']?.startsWith('image/')
      );
      if (imageLink) return imageLink['@_href'];
    }

    return undefined;
  }

  /**
   * Parse date string to ISO 8601
   */
  private parseDate(dateStr: string | undefined): string {
    if (!dateStr) return new Date().toISOString();

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn('[RSS Ingestor] Invalid date:', dateStr);
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch (error) {
      console.warn('[RSS Ingestor] Date parse error:', dateStr, error);
      return new Date().toISOString();
    }
  }
}
