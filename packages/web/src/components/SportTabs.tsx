interface SportTabsProps {
  selectedSport: 'MLB' | 'NFL' | 'NBA' | 'NCAA_FOOTBALL' | 'COLLEGE_BASEBALL';
  onSelectSport: (sport: 'MLB' | 'NFL' | 'NBA' | 'NCAA_FOOTBALL' | 'COLLEGE_BASEBALL') => void;
}

export function SportTabs({ selectedSport, onSelectSport }: SportTabsProps) {
  const sports = [
    { id: 'COLLEGE_BASEBALL', label: 'College Baseball', priority: true },
    { id: 'MLB', label: 'MLB' },
    { id: 'NFL', label: 'NFL' },
    { id: 'NCAA_FOOTBALL', label: 'NCAA Football' },
    { id: 'NBA', label: 'NBA' },
  ] as const;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {sports.map(sport => (
        <button
          key={sport.id}
          onClick={() => onSelectSport(sport.id as any)}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors
            ${selectedSport === sport.id
              ? 'bg-orange-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }
            ${sport.priority ? 'border-2 border-orange-500' : ''}
          `}
        >
          {sport.label}
          {sport.priority && (
            <span className="ml-1 text-xs">🔥</span>
          )}
        </button>
      ))}
    </div>
  );
}
