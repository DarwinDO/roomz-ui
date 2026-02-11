/**
 * SearchAutocomplete — District/location autocomplete dropdown
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PROVINCES, DISTRICTS_FALLBACK } from '@/data/vietnam-locations';

interface SearchAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (suggestion: string) => void;
    placeholder?: string;
    className?: string;
}

interface Suggestion {
    label: string;
    type: 'district' | 'province';
    province?: string;
}

/** Build a flat list of all districts + provinces for suggestions */
function buildSuggestionIndex(): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Add provinces
    for (const province of PROVINCES) {
        suggestions.push({ label: province.name, type: 'province' });
    }

    // Add districts from fallback data
    for (const [provinceName, districts] of Object.entries(DISTRICTS_FALLBACK)) {
        for (const district of districts) {
            suggestions.push({
                label: district.name,
                type: 'district',
                province: provinceName,
            });
        }
    }

    return suggestions;
}

/** Normalize Vietnamese diacritics for matching */
function normalize(str: string): string {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function SearchAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = 'Tìm kiếm địa điểm...',
    className = '',
}: SearchAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Build suggestion index once
    const allSuggestions = useMemo(() => buildSuggestionIndex(), []);

    // Filter suggestions based on input
    const filtered = useMemo(() => {
        if (!value || value.length < 1) return [];
        const q = normalize(value);
        return allSuggestions
            .filter(s => normalize(s.label).includes(q))
            .slice(0, 8);
    }, [value, allSuggestions]);

    // Show dropdown when there are matches
    useEffect(() => {
        setIsOpen(filtered.length > 0 && value.length >= 1);
        setActiveIndex(-1);
    }, [filtered.length, value]);

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Scroll active item into view
    useEffect(() => {
        if (activeIndex >= 0 && listRef.current) {
            const item = listRef.current.children[activeIndex] as HTMLElement;
            item?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex]);

    const selectSuggestion = useCallback(
        (suggestion: Suggestion) => {
            onChange(suggestion.label);
            onSelect?.(suggestion.label);
            setIsOpen(false);
        },
        [onChange, onSelect]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setActiveIndex(i => (i < filtered.length - 1 ? i + 1 : 0));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setActiveIndex(i => (i > 0 ? i - 1 : filtered.length - 1));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (activeIndex >= 0 && filtered[activeIndex]) {
                        selectSuggestion(filtered[activeIndex]);
                    }
                    break;
                case 'Escape':
                    setIsOpen(false);
                    break;
            }
        },
        [isOpen, filtered, activeIndex, selectSuggestion]
    );

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            <Input
                placeholder={placeholder}
                className="pl-10 pr-8 rounded-full border-border"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (filtered.length > 0) setIsOpen(true); }}
                role="combobox"
                aria-expanded={isOpen}
                aria-autocomplete="list"
                aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
            />

            {/* Clear button */}
            {value && (
                <button
                    onClick={() => { onChange(''); setIsOpen(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Xóa tìm kiếm"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            {/* Dropdown */}
            {isOpen && filtered.length > 0 && (
                <ul
                    ref={listRef}
                    role="listbox"
                    className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50 animate-slide-down"
                >
                    {filtered.map((suggestion, idx) => (
                        <li
                            key={`${suggestion.type}-${suggestion.label}-${idx}`}
                            id={`suggestion-${idx}`}
                            role="option"
                            aria-selected={idx === activeIndex}
                            onClick={() => selectSuggestion(suggestion)}
                            className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-colors text-sm ${idx === activeIndex
                                    ? 'bg-accent text-accent-foreground'
                                    : 'hover:bg-muted/50'
                                }`}
                        >
                            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                                <span className="font-medium">{suggestion.label}</span>
                                {suggestion.province && (
                                    <span className="text-xs text-muted-foreground ml-1.5">
                                        {suggestion.province}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider shrink-0">
                                {suggestion.type === 'district' ? 'Quận/Huyện' : 'Tỉnh/TP'}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
