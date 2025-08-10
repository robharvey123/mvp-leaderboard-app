/**
 * Supabase client configuration and initialization
 */

import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
let supabaseUrl: string | null = null;
let supabaseKey: string | null = null;

// Try to load from localStorage if available
try {
  supabaseUrl = localStorage.getItem('brookweald_supabase_url') || null;
  supabaseKey = localStorage.getItem('brookweald_supabase_key') || null;
} catch (error) {
  console.error('Error loading Supabase configuration from localStorage:', error);
}

// Create a Supabase client if we have configuration
export const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase is not configured. Please set URL and API key in storage settings.');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseKey;
};

// Configure Supabase with new credentials
export const configureSupabase = (url: string, key: string): void => {
  if (!url || !key) {
    throw new Error('Both Supabase URL and API key are required');
  }
  
  // Save to localStorage for persistence
  localStorage.setItem('brookweald_supabase_url', url);
  localStorage.setItem('brookweald_supabase_key', key);
  localStorage.setItem('brookweald_supabase_configured', 'true');
  
  // Update current values
  supabaseUrl = url;
  supabaseKey = key;
};

// Clear Supabase configuration
export const clearSupabaseConfig = (): void => {
  localStorage.removeItem('brookweald_supabase_url');
  localStorage.removeItem('brookweald_supabase_key');
  localStorage.removeItem('brookweald_supabase_configured');
  
  supabaseUrl = null;
  supabaseKey = null;
};