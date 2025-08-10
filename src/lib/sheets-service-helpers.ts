/**
 * Google Sheets Service Helpers
 * 
 * Helper functions for the Google Sheets service implementation
 */

import { v4 as uuid } from 'uuid';

// Google Sheets simulation configuration
export const STORAGE_PREFIX = 'brookweald_sheets_';

// Sheet names for different data types
export const SHEET_NAMES = {
  USERS: `${STORAGE_PREFIX}users`,
  PLAYERS: `${STORAGE_PREFIX}players`,
  SEASONS: `${STORAGE_PREFIX}seasons`,
  MATCHES: `${STORAGE_PREFIX}matches`,
  BATTING: `${STORAGE_PREFIX}batting`,
  BOWLING: `${STORAGE_PREFIX}bowling`,
  FIELDING: `${STORAGE_PREFIX}fielding`,
  SPECIAL: `${STORAGE_PREFIX}special`,
  LEADERBOARDS: `${STORAGE_PREFIX}leaderboards`,
  MVP_ENTRIES: `${STORAGE_PREFIX}mvp_entries`,
  ACTIVE_SEASON: `${STORAGE_PREFIX}active_season`,
  AUTH_TOKEN: `${STORAGE_PREFIX}auth_token`,
  CURRENT_USER: `${STORAGE_PREFIX}current_user`,
};

// Helper functions to interact with localStorage as if it were Google Sheets
export function getFromSheet<T>(sheetName: string): T[] {
  try {
    const data = localStorage.getItem(sheetName);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error retrieving data from ${sheetName}:`, error);
    return [];
  }
}

export function saveToSheet<T>(sheetName: string, data: T[]): void {
  try {
    localStorage.setItem(sheetName, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving data to ${sheetName}:`, error);
    throw new Error(`Failed to save data to storage: ${error}`);
  }
}

export function getItemById<T extends Record<string, unknown>>(
  sheetName: string,
  idField: string,
  id: string
): T | undefined {
  const items = getFromSheet<T>(sheetName);
  return items.find(item => item[idField] === id);
}

export function saveItemToSheet<T extends Record<string, unknown>>(
  sheetName: string,
  idField: string,
  item: T
): T {
  const items = getFromSheet<T>(sheetName);
  const existingIndex = items.findIndex(i => i[idField] === item[idField]);
  
  if (existingIndex >= 0) {
    // Update existing item
    items[existingIndex] = { ...items[existingIndex], ...item };
  } else {
    // Add new item
    items.push(item);
  }
  
  saveToSheet(sheetName, items);
  return item;
}

export function removeItemFromSheet<T extends Record<string, unknown>>(
  sheetName: string,
  idField: string,
  id: string
): boolean {
  const items = getFromSheet<T>(sheetName);
  const initialLength = items.length;
  const filteredItems = items.filter(item => item[idField] !== id);
  
  if (filteredItems.length !== initialLength) {
    saveToSheet(sheetName, filteredItems);
    return true;
  }
  
  return false;
}