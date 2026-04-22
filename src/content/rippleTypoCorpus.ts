/**
 * Source text for splat-anchored phrase stamps on the /ripple-typo page.
 * Opening paragraph of Melville's Moby Dick — chosen for its lyrical,
 * ocean-y cadence and abundance of short readable clauses. Edit freely;
 * the consumer just splits on sentence-ish punctuation and strips anything
 * that isn't a letter or space.
 */
export const RIPPLE_TYPO_CORPUS = `Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people's hats off, then, I account it high time to get to sea as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me.`;

const MIN_PHRASE_LEN = 4;
const MAX_PHRASE_LEN = 30;

/**
 * Split the corpus into short readable phrases: lowercase, letters + single
 * spaces only. Dropped segments too short/long for the stamp overlay.
 */
export function buildPhraseList(source = RIPPLE_TYPO_CORPUS): string[] {
  return source
    .split(/[.;,!?\n]+/g)
    .map((s) =>
      s
        .toLowerCase()
        .replace(/[^a-z ]+/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((s) => s.length >= MIN_PHRASE_LEN && s.length <= MAX_PHRASE_LEN);
}
