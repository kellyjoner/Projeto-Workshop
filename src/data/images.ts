/**
 * The Stitch exports pointed at short-lived `lh3.googleusercontent.com/aida-public`
 * URLs, which expire and render as broken images. Everything visual here is
 * rebuilt on stable public sources instead:
 *
 *  - photos  -> Unsplash (deterministic ids, sized + compressed per use)
 *  - avatars -> Pravatar (deterministic per username)
 *  - fallback-> Picsum, wired through <Img> so nothing can ever render broken
 *
 * When real media lands in the database, only these helpers change.
 */

const UNSPLASH = 'https://images.unsplash.com/photo-'

/** Curated wellness/fitness/nutrition photo ids, grouped by theme. */
export const PHOTOS = {
  food: [
    '1546069901-ba9599a7e63c',
    '1512621776951-a57141f2eefd',
    '1540189549336-e6e99c3679fe',
    '1490645935967-10de6ba17061',
    '1498837167922-ddd27525d352',
    '1494390248081-4e521a5940db',
  ],
  run: [
    '1552674605-db6ffd4facb5',
    '1518611012118-696072aa579a',
    '1461896836934-ffe607ba8211',
    '1571008887538-b36bb32f4571',
  ],
  bike: ['1476480862126-209bfaa8edc8', '1533560904424-a0c61dc306fc', '1485965120184-e220f721d03e'],
  yoga: ['1506126613408-eca07ce68773', '1544367567-0f2fcb009e0b', '1518611012118-696072aa579a'],
  gym: ['1571019613454-1cb2f99b2d8b', '1517836357463-d25dfeac3438', '1534438327276-14e5300c3a48'],
  nature: ['1441974231531-c6227db76b6e', '1502680390469-be75c86b636f', '1470770841072-f978cf4d019e'],
} as const

export type PhotoTheme = keyof typeof PHOTOS

/** Deterministic photo URL: same (theme, index) always yields the same image. */
export function photo(theme: PhotoTheme, index = 0, w = 900): string {
  const pool = PHOTOS[theme]
  const id = pool[index % pool.length]
  return `${UNSPLASH}${id}?auto=format&fit=crop&w=${w}&q=70`
}

/** Deterministic avatar for a handle. */
export function avatar(handle: string, size = 160): string {
  return `https://i.pravatar.cc/${size}?u=${encodeURIComponent(handle)}`
}

/** Last-resort image so a card never shows a broken-image icon. */
export function fallback(seed: string, w = 900, h = 700): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}
