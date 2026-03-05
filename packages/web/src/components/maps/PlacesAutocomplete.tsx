/**
 * PlacesAutocomplete - Google Places Autocomplete cho địa chỉ
 * Sử dụng Places Library của Google Maps JavaScript API
 * 
 * Features:
 * - Autocomplete địa chỉ VN
 * - Lấy tọa độ từ địa chỉ
 * - Hiển thị suggestions
 */
import { useState, useRef, useCallback } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlacesAutocompleteProps {
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

export function PlacesAutocomplete({
    value = '',
    onChange,
    onSelect,
    placeholder = 'Nhập địa chỉ...',
    disabled = false,
}: PlacesAutocompleteProps) {
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle place selection
    const onPlaceChanged = useCallback(() => {
        if (autocomplete) {
            const place = autocomplete.getPlace();

            if (place.geometry?.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const address = place.formatted_address || '';

                // Extract city and district from address components
                let city = '';
                let district = '';

                place.address_components?.forEach((component) => {
                    const types = component.types;
                    if (types.includes('administrative_area_level_1')) {
                        city = component.long_name;
                    }
                    if (types.includes('administrative_area_level_2') || types.includes('locality')) {
                        district = component.long_name;
                    }
                });

                onChange(address);
                onSelect({
                    address,
                    lat,
                    lng,
                    city,
                    district,
                });
            }
        }
    }, [autocomplete, onChange, onSelect]);

    // Clear input
    const handleClear = () => {
        onChange('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <Autocomplete
            onLoad={setAutocomplete}
            onPlaceChanged={onPlaceChanged}
            options={{
                componentRestrictions: { country: 'vn' }, // Chỉ VN
                types: ['address'], // Chỉ địa chỉ
                fields: ['formatted_address', 'geometry', 'address_components'], // Chỉ lấy fields cần thiết
            }}
        >
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="pl-10 pr-10"
                />
                {value && (
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
            </div>
        </Autocomplete>
    );
}