import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Building2, X, BookOpen } from 'lucide-react';
import { Faculty, searchFaculties, getAllFaculties, getFacultiesByAccess } from '../data/tunisianFaculties';

interface FacultySelectorProps {
  value: string;
  onChange: (facultyId: string, facultyName: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export const FacultySelector: React.FC<FacultySelectorProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFaculties, setFilteredFaculties] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [filterAccess, setFilterAccess] = useState<'all' | 'public' | 'private'>('all');
  const [currentLang, setCurrentLang] = useState(document.documentElement.lang || 'ar');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Watch for language changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setCurrentLang(document.documentElement.lang || 'ar');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => observer.disconnect();
  }, []);

  // Initialize - load all faculties
  useEffect(() => {
    const allFacs = getAllFaculties(currentLang);
    setFilteredFaculties(allFacs);

    if (value) {
      const found = allFacs.find(
        (fac) => fac.id.toString() === value || fac.name_ar === value || fac.name_fr === value || fac.slug === value
      );
      if (found) {
        setSelectedFaculty(found);
      }
    }
  }, [value, currentLang]);

  // Handle search and filter
  useEffect(() => {
    let results = searchQuery ? searchFaculties(searchQuery, currentLang) : getAllFaculties(currentLang);

    if (filterAccess !== 'all') {
      results = results.filter((fac) => fac.public === (filterAccess === 'public'));
    }

    setFilteredFaculties(results);
  }, [searchQuery, filterAccess, currentLang]);

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

  const handleSelect = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    onChange(faculty.id.toString(), faculty.name);
    setIsOpen(false);
    setSearchQuery('');
    setFilterAccess('all');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFaculty(null);
    setSearchQuery('');
    setFilterAccess('all');
    onChange('', '');
  };

  const handleToggleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const getTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      faculte: window.__t("كلية"),
      institut: window.__t("معهد"),
      ecole: window.__t("مدرسة"),
    };
    
    // In French, use French labels if possible
    if (currentLang === 'fr') {
      const frTypeMap: Record<string, string> = {
        faculte: "Faculté",
        institut: "Institut",
        ecole: "École",
      };
      return frTypeMap[type] || type;
    }
    
    return typeMap[type] || type;
  };

  const getAccessBadge = (isPublic: boolean) => {
    if (currentLang === 'fr') {
      return isPublic ? "Gouvernemental" : "Privée";
    }
    return isPublic ? window.__t("🟦 حكومية") : window.__t("🟧 خاصة");
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {/* Main Button with relative positioning for clear button */}
      <div className="relative">
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
            {selectedFaculty ? (
              <>
                <BookOpen className="w-4 h-4 text-primary-600 dark:text-amber-500 flex-shrink-0" />
                <div className="flex-1 text-end min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedFaculty.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selectedFaculty.university || selectedFaculty.city} • {getTypeLabel(selectedFaculty.type)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-end text-gray-500 dark:text-gray-400 flex-1">{window.__t("اختر الكلية أو المؤسسة")}</span>
              </>
            )}
          </div>
        </button>

        {/* Clear button - positioned absolutely outside main button */}
        {!disabled && selectedFaculty && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute start-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition z-10"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 text-xs mt-1 text-end">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute start-0 end-0 top-full z-50 mt-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-xl overflow-hidden"
          style={{
            maxHeight: '450px',
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
                placeholder={window.__t("ابحث في الكليات والمؤسسات...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-9 pe-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-800 text-end text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-amber-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setFilterAccess('all')}
                className={`px-3 py-1 text-xs rounded font-medium transition ${
                  filterAccess === 'all'
                    ? 'bg-primary-100 dark:bg-amber-900 text-primary-700 dark:text-amber-200'
                    : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-500'
                }`}
              >
                {window.__t("الكل")}
              </button>
              <button
                type="button"
                onClick={() => setFilterAccess('public')}
                className={`px-3 py-1 text-xs rounded font-medium transition ${
                  filterAccess === 'public'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                    : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-500'
                }`}
              >
                {window.__t("🟦 حكومية")}
              </button>
              <button
                type="button"
                onClick={() => setFilterAccess('private')}
                className={`px-3 py-1 text-xs rounded font-medium transition ${
                  filterAccess === 'private'
                    ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200'
                    : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-500'
                }`}
              >
                {window.__t("🟧 خاصة")}
              </button>
            </div>
          </div>

          {/* Faculty List */}
          {filteredFaculties.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-slate-600">
              {filteredFaculties.map((faculty) => (
                <li key={faculty.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(faculty)}
                    className="w-full px-4 py-3 text-end hover:bg-gray-100 dark:hover:bg-slate-600 transition flex items-center justify-between group"
                  >
                    <div className="flex-1 text-end min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{faculty.name}</p>
                      <div className="flex gap-2 justify-end mt-1 flex-wrap">
                        <span className="text-xs bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                          {getTypeLabel(faculty.type)}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            faculty.public
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                              : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200'
                          }`}
                        >
                          {currentLang === 'fr' && (faculty.public ? '🟦 ' : '🟧 ')}
                          {getAccessBadge(faculty.public)}
                        </span>
                      </div>
                      {faculty.university && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{faculty.university}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {faculty.city}
                        {faculty.specialities.length > 0 && ` • ${faculty.specialities.slice(0, 2).join(', ')}`}
                      </p>
                    </div>
                    <BookOpen
                      className={`w-5 h-5 ms-3 flex-shrink-0 transition opacity-0 group-hover:opacity-100 ${
                        faculty.public
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
              {window.__t("لم يتم العثور على كليات أو مؤسسات")}
            </div>
          )}

          {/* Results Count & Info */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-600 px-4 py-2 text-end text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between items-center flex-row-reverse">
              <span>{filteredFaculties.length} {window.__t("نتيجة")}</span>
              <span className="text-gray-500 dark:text-gray-500 text-xs">
                {filteredFaculties.filter((f) => f.public).length} {window.__t("حكومية •")}
                {filteredFaculties.filter((f) => !f.public).length} {window.__t("خاصة")}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
