// Supabase Configuration
// IMPORTANT: Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://kqcwbmzzmnyidjfbftqx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxY3dibXp6bW55aWRqZmJmdHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NzQxMzUsImV4cCI6MjA3MTI1MDEzNX0.9Poc_A8fQat87jB884G_BIMKdV4bfhKgDFxTc7RmVXQ';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database table names
const TABLES = {
    USERS: 'users',
    FOOD_DONATIONS: 'food_donations',
    DONATION_REQUESTS: 'donation_requests',
    LOCATIONS: 'locations',
    NOTIFICATIONS: 'notifications'
};

// User roles
const USER_ROLES = {
    DONOR: 'donor',
    RECIPIENT: 'recipient',
    ADMIN: 'admin'
};

// Food status
const FOOD_STATUS = {
    AVAILABLE: 'available',
    PENDING: 'pending',
    COMPLETED: 'completed',
    EXPIRED: 'expired'
};

// Default map center (Jakarta)
const DEFAULT_LAT = -6.2088;
const DEFAULT_LNG = 106.8456;
const SEARCH_RADIUS_KM = 5;
