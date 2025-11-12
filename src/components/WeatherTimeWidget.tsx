/**
 * Weather & Time of Day Widget Component
 *
 * Displays current weather and time of day with icons and countdown timers
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-12
 */

import React from 'react';
import type { WeatherState, TimeState } from '../types/worldmap.types';
import { WeatherSystem } from '../engine/worldmap/WeatherSystem';
import { TimeOfDaySystem } from '../engine/worldmap/TimeOfDaySystem';

interface WeatherTimeWidgetProps {
  weather: WeatherState;
  timeOfDay: TimeState;
}

/**
 * Weather & Time of Day Widget
 *
 * @description Displays current weather and time of day with visual indicators
 * @param props - Component props
 * @returns React component
 */
export function WeatherTimeWidget({ weather, timeOfDay }: WeatherTimeWidgetProps) {
  const weatherDisplay = WeatherSystem.getWeatherDisplay(weather.current);
  const timeDisplay = TimeOfDaySystem.getTimeDisplay(timeOfDay.current);
  const weatherTimeRemaining = WeatherSystem.getTimeUntilChange(weather);
  const timeTimeRemaining = TimeOfDaySystem.getTimeUntilChange(timeOfDay);

  return (
    <div style={styles.container}>
      {/* Weather Section */}
      <div style={styles.section}>
        <div style={styles.iconRow}>
          <span style={{ fontSize: '24px' }}>{weatherDisplay.icon}</span>
          <div style={styles.labelColumn}>
            <span style={{ ...styles.label, color: weatherDisplay.color }}>{weatherDisplay.label}</span>
            <span style={styles.countdown}>{weatherTimeRemaining}</span>
          </div>
        </div>
        {/* Next Weather Preview */}
        <div style={styles.nextPreview}>
          <span style={styles.nextLabel}>Next: {WeatherSystem.getWeatherDisplay(weather.next).icon}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Time of Day Section */}
      <div style={styles.section}>
        <div style={styles.iconRow}>
          <span style={{ fontSize: '24px' }}>{timeDisplay.icon}</span>
          <div style={styles.labelColumn}>
            <span style={{ ...styles.label, color: timeDisplay.color }}>{timeDisplay.label}</span>
            <span style={styles.countdown}>{timeTimeRemaining}</span>
          </div>
        </div>
        {/* Next Time Preview */}
        <div style={styles.nextPreview}>
          <span style={styles.nextLabel}>Next: {TimeOfDaySystem.getTimeDisplay(timeOfDay.next).icon}</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: '60px',
    right: '10px',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #333',
    zIndex: 10,
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '140px'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  iconRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  labelColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    lineHeight: '1.2'
  },
  countdown: {
    fontSize: '11px',
    color: '#9ca3af',
    fontStyle: 'italic'
  },
  nextPreview: {
    fontSize: '11px',
    color: '#6b7280',
    paddingLeft: '34px'
  },
  nextLabel: {
    fontSize: '11px'
  },
  divider: {
    height: '1px',
    backgroundColor: '#444',
    margin: '4px 0'
  }
};
