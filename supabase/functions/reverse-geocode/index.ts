/**
 * Reverse Geocode Edge Function
 * Chuyển tọa độ (lat, lng) thành địa chỉ sử dụng Google Geocoding API
 * 
 * POST /functions/v1/reverse-geocode
 * Body: { lat: number, lng: number }
 * Response: { address: string, city?: string, district?: string }
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

interface ReverseGeocodeRequest {
    lat: number;
    lng: number;
}

interface ReverseGeocodeResponse {
    address: string;
    city?: string;
    district?: string;
    street?: string;
}

serve(async (req) => {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Check API key
        if (!GOOGLE_MAPS_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'Server configuration error: Missing API key' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Parse request body
        const { lat, lng }: ReverseGeocodeRequest = await req.json();

        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return new Response(
                JSON.stringify({ error: 'Valid lat and lng coordinates are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate coordinates
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return new Response(
                JSON.stringify({ error: 'Invalid coordinates' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Call Google Reverse Geocoding API
        const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
        url.searchParams.set('latlng', `${lat},${lng}`);
        url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
        url.searchParams.set('language', 'vi'); // Vietnamese language

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status !== 'OK') {
            return new Response(
                JSON.stringify({ error: `Reverse geocoding failed: ${data.status}`, details: data.error_message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!data.results || data.results.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No address found for these coordinates' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Extract address data
        const result = data.results[0];
        const formattedAddress = result.formatted_address;

        // Extract components
        let city = '';
        let district = '';
        let street = '';

        result.address_components?.forEach((component: any) => {
            const types = component.types;

            if (types.includes('administrative_area_level_1')) {
                city = component.long_name;
            }
            if (types.includes('administrative_area_level_2') || types.includes('locality')) {
                district = component.long_name;
            }
            if (types.includes('route')) {
                street = component.long_name;
            }
            if (types.includes('street_number')) {
                street = `${component.long_name} ${street}`;
            }
        });

        const responseData: ReverseGeocodeResponse = {
            address: formattedAddress,
            city,
            district,
            street: street || undefined,
        };

        return new Response(
            JSON.stringify(responseData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});