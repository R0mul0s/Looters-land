/**
 * Weather & Time of Day Widget Component
 *
 * Displays current weather and time of day with icons and countdown timers.
 * Updates every second to show live countdown to next weather/time change.
 * Supports localization for all text labels.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-15
 */

import React from 'react';
import type { WeatherState, TimeState } from '../types/worldmap.types';
import { WeatherSystem } from '../engine/worldmap/WeatherSystem';
import { TimeOfDaySystem } from '../engine/worldmap/TimeOfDaySystem';
import { useTranslation } from '../hooks/useTranslation';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS, Z_INDEX, BLUR, HEIGHTS } from '../styles/tokens';
import { flexColumn } from '../styles/common';

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
  const { t } = useTranslation();

  // Force re-render every second to update countdown
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate();
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const weatherDisplay = WeatherSystem.getWeatherDisplay(weather.current, t);
  const timeDisplay = TimeOfDaySystem.getTimeDisplay(timeOfDay.current, t);
  const weatherTimeRemaining = WeatherSystem.getTimeUntilChange(weather, t);
  const timeTimeRemaining = TimeOfDaySystem.getTimeUntilChange(timeOfDay, t);

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
          <span style={styles.nextLabel}>{t('weather.next')} {WeatherSystem.getWeatherDisplay(weather.next, t).icon}</span>
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
          <span style={styles.nextLabel}>{t('weather.next')} {TimeOfDaySystem.getTimeDisplay(timeOfDay.next, t).icon}</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    ...flexColumn,
    position: 'absolute',
    top: HEIGHTS.header,
    right: SPACING[3],
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    padding: SPACING[3],
    borderRadius: BORDER_RADIUS.md,
    border: `1px solid ${COLORS.borderDark}`,
    zIndex: Z_INDEX.dropdown,
    backdropFilter: BLUR.md,
    boxShadow: SHADOWS.card,
    gap: SPACING[2],
    minWidth: '140px'
  },
  section: {
    ...flexColumn,
    gap: SPACING[1]
  },
  iconRow: {
    display: 'flex',
    alignItems: 'center',
    gap: SPACING[3]
  },
  labelColumn: {
    ...flexColumn,
    gap: SPACING.xxs
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: '1.2'
  },
  countdown: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textGray,
    fontStyle: 'italic'
  },
  nextPreview: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textDarkGray,
    paddingLeft: '34px'
  },
  nextLabel: {
    fontSize: FONT_SIZE.xs
  },
  divider: {
    height: '1px',
    backgroundColor: COLORS.borderDarker,
    margin: `${SPACING[1]} 0`
  }
};
