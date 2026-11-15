// Set a public URL after placing an exact PNG in the documented slot, or import
// its .asset.json pointer here and use pointer.url for uploaded media.
export const VISUAL_ASSETS: Record<string, string | undefined> = {
  'new-york-01': undefined,
  'new-york-02': undefined,
  'new-york-03': undefined,
  'new-york-04': undefined,
  'cafe-interior': undefined,
  'espresso-machine': undefined,
};
export const newYorkSlot = (cityId: string, index: number) =>
  cityId === 'new_york' ? `new-york-0${index % 4 + 1}` : undefined;