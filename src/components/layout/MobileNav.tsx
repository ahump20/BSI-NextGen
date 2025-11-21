import React, { useState } from 'react';

export interface NavItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  badge?: number;
  children?: NavItem[];
}

export interface MobileNavProps {
  items: NavItem[];
  logo?: React.ReactNode;
  currentPath?: string;
}

const MobileNav: React.FC<MobileNavProps> = ({ items, logo, currentPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const handleItemClick = (item: NavItem) => {
    if (item.onClick) {
      item.onClick();
      closeMenu();
    } else if (item.href) {
      window.location.href = item.href;
      closeMenu();
    } else if (item.children) {
      toggleExpanded(item.label);
    }
  };

  const isActive = (href?: string) => {
    if (!href || !currentPath) return false;
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const active = isActive(item.href);

    return (
      <div key={item.label}>
        <button
          onClick={() => handleItemClick(item)}
          className={`
            w-full flex items-center justify-between px-4 py-3 text-left transition-colors
            ${depth > 0 ? 'pl-8' : ''}
            ${active ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}
          `}
        >
          <div className="flex items-center gap-3">
            {item.icon && <span className="text-xl">{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </div>
          {hasChildren && (
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="bg-gray-50">
            {item.children!.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {logo && <div className="flex-shrink-0">{logo}</div>}
          <button
            onClick={toggleMenu}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <nav
            className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-xl overflow-y-auto lg:hidden transform transition-transform"
            style={{
              transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              {logo && <div>{logo}</div>}
              <button
                onClick={closeMenu}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="py-2">
              {items.map((item) => renderNavItem(item))}
            </div>
          </nav>
        </>
      )}

      {/* Desktop Navigation (optional) */}
      <nav className="hidden lg:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {logo && <div className="flex-shrink-0">{logo}</div>}
            <div className="flex items-center space-x-4">
              {items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleItemClick(item)}
                  className={`
                    px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
