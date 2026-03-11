import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  filterMapboxSuggestions,
  mapboxFeatureToSelectedPlace,
  shouldUseAddressSuggestions,
  type MapboxFeature,
  type SelectedMapboxPlace,
} from './mapboxGeocoding.utils';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface MapboxGeocodingProps {
  value?: string;
  onChange: (value: string) => void;
  onSelect: (place: SelectedMapboxPlace) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  suppressSuggestions?: boolean;
}

export function MapboxGeocoding({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Nhập địa chỉ...',
  disabled = false,
  className = '',
  suppressSuggestions = false,
}: MapboxGeocodingProps) {
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query || query.length < 3 || !MAPBOX_TOKEN) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const shouldIncludeAddresses = shouldUseAddressSuggestions(query);
        const types = shouldIncludeAddresses
          ? 'address,district,locality,place,region'
          : 'district,locality,place,region';

        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
            `access_token=${MAPBOX_TOKEN}&` +
            'country=vn&' +
            'language=vi&' +
            `types=${types}&` +
            'fuzzyMatch=false&' +
            'limit=5',
        );

        if (!response.ok) {
          throw new Error('Failed to fetch geocoding suggestions');
        }

        const data = (await response.json()) as { features?: MapboxFeature[] };
        const nextSuggestions = filterMapboxSuggestions(data.features || [], query);

        setSuggestions(nextSuggestions);
        setShowSuggestions(!suppressSuggestions && nextSuggestions.length > 0);
        setActiveIndex(-1);
      } catch (error) {
        console.error('Geocoding error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    },
    [suppressSuggestions],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (suppressSuggestions) {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }, [suppressSuggestions]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    onChange(nextValue);
    setActiveIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(nextValue);
    }, 300);
  };

  const handleSelect = (feature: MapboxFeature) => {
    const selectedPlace = mapboxFeatureToSelectedPlace(feature);

    onChange(selectedPlace.address);
    onSelect(selectedPlace);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((current) => (current < suggestions.length - 1 ? current + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((current) => (current > 0 ? current - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          event.preventDefault();
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className="rounded-full border-border pl-10 pr-10"
        onFocus={() => value.length >= 3 && suggestions.length > 0 && !suppressSuggestions && setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        role="combobox"
        aria-expanded={showSuggestions}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `mapbox-suggestion-${activeIndex}` : undefined}
      />

      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {!isLoading && value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {showSuggestions && suggestions.length > 0 && !suppressSuggestions && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-border bg-popover shadow-lg"
        >
          {suggestions.map((feature, index) => (
            <li
              key={feature.id}
              id={`mapbox-suggestion-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => handleSelect(feature)}
              className={`cursor-pointer border-b border-border px-4 py-3 last:border-0 ${
                index === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{feature.place_name}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!MAPBOX_TOKEN && value.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Mapbox chưa được cấu hình. Đang dùng nhập tay.
        </p>
      )}
    </div>
  );
}
