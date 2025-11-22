/**
 * Natural Language Query Interface
 *
 * AI-powered conversational analytics using natural language processing
 * Allows users to ask questions like "Show me all QBs with EPA > 0.2"
 *
 * @see https://www.thoughtspot.com/data-trends/dashboard/ai-dashboard
 * @see https://dev.to/raajaryan/advanced-ai-strategies-for-predictive-ui-component-rendering-in-react-3a01
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Sparkles, TrendingUp, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export interface QueryIntent {
  type: 'filter' | 'compare' | 'predict' | 'explain' | 'rank' | 'trend';
  entities: string[];
  metrics: string[];
  operators: Array<{ metric: string; operator: string; value: number }>;
  timeframe?: string;
  confidence: number;
}

export interface QueryResult {
  intent: QueryIntent;
  data: any[];
  visualization?: 'table' | 'chart' | 'card' | 'text';
  explanation: string;
  suggestedFollowups: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  result?: QueryResult;
  timestamp: Date;
}

interface NaturalLanguageQueryProps {
  dataset: any[];
  onQueryResult?: (result: QueryResult) => void;
  aiEndpoint?: string;
}

export default function NaturalLanguageQuery({
  dataset,
  onQueryResult,
  aiEndpoint = '/api/ai/query'
}: NaturalLanguageQueryProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'system',
      content: '👋 Hi! I\'m your AI analytics assistant. Ask me anything about your sports data!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Parse natural language query using pattern matching and NLP
   * In production, this would call an AI service (OpenAI, Claude, etc.)
   */
  const parseQuery = useCallback(async (query: string): Promise<QueryIntent> => {
    // Simplified NLP parser
    // In production, use a proper NLP library or AI service

    const lowerQuery = query.toLowerCase();

    // Detect intent
    let type: QueryIntent['type'] = 'filter';

    if (lowerQuery.includes('compare') || lowerQuery.includes('vs')) {
      type = 'compare';
    } else if (lowerQuery.includes('predict') || lowerQuery.includes('forecast')) {
      type = 'predict';
    } else if (lowerQuery.includes('why') || lowerQuery.includes('explain')) {
      type = 'explain';
    } else if (lowerQuery.includes('rank') || lowerQuery.includes('top') || lowerQuery.includes('best')) {
      type = 'rank';
    } else if (lowerQuery.includes('trend') || lowerQuery.includes('over time')) {
      type = 'trend';
    }

    // Extract entities (player names, teams, etc.)
    const entities: string[] = [];
    dataset.forEach(item => {
      if (item.name && lowerQuery.includes(item.name.toLowerCase())) {
        entities.push(item.name);
      }
      if (item.team && lowerQuery.includes(item.team.toLowerCase())) {
        entities.push(item.team);
      }
    });

    // Extract metrics
    const metrics: string[] = [];
    const commonMetrics = ['war', 'hr', 'avg', 'ops', 'era', 'whip', 'ppg', 'ast', 'reb', 'td', 'yds', 'qbr'];
    commonMetrics.forEach(metric => {
      if (lowerQuery.includes(metric)) {
        metrics.push(metric.toUpperCase());
      }
    });

    // Extract operators
    const operators: QueryIntent['operators'] = [];
    const operatorPatterns = [
      { pattern: /(\w+)\s*>\s*([\d.]+)/g, operator: '>' },
      { pattern: /(\w+)\s*<\s*([\d.]+)/g, operator: '<' },
      { pattern: /(\w+)\s*=\s*([\d.]+)/g, operator: '=' },
      { pattern: /(\w+)\s*>=\s*([\d.]+)/g, operator: '>=' },
      { pattern: /(\w+)\s*<=\s*([\d.]+)/g, operator: '<=' },
    ];

    operatorPatterns.forEach(({ pattern, operator }) => {
      const matches = [...lowerQuery.matchAll(pattern)];
      matches.forEach(match => {
        operators.push({
          metric: match[1].toUpperCase(),
          operator,
          value: parseFloat(match[2])
        });
      });
    });

    // Extract timeframe
    let timeframe: string | undefined;
    if (lowerQuery.includes('last 5')) {
      timeframe = 'last5';
    } else if (lowerQuery.includes('this season')) {
      timeframe = 'season';
    } else if (lowerQuery.includes('career')) {
      timeframe = 'career';
    }

    return {
      type,
      entities,
      metrics,
      operators,
      timeframe,
      confidence: 0.85 // Simplified confidence score
    };
  }, [dataset]);

  /**
   * Execute query based on parsed intent
   */
  const executeQuery = useCallback(async (intent: QueryIntent): Promise<QueryResult> => {
    let data: any[] = [...dataset];
    let explanation = '';
    let visualization: QueryResult['visualization'] = 'table';
    const suggestedFollowups: string[] = [];

    switch (intent.type) {
      case 'filter':
        // Apply filters
        intent.operators.forEach(({ metric, operator, value }) => {
          data = data.filter(item => {
            const itemValue = item.metrics?.[metric];
            if (itemValue === undefined) return false;

            switch (operator) {
              case '>': return itemValue > value;
              case '<': return itemValue < value;
              case '>=': return itemValue >= value;
              case '<=': return itemValue <= value;
              case '=': return itemValue === value;
              default: return true;
            }
          });
        });

        // Filter by entities
        if (intent.entities.length > 0) {
          data = data.filter(item =>
            intent.entities.some(entity =>
              item.name?.includes(entity) || item.team?.includes(entity)
            )
          );
        }

        explanation = `Found ${data.length} athlete(s) matching your criteria`;
        suggestedFollowups = [
          'Show me their performance trends',
          'Compare these athletes',
          'What are the injury risks?'
        ];
        break;

      case 'compare':
        if (intent.entities.length >= 2) {
          data = data.filter(item =>
            intent.entities.includes(item.name)
          );
          explanation = `Comparing ${intent.entities.join(' vs ')}`;
          visualization = 'chart';
          suggestedFollowups = [
            'Which one has better recent form?',
            'Show me advanced metrics',
            'Predict next season performance'
          ];
        }
        break;

      case 'predict':
        explanation = 'Running AI prediction models...';
        visualization = 'chart';
        suggestedFollowups = [
          'What factors influence this prediction?',
          'Show me historical accuracy',
          'What are the risk factors?'
        ];
        break;

      case 'rank':
        // Sort by metric
        if (intent.metrics.length > 0) {
          const metric = intent.metrics[0];
          data = data
            .filter(item => item.metrics?.[metric] !== undefined)
            .sort((a, b) => (b.metrics[metric] || 0) - (a.metrics[metric] || 0))
            .slice(0, 10);

          explanation = `Top 10 by ${metric}`;
          suggestedFollowups = [
            'Show me the bottom 10',
            'Filter by sport',
            'Compare top 3'
          ];
        }
        break;

      case 'trend':
        explanation = 'Analyzing performance trends over time';
        visualization = 'chart';
        suggestedFollowups = [
          'Is this trend sustainable?',
          'What caused the improvement?',
          'Predict next year'
        ];
        break;

      case 'explain':
        explanation = 'Let me break down the key factors...';
        visualization = 'text';
        suggestedFollowups = [
          'Show me the data',
          'Compare to league average',
          'What can be improved?'
        ];
        break;
    }

    return {
      intent,
      data,
      visualization,
      explanation,
      suggestedFollowups
    };
  }, [dataset]);

  /**
   * Handle user query submission
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Parse query
      const intent = await parseQuery(input);

      // Execute query
      const result = await executeQuery(intent);

      // Create assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.explanation,
        result,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Notify parent
      if (onQueryResult) {
        onQueryResult(result);
      }
    } catch (error) {
      console.error('Query error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your query. Please try rephrasing.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [input, isProcessing, parseQuery, executeQuery, onQueryResult]);

  /**
   * Handle suggested followup click
   */
  const handleFollowupClick = useCallback((followup: string) => {
    setInput(followup);
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-700">
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 border-b border-gray-700">
        <div className="p-2 bg-purple-900/30 rounded-lg">
          <Bot size={24} className="text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">AI Analytics Assistant</h3>
          <p className="text-xs text-gray-400">Ask questions in natural language</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              {/* Message bubble */}
              <div className={`
                p-3 rounded-lg
                ${message.role === 'user'
                  ? 'bg-orange-600 text-white'
                  : message.role === 'system'
                  ? 'bg-gray-800 text-gray-300'
                  : 'bg-purple-900/30 text-white border border-purple-500/30'
                }
              `}>
                <p className="text-sm">{message.content}</p>
              </div>

              {/* Query result */}
              {message.result && (
                <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  {/* Result summary */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">
                      {message.result.data.length} results • {message.result.intent.confidence * 100}% confident
                    </span>
                    <CheckCircle size={14} className="text-green-400" />
                  </div>

                  {/* Data preview */}
                  {message.result.data.length > 0 && (
                    <div className="text-xs text-gray-300 space-y-1">
                      {message.result.data.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span>{item.name}</span>
                          <span className="text-orange-400">
                            {message.result!.intent.metrics[0] && item.metrics?.[message.result!.intent.metrics[0]]}
                          </span>
                        </div>
                      ))}
                      {message.result.data.length > 3 && (
                        <div className="text-gray-500">
                          +{message.result.data.length - 3} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested followups */}
                  {message.result.suggestedFollowups.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-xs text-gray-400 mb-2">💡 Try asking:</div>
                      <div className="space-y-1">
                        {message.result.suggestedFollowups.map((followup, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleFollowupClick(followup)}
                            className="block w-full text-left text-xs text-purple-400 hover:text-purple-300 hover:bg-gray-700/50 p-2 rounded transition-colors"
                          >
                            → {followup}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <div className={`text-xs text-gray-500 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-purple-900/30 text-white border border-purple-500/30 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader size={16} className="animate-spin text-purple-400" />
                <span className="text-sm">Analyzing your query...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything... (e.g., 'Show me QBs with QBR > 60')"
            disabled={isProcessing}
            className="flex-1 bg-gray-800 text-white placeholder-gray-500 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} className="text-white" />
          </button>
        </div>

        {/* Quick prompts */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            'Top 5 by WAR',
            'Compare Ohtani vs Judge',
            'Predict next season',
            'Show injury risks',
          ].map(prompt => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
