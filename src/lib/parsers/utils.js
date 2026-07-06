/**
 * Extracts base product name, color, and size based on specific format rules.
 */
export function parseProductString(rawString, format = 'size_color') {
  if (!rawString) return { baseProductName: 'Unknown', color: 'Uncategorized', size: 'Uncategorized' };

  let str = rawString.trim();

  // Rule 6-1: Remove 'VFF ' prefix if it exists
  if (str.startsWith('VFF ')) {
    str = str.substring(4).trim();
  }

  // Regex to match <BaseName>(<Attr1>, <Attr2>)
  // Allows optional space before opening parenthesis and optional spaces around comma
  const match = str.match(/^(.+?)\s*\(([^,]+),\s*(.+)\)$/);

  if (!match) {
    return {
      baseProductName: str,
      color: 'Uncategorized',
      size: 'Uncategorized'
    };
  }

  const baseProductName = match[1].trim();
  const attr1 = match[2].trim();
  const attr2 = match[3].trim();

  let color = 'Uncategorized';
  let size = 'Uncategorized';

  if (format === 'color_size') {
    color = attr1;
    size = attr2;
  } else {
    // default to size_color
    size = attr1;
    color = attr2;
  }

  return {
    baseProductName,
    color,
    size
  };
}
