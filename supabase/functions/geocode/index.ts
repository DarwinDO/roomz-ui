/**
 * Geocode Edge Function
 * Chuyển địa chỉ thành tọa độ (lat, lng) sử dụng Google Geocoding API
 * 
 * POST /functions/v1/geocode
 * Body: { address: string }
 * Response: { lat: number, lng: number, formatted_address: string }
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

interface GeocodeRequest {
    address: string;
}

interface GeocodeResponse {
    lat: number;
    lng: number;
    formatted_address: string;
    city?: string;
    district?: string;
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
        const { address }: GeocodeRequest = await req.json();

        if (!address || typeof address !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Address is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Call Google Geocoding API
        const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
        url.searchParams.set('address', address);
        url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
        url.searchParams.set('region', 'vn'); // Prefer Vietnam results
        url.searchParams.set('language', 'vi'); // Vietnamese language

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status !== 'OK') {
            return new Response(
                JSON.stringify({ error: `Geocoding failed: ${data.status}`, details: data.error_message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!data.results || data.results.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No results found for this address' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Extract location data
        const result = data.results[0];
        const location = result.geometry.location;
        const formattedAddress = result.formatted_address;

        // Extract city and district from address components
        let city = '';
        let district = '';

        result.address_components?.forEach((component: any) => {
            const types = component.types;
            if (types.includes('administrative_area_level_1')) {
                city = component.long_name;
            }
            if (types.includes('administrative_area_level_2') || types.includes('locality') || types.includes('sublocality_level_1')) {
                district = component.long_name;
            }
        });

        const responseData: GeocodeResponse = {
            lat: location.lat,
            lng: location.lng,
            formatted_address: formattedAddress,
            city,
            district,
        };

        return new Response(
            JSON.stringify(responseData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Geocoding error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});