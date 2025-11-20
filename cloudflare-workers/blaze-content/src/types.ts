/**
 * Type definitions for Blaze Content Worker
 */

export interface ContentSource {
  id: string;
  name: string;
  type: 'rss' | 'api' | 'scraper';
  url: string;
  credibility_score: number;
  last_fetched_at: number | null;
  fetch_interval_seconds: number;
  is_active: number;
  created_at: number;
  updated_at: number;
}

export interface Article {
  externalId?: string;
  title: string;
  excerpt?: string;
  contentHtml?: string;
  author?: string;
  publishedAt: string; // ISO 8601
  url: string;
  imageUrl?: string;
  leagueId?: string;
}

export interface ArticleRecord {
  id: string;
  source_id: string;
  external_id: string | null;
  title: string;
  excerpt: string | null;
  content_html: string | null;
  author: string | null;
  published_at: number;
  url: string;
  image_url: string | null;
  category: string | null;
  sentiment: string | null;
  trending_score: number;
  league_id: string | null;
  team_ids: string | null;
  player_names: string | null;
  created_at: number;
  updated_at: number;
}

export interface IngestionResult {
  fetched: number;
  inserted: number;
  updated: number;
  failed: number;
  errors: string[];
}

export interface AIAnalysisResult {
  category: 'news' | 'analysis' | 'rumor' | 'injury' | 'trade' | 'other';
  sentiment: 'positive' | 'neutral' | 'negative';
  trending_score: number;
  topics: Array<{
    type: 'team' | 'player' | 'coach' | 'keyword';
    value: string;
    confidence: number;
  }>;
}

export interface TrendingTopic {
  id: string;
  topic_value: string;
  topic_type: string;
  league_id: string | null;
  article_count: number;
  velocity: number;
  peak_at: number | null;
  sentiment_avg: number;
  window_start: number;
  window_end: number;
  created_at: number;
  updated_at: number;
}
