import React, { useRef, useState, useEffect } from 'react';

const TabbedContent = ({ tabsData, activeTabIndex, onTabChange }) => {
  const sortedTabsData = [...tabsData].sort((a, b) => new Date(b.label) - new Date(a.label));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [sortedTabsData]);

  const visibleTabs = sortedTabsData.filter(tab => tab.label !== 'No Images');

  return (
    <div className="flex flex-col w-full">
      <div className="relative pt-3">
        {canScrollLeft && (
          <div className="absolute left-0 top-3 bottom-0 w-6 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, white, transparent)' }} />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-3 bottom-0 w-6 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, white, transparent)' }} />
        )}
        <div
          ref={scrollRef}
          className="flex gap-1.5 w-full overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`div[class*="flex gap-1.5"]::-webkit-scrollbar { display: none; }`}</style>
          {visibleTabs.map((tab, index) => {
            const originalIndex = sortedTabsData.indexOf(tab);
            const isActive = activeTabIndex === originalIndex;
            return (
              <button
                key={tab.id}
                className={`cursor-pointer px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap transition-colors focus:outline-none ${
                  isActive
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => onTabChange(originalIndex)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="w-full">
        {sortedTabsData.map((tab, index) => (
          <div key={`content_${tab.id}`} style={{ display: activeTabIndex === index ? 'block' : 'none' }}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabbedContent;
