import { useTheme } from '@/contexts/theme-context';

/**
 * Hook to get chart theme colors based on current app theme
 */
export const useChartTheme = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return {
    colors: {
      batting: isDark ? '#a78bfa' : '#8884d8', // purple
      bowling: isDark ? '#4ade80' : '#2ecc71', // green
      fielding: isDark ? '#60a5fa' : '#3498db', // blue
      team: isDark ? '#fb923c' : '#ff8042', // orange
      special: isDark ? '#38bdf8' : '#0088fe', // light blue
      negative: isDark ? '#f87171' : '#ff0000', // red
      captaincy: isDark ? '#f87171' : '#e74c3c', // red
      totalMVP: isDark ? '#facc15' : '#f1c40f', // yellow/gold
      total: isDark ? '#facc15' : '#8884d8', // main theme color
    },
    grid: {
      stroke: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    text: {
      fill: isDark ? '#e5e7eb' : '#374151', // gray-200 : gray-700
      contrast: isDark ? '#f9fafb' : '#ffffff', // always high contrast for chart labels
    },
    tooltip: {
      background: isDark ? '#1f2937' : '#ffffff', // gray-800 : white
      border: isDark ? '#374151' : '#e5e7eb', // gray-700 : gray-200
      text: isDark ? '#f9fafb' : '#111827', // gray-50 : gray-900
    }
  };
};