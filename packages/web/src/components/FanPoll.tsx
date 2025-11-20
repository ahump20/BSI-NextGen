'use client';

import { useState, useEffect } from 'react';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  endsAt: string;
  category: string;
}

interface FanPollProps {
  pollId?: string;
  category?: string;
}

/**
 * Fan Engagement Poll Component
 *
 * Interactive polling widget for fan engagement
 * - Real-time vote counts
 * - Animated progress bars
 * - Results visualization
 * - Share to social media
 *
 * Features:
 * - One vote per user (tracked by session/auth)
 * - Live updates via WebSocket (future)
 * - Historical poll results
 * - Trending polls
 */
export function FanPoll({ pollId, category = 'general' }: FanPollProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoll();
  }, [pollId, category]);

  const fetchPoll = async () => {
    try {
      // TODO: Replace with actual API endpoint
      // const response = await fetch(`/api/polls/${pollId || 'latest'}?category=${category}`);
      // const data = await response.json();
      // setPoll(data.poll);
      // setHasVoted(data.hasVoted);

      // Mock data for demonstration
      const mockPoll: Poll = {
        id: '1',
        question: 'Who will win the College World Series?',
        options: [
          { id: '1', text: 'LSU Tigers', votes: 3456, percentage: 0 },
          { id: '2', text: 'Texas Longhorns', votes: 2890, percentage: 0 },
          { id: '3', text: 'Vanderbilt Commodores', votes: 2134, percentage: 0 },
          { id: '4', text: 'Florida Gators', votes: 1876, percentage: 0 },
        ],
        totalVotes: 0,
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'college-baseball',
      };

      // Calculate percentages
      mockPoll.totalVotes = mockPoll.options.reduce((sum, opt) => sum + opt.votes, 0);
      mockPoll.options = mockPoll.options.map((opt) => ({
        ...opt,
        percentage: (opt.votes / mockPoll.totalVotes) * 100,
      }));

      setPoll(mockPoll);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching poll:', error);
      setLoading(false);
    }
  };

  const handleVote = async (optionId: string) => {
    if (hasVoted) return;

    try {
      // TODO: Replace with actual API endpoint
      // await fetch(`/api/polls/${poll?.id}/vote`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ optionId }),
      // });

      setSelectedOption(optionId);
      setHasVoted(true);

      // Optimistic update
      if (poll) {
        const updatedOptions = poll.options.map((opt) =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );
        const newTotal = poll.totalVotes + 1;
        updatedOptions.forEach((opt) => {
          opt.percentage = (opt.votes / newTotal) * 100;
        });

        setPoll({
          ...poll,
          options: updatedOptions,
          totalVotes: newTotal,
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const getTimeRemaining = () => {
    if (!poll) return '';
    const now = new Date();
    const end = new Date(poll.endsAt);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Poll ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <p className="text-gray-600">No active polls at the moment</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-6 border-2 border-blue-100">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
            FAN POLL
          </span>
          <span className="text-sm text-gray-600 font-medium">{getTimeRemaining()}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mt-3">{poll.question}</h3>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {poll.options.map((option) => {
          const isSelected = option.id === selectedOption;
          const isLeading = option.percentage === Math.max(...poll.options.map((o) => o.percentage));

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted}
              className={`w-full text-left relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                hasVoted
                  ? isSelected
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200'
                  : 'border-gray-300 hover:border-blue-400 hover:shadow-md cursor-pointer'
              } ${hasVoted ? 'cursor-default' : ''}`}
            >
              {/* Progress bar background */}
              {hasVoted && (
                <div
                  className={`absolute inset-0 transition-all duration-700 ease-out ${
                    isLeading ? 'bg-gradient-to-r from-blue-500/20 to-blue-400/20' : 'bg-gray-100'
                  }`}
                  style={{ width: `${option.percentage}%` }}
                ></div>
              )}

              {/* Content */}
              <div className="relative px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {hasVoted && isSelected && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                  <span className={`font-semibold ${hasVoted && isLeading ? 'text-blue-700' : 'text-gray-900'}`}>
                    {option.text}
                  </span>
                </div>

                {hasVoted && (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{option.votes.toLocaleString()} votes</span>
                    <span className={`text-lg font-bold ${isLeading ? 'text-blue-600' : 'text-gray-700'}`}>
                      {option.percentage.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 font-medium">
            {poll.totalVotes.toLocaleString()} total votes
          </span>
          {hasVoted && (
            <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share Results</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
