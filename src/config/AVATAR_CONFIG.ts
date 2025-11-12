/**
 * Avatar Configuration
 *
 * Available avatars for player selection
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-12
 */

import { t } from '../localization/i18n';

/**
 * Avatar option interface
 *
 * @property id - Avatar identifier (e.g., 'hero1', 'hero2')
 * @property filename - Avatar filename (e.g., 'hero1.png')
 * @property displayName - Fallback display name (English)
 */
export interface AvatarOption {
  id: string;
  filename: string;
  displayName: string;
}

export const AVAILABLE_AVATARS: AvatarOption[] = [
  {
    id: 'hero1',
    filename: 'hero1.png',
    displayName: 'Knight'
  },
  {
    id: 'hero2',
    filename: 'hero2.png',
    displayName: 'Ranger'
  },
  {
    id: 'hero3',
    filename: 'hero3.png',
    displayName: 'Mage'
  },
  {
    id: 'hero4',
    filename: 'hero4.png',
    displayName: 'Shieldbearer'
  },
  {
    id: 'hero5',
    filename: 'hero5.png',
    displayName: 'Bard'
  }
];

export const DEFAULT_AVATAR = 'hero1.png';

/**
 * Get localized avatar display name
 *
 * @description Returns the localized display name for an avatar based on its ID.
 * Falls back to the static displayName if translation is not available.
 *
 * @param avatarId - Avatar identifier (e.g., 'hero1', 'hero2')
 * @returns Localized display name
 *
 * @example
 * ```typescript
 * getAvatarDisplayName('hero1'); // Returns "Knight" (en) or "Rytíř" (cs)
 * getAvatarDisplayName('hero3'); // Returns "Mage" (en) or "Kouzelník" (cs)
 * ```
 */
export function getAvatarDisplayName(avatarId: string): string {
  return t(`avatars.${avatarId}`);
}
