'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Command {
  id: string;
  title: string;
  description?: string;
  action: () => void;
  category: 'Navigation' | 'Sports' | 'Actions' | 'Quick Links';
  icon?: string;
  keywords?: string[];
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Command definitions
  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-home',
      title: 'Go to Home',
      description: 'Navigate to dashboard',
      category: 'Navigation',
      icon: '🏠',
      action: () => router.push('/'),
      keywords: ['dashboard', 'main', 'home'],
    },
    {
      id: 'nav-college-baseball',
      title: 'College Baseball',
      description: 'View college baseball games and scores',
      category: 'Sports',
      icon: '⚾',
      action: () => router.push('/sports/college-baseball'),
      keywords: ['ncaa', 'baseball', 'college'],
    },
    {
      id: 'nav-college-baseball-rankings',
      title: 'College Baseball Rankings',
      description: 'View D1Baseball Top 25 rankings',
      category: 'Sports',
      icon: '🏆',
      action: () => router.push('/sports/college-baseball/rankings'),
      keywords: ['rankings', 'top 25', 'ncaa baseball'],
    },
    {
      id: 'nav-college-baseball-standings',
      title: 'College Baseball Standings',
      description: 'View conference standings',
      category: 'Sports',
      icon: '📊',
      action: () => router.push('/sports/college-baseball/standings'),
      keywords: ['standings', 'conference', 'ncaa baseball'],
    },
    {
      id: 'nav-mlb',
      title: 'MLB Scoreboard',
      description: 'View Major League Baseball scores',
      category: 'Sports',
      icon: '⚾',
      action: () => router.push('/mlb'),
      keywords: ['mlb', 'baseball', 'major league'],
    },
    // Actions
    {
      id: 'action-refresh',
      title: 'Refresh Data',
      description: 'Reload current page data',
      category: 'Actions',
      icon: '🔄',
      action: () => {
        window.location.reload();
      },
      keywords: ['reload', 'refresh', 'update'],
    },
    {
      id: 'action-today',
      title: 'Today\'s Games',
      description: 'Jump to today\'s schedule',
      category: 'Quick Links',
      icon: '📅',
      action: () => {
        const today = new Date().toLocaleDateString('en-CA');
        router.push(`/sports/college-baseball?date=${today}`);
      },
      keywords: ['today', 'schedule', 'games'],
    },
    // Quick Links
    {
      id: 'quick-admin',
      title: 'Admin Dashboard',
      description: 'Access admin panel',
      category: 'Quick Links',
      icon: '⚙️',
      action: () => router.push('/admin'),
      keywords: ['admin', 'dashboard', 'settings', 'management'],
    },
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter((command) => {
    if (!search) return true;

    const searchLower = search.toLowerCase();
    const titleMatch = command.title.toLowerCase().includes(searchLower);
    const descriptionMatch = command.description?.toLowerCase().includes(searchLower);
    const keywordMatch = command.keywords?.some((k) => k.includes(searchLower));

    return titleMatch || descriptionMatch || keywordMatch;
  });

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd+K or Ctrl+K to open/close
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
      setSearch('');
    }

    // Escape to close
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
      setSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Execute command
  const executeCommand = (command: Command) => {
    command.action();
    setIsOpen(false);
    setSearch('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette */}
      <div className="relative min-h-screen flex items-start justify-center p-4 pt-[15vh]">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              <input
                type="text"
                placeholder="Search commands... (type to filter)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                ESC
              </kbd>
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {Object.keys(groupedCommands).length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No commands found
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {category}
                    </div>
                    <div className="space-y-1">
                      {categoryCommands.map((command) => (
                        <button
                          key={command.id}
                          onClick={() => executeCommand(command)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                        >
                          {command.icon && (
                            <span className="text-2xl">{command.icon}</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {command.title}
                            </div>
                            {command.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {command.description}
                              </div>
                            )}
                          </div>
                          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                              ↵
                            </kbd>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                Press{' '}
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 font-mono">
                  ⌘K
                </kbd>{' '}
                or{' '}
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 font-mono">
                  Ctrl+K
                </kbd>{' '}
                to toggle
              </span>
              <span>{filteredCommands.length} commands</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
