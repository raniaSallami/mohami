import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Building2, X } from 'lucide-react';
import { University, searchUniversities, getAllUniversities, getUniversitiesByType } from '../data/tunisianUniversities';

interface UniversitySelectorProps {
  value: string;
  onChange: (universityId: string, universityName: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export const UniversitySelector: React.FC<UniversitySelectorProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUniversities, setFilteredUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    const allUnis = getAllUniversities();
    setFilteredUniversities(allUnis);

    if (value) {
      const found = allUnis.find((uni) => uni.id === value || uni.nameAr === value || uni.name === value);
      if (found) {
        setSelectedUniversity(found);
      }
    }
  }, [value]);

  // Handle search and filter
  useEffect(() => {
    let results = searchQuery ? searchUniversities(searchQuery) : getAllUniversities();

    if (filterType !== 'all') {
      results = results.filter((uni) => uni.type === filterType);
    }

    setFilteredUniversities(results);
  }, [searchQuery, filterType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleSelect = (university: University) => {
    setSelectedUniversity(university);
    onChange(university.id, university.nameAr);
    setIsOpen(false);
    setSearchQuery('');
    setFilterType('all');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUniversity(null);
    setSearchQuery('');
    setFilterType('all');
    onChange('', '');
  };

  const handleToggleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {/* Main Button */}
      <button
        type="button"
        onClick={handleToggleOpen}
        disabled={disabled}
        className={`w-full px-4 py-3 h-11 bg-white dark:bg-slate-700 border-2 rounded-lg transition-all flex items-center justify-between text-end ${
          error ? 'border-red-500' : isOpen ? 'border-primary-500 dark:border-amber-500' : 'border-gray-300 dark:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-slate-500'}`}
      >
        <ChevronDown
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />

        <div className="flex items-center gap-2 flex-1">
          {selectedUniversity ? (
            <>
              <Building2 className="w-4 h-4 text-primary-600 dark:text-amber-500 flex-shrink-0" />
              <span className="text-end text-gray-900 dark:text-white truncate">{selectedUniversity.nameAr}</span>
              {!disabled && (
                <button
                  onClick={handleClear}
                  className="ms-auto p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </>
          ) : (
            <>
              <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-end text-gray-500 dark:text-gray-400">{window.__t("اختر الجامعة")}</span>
            </>
          )}
        </div>
      </button>

      {/* Error Message */}
      {error && <p className="text-red-500 text-xs mt-1 text-end">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute start-0 end-0 top-full z-50 mt-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-xl overflow-hidden"
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {/* Search Bar */}
          <div className="sticky top-0 bg-white dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600 p-3 space-y-2">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={window.__t("ابحث عن الجامعة...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-9 pe-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-800 text-end text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-amber-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 text-xs rounded font-medium transition ${
                  filterType === 'all'
                    ? 'bg-primary-100 dark:bg-amber-900 text-primary-700 dark:text-amber-200'
                    : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-500'
                }`}
              >
                {window.__t("الكل")}
              </button>
              <button
                type="button"
                onClick={() => setFilterType('public')}
                className={`px-3 py-1 text-xs rounded font-medium transition ${
                  filterType === 'public'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                    : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-500'
                }`}
              >
                {window.__t("حكومية")}
              </button>
              <button
                type="button"
                onClick={() => setFilterType('private')}
                className={`px-3 py-1 text-xs rounded font-medium transition ${
                  filterType === 'private'
                    ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200'
                    : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-500'
                }`}
              >
                {window.__t("خاصة")}
              </button>
            </div>
          </div>

          {/* University List */}
          {filteredUniversities.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-slate-600">
              {filteredUniversities.map((university) => (
                <li key={university.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(university)}
                    className="w-full px-4 py-3 text-end hover:bg-gray-100 dark:hover:bg-slate-600 transition flex items-center justify-between group"
                  >
                    <div className="flex-1 text-end">
                      <p className="font-medium text-gray-900 dark:text-white">{university.nameAr}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {university.city} • {university.type === 'public' ? window.__t("حكومية") : window.__t("خاصة")}
                      </p>
                    </div>
                    <Building2
                      className={`w-5 h-5 ms-3 flex-shrink-0 transition opacity-0 group-hover:opacity-100 ${
                        university.type === 'public'
                          ? 'text-blue-500'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              {window.__t("لم يتم العثور على جامعات")}
            </div>
          )}

          {/* Results Count */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-600 px-4 py-2 text-end text-xs text-gray-600 dark:text-gray-400">
            {filteredUniversities.length} {window.__t("جامعة")}
          </div>
        </div>
      )}
    </div>
  );
};
