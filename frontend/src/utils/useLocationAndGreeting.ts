import { useState, useEffect } from 'react';
import { getGreeting, getLocationWithFallback, formatLocation, GreetingData } from './location';

interface UseLocationAndGreetingResult {
    greeting: GreetingData;
    location: string;
    locationDetails: {
        city: string;
        country: string;
        region: string;
        latitude: number;
        longitude: number;
    } | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

/**
 * Custom hook for location and time-based greeting
 */
export function useLocationAndGreeting(): UseLocationAndGreetingResult {
    const [greeting, setGreeting] = useState<GreetingData>(getGreeting());
    const [location, setLocation] = useState<string>('Mumbai, India');
    const [locationDetails, setLocationDetails] = useState<{
        city: string;
        country: string;
        region: string;
        latitude: number;
        longitude: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLocation = async () => {
        setLoading(true);
        setError(null);

        try {
            const locationData = await getLocationWithFallback();

            // Debug logging
            console.log('📍 Location detected:', locationData);

            setLocationDetails({
                city: locationData.city,
                country: locationData.country,
                region: locationData.region,
                latitude: locationData.latitude,
                longitude: locationData.longitude
            });

            setLocation(formatLocation(locationData.city, locationData.country));

            // Store in localStorage for faster subsequent loads
            localStorage.setItem('user_location', JSON.stringify({
                ...locationData,
                timestamp: Date.now()
            }));
        } catch (err) {
            console.error('Failed to fetch location:', err);
            setError('Could not determine location');

            // Try to use cached location
            const cached = localStorage.getItem('user_location');
            if (cached) {
                try {
                    const cachedData = JSON.parse(cached);
                    // Use cache if less than 24 hours old
                    if (Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000) {
                        console.log('📍 Using cached location:', cachedData);
                        setLocation(formatLocation(cachedData.city, cachedData.country));
                        setLocationDetails({
                            city: cachedData.city,
                            country: cachedData.country,
                            region: cachedData.region,
                            latitude: cachedData.latitude,
                            longitude: cachedData.longitude
                        });
                    }
                } catch (parseError) {
                    console.error('Failed to parse cached location');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Update greeting every minute
        const updateGreeting = () => {
            setGreeting(getGreeting());
        };

        updateGreeting();
        const greetingInterval = setInterval(updateGreeting, 60000); // Update every minute

        // Fetch location on mount
        fetchLocation();

        return () => {
            clearInterval(greetingInterval);
        };
    }, []);

    return {
        greeting,
        location,
        locationDetails,
        loading,
        error,
        refresh: fetchLocation
    };
}
