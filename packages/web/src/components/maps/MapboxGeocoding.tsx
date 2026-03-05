/**
 * MapboxGeocoding - Autocomplete địa chỉ với Mapbox Geocoding API
 * Thay thế PlacesAutocomplete của Google
 * 
 * Features:
 * - Autocomplete địa chỉ VN
 * - Lấy tọa độ từ địa chỉ
 * - Forward geocoding
 */
import { useState, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface MapboxGeocodingProps {
    value?: string;
    onChange: (value: string) => void;
    onSelect: (place: {
        address: string;
        lat: number;
        lng: number;
        city?: string;
        district?: string;
    }) => void;
    placeholder?: string;
    disabled?: boolean;
}

interface GeocodingResult {
    id: string;
    place_name: string;
    center: [number, number]; // [lng, lat]
    context?: Array<{
        id: string;
        text: string;
    }>;
}

export function MapboxGeocoding({
    value = '',
    onChange,
    onSelect,
    placeholder = 'Nhập địa chỉ...',
    disabled = false,
}: MapboxGeocodingProps) {
    const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch suggestions từ Mapbox Geocoding API
    const fetchSuggestions = useCallback(async (query: string) => {
        if (!query || query.length < 3 || !MAPBOX_TOKEN) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
                `access_token=${MAPBOX_TOKEN}&` +
                `country=vn&` + // Chỉ VN
                `language=vi&` + // Tiếng Việt
                `types=address,place,locality&` + // Chỉ địa chỉ và địa danh
                `limit=5`
            );

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            setSuggestions(data.features || []);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Geocoding error:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle input change với debounce
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        // Debounce 300ms
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            fetchSuggestions(newValue);
        }, 300);
    };

    // Handle select suggestion
    const handleSelect = (result: GeocodingResult) => {
        const [lng, lat] = result.center;

        // Extract city and district from context
        let city = '';
        let district = '';

        result.context?.forEach((ctx) => {
            if (ctx.id.startsWith('region.')) {
                city = ctx.text;
            }
            if (ctx.id.startsWith('district.') || ctx.id.startsWith('place.')) {
                district = ctx.text;
            }
        });

        onChange(result.place_name);
        onSelect({
            address: result.place_name,
            lat,
            lng,
            city,
            district,
        });

        setShowSuggestions(false);
        setSuggestions([]);
    };

    // Clear input
    const handleClear = () => {
        onChange('');
        setSuggestions([]);
        setShowSuggestions(false);
    };

    if (!MAPBOX_TOKEN) {
        return (
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Mapbox chưa được cấu hình"
                disabled={true}
                className="pl-10"
            />
        );
    }

    return (
        <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
                value={value}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={disabled}
                className="pl-10 pr-10"
                onFocus={() => value.length >= 3 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
            {!isLoading && value && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                >
                    <X className="w-4 h-4" />
                </Button>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((result) => (
                        <li
                            key={result.id}
                            onClick={() => handleSelect(result)}
                            className="px-4 py-3 hover:bg-muted cursor-pointer border-b border-border last:border-0"
                        >
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{result.place_name}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}