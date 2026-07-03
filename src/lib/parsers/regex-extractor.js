/**
 * Extracts base product name, color, and size from a raw product string.
 * Example inputs:
 * "V-SOUL (SV,W40)" -> base: V-SOUL, color: SV, size: W40
 * "VFF0008(PP,W36)" -> base: VFF0008, color: PP, size: W36
 * "BFJ SOCKS(L, YELLOW)" -> base: BFJ SOCKS, color: YELLOW, size: L
 */
export function parseProductString(rawString) {
  if (!rawString) return { baseProductName: 'Unknown', color: 'Uncategorized', size: 'Uncategorized', original: rawString };

  const str = rawString.trim();
  
  // Look for parentheses at the end
  const match = str.match(/^(.*?)\s*\((.*?)\)$/);
  
  if (!match) {
    // Cannot parse, return everything as base product, categorize color/size as Uncategorized
    return {
      baseProductName: str,
      color: 'Uncategorized',
      size: 'Uncategorized',
      original: str
    };
  }

  const baseProductName = match[1].trim();
  const attributesStr = match[2].trim();
  
  // Split attributes by comma
  const attributes = attributesStr.split(',').map(s => s.trim());
  
  if (attributes.length !== 2) {
    return {
      baseProductName,
      color: 'Uncategorized',
      size: 'Uncategorized',
      original: str
    };
  }

  const [attr1, attr2] = attributes;
  
  // Regex to detect if a string is a size
  // Patterns: W36, M42, S, M, L, XL, 25-27, 36
  const isSize = (val) => /^(W\d{2}|M\d{2}|[SML]|XL|XXL|\d{2}-\d{2}|\d{2})$/i.test(val);

  let color = 'Uncategorized';
  let size = 'Uncategorized';

  if (isSize(attr1) && !isSize(attr2)) {
    size = attr1;
    color = attr2;
  } else if (isSize(attr2) && !isSize(attr1)) {
    size = attr2;
    color = attr1;
  } else {
    // Heuristic: usually color is first (e.g. SV,W40)
    // If we can't be sure, we assume attr1 is color, attr2 is size, but maybe we should flag it.
    // Let's assume standard format color, size
    color = attr1;
    size = attr2;
  }

  return {
    baseProductName,
    color,
    size,
    original: str
  };
}
