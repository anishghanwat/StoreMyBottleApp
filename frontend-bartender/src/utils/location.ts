/**
 * Location and time-based utilities
 */

export interface LocationData {
    city: string;
    country: string;
    region: string;
    latitude: number;
    longitude: number;
    loading: boolean;
    error: string | null;
}

export interface GreetingData {
    greeting: string;
    emoji: string;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

/**
 * Get time-based greeting
 */
export function getGreeting(): GreetingData {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
        return {
            greeting: 'Good Morning',
            emoji: '☀️',
            timeOfDay: 'morning'
        };
    } else if (hour >= 12 && hour < 17) {
        return {
            greeting: 'Good Afternoon',
            emoji: '🌤️',
            timeOfDay: 'afternoon'
        };
    } else if (hour >= 17 && hour < 21) {
        return {
            greeting: 'Good Evening',
            emoji: '🌙',
            timeOfDay: 'evening'
        };
    } else {
        return {
            greeting: 'Good Night',
            emoji: '✨',
            timeOfDay: 'night'
        };
    }
}

/**
 * Get user's location using browser geolocation API
 */
export async function getUserLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
            (error) => reject(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // Cache for 5 minutes
            }
        );
    });
}

/**
 * Reverse geocode coordinates to get city name
 * Using OpenStreetMap Nominatim API (free, no API key required)
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<{
    city: string;
    country: string;
    region: string;
}> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'StoreMyBottle/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch location data');
        }

        const data = await response.json();
        const address = data.address || {};

        // Try multiple fields to get the city name
        // Prioritize city/town over county/state_district for better accuracy
        let city = address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            'Unknown';

        // If we only got a county/district (like "Mulshi"), try to map to nearest major city
        if (city === 'Unknown' || !address.city) {
            const district = address.county || address.state_district;
            const state = address.state;

            // Map common Pune districts to Pune city
            const puneDistricts = ['mulshi', 'pune', 'haveli', 'maval', 'bhor', 'baramati', 'daund'];
            if (district && state === 'Maharashtra' && puneDistricts.some(d => district.toLowerCase().includes(d))) {
                city = 'Pune';
            } else if (district) {
                city = district;
            }
        }

        return {
            city: city,
            country: address.country || 'Unknown',
            region: address.state || address.region || ''
        };
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        throw error;
    }
}

/**
 * Get location from IP address (fallback method)
 * Using ipapi.co (free tier: 1000 requests/day)
 */
export async function getLocationFromIP(): Promise<{
    city: string;
    country: string;
    region: string;
    latitude: number;
    longitude: number;
}> {
    try {
        const response = await fetch('https://ipapi.co/json/');

        if (!response.ok) {
            throw new Error('Failed to fetch IP location');
        }

        const data = await response.json();

        return {
            city: data.city || 'Unknown',
            country: data.country_name || 'Unknown',
            region: data.region || '',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0
        };
    } catch (error) {
        console.error('IP location error:', error);
        throw error;
    }
}

/**
 * Get user's location with fallback to IP-based location
 */
export async function getLocationWithFallback(): Promise<{
    city: string;
    country: string;
    region: string;
    latitude: number;
    longitude: number;
    method: 'gps' | 'ip' | 'default';
}> {
    // Try GPS first
    try {
        const position = await getUserLocation();
        const { latitude, longitude } = position.coords;

        try {
            const location = await reverseGeocode(latitude, longitude);
            return {
                ...location,
                latitude,
                longitude,
                method: 'gps'
            };
        } catch (geocodeError) {
            console.warn('Geocoding failed, trying IP fallback');
        }
    } catch (gpsError) {
        console.warn('GPS location failed, trying IP fallback');
    }

    // Fallback to IP-based location
    try {
        const location = await getLocationFromIP();
        return {
            ...location,
            method: 'ip'
        };
    } catch (ipError) {
        console.warn('IP location failed, using default');
    }

    // Final fallback
    return {
        city: 'Mumbai',
        country: 'India',
        region: 'Maharashtra',
        latitude: 19.0760,
        longitude: 72.8777,
        method: 'default'
    };
}

/**
 * Format location string
 */
export function formatLocation(city: string, country: string): string {
    if (city === 'Unknown' && country === 'Unknown') {
        return 'Location unavailable';
    }
    if (city === 'Unknown') {
        return country;
    }
    if (country === 'Unknown') {
        return city;
    }
    return `${city}, ${country}`;
}
