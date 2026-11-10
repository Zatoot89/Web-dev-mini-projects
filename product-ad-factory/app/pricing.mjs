export const PRICES = Object.freeze({
  single: {name: 'Single Ad', totalAed: 249, videos: 1, revisions: 1, ratios: ['9:16']},
  growth: {name: 'Growth', totalAed: 1499, videos: 8, revisions: 1, ratios: ['9:16', '1:1']},
  scale: {name: 'Scale', totalAed: 3999, videos: 24, revisions: 2, ratios: ['9:16', '1:1']},
});
export const EXTRA_LANGUAGE_AED = 99;
export function quote(packageKey, extraLanguage = false) {
  const pack = PRICES[packageKey];
  if (!pack) throw new Error('Unknown package');
  return {packageKey, name: pack.name, videos: pack.videos, revisions: pack.revisions,
    aspectRatios: pack.ratios, amountAed: pack.totalAed + (extraLanguage ? EXTRA_LANGUAGE_AED : 0),
    extraLanguageAed: extraLanguage ? EXTRA_LANGUAGE_AED : 0,
    currency: 'AED', taxNote: 'Price excludes VAT, if applicable; invoice issued separately'};
}
