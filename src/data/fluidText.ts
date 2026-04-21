/**
 * Shared config for the /fluid experiment.
 *
 * Pretext needs a canvas-style `font` shorthand that matches the CSS `font`
 * declaration of what we're painting. We intentionally avoid `system-ui` in
 * this shorthand (pretext README notes it's unsafe for `layout()` accuracy on
 * macOS) and lean on the loaded Satoshi family plus a concrete fallback.
 */

export const FLUID_FONT_SIZE_PX = 200;
export const FLUID_LINE_HEIGHT_PX = 220;

/** Canvas 2D `font` shorthand. Synced with CSS: weight 500, FLUID_FONT_SIZE_PX, Satoshi. */
export const FLUID_FONT_SHORTHAND = `500 ${FLUID_FONT_SIZE_PX}px "Satoshi", "Helvetica Neue", Helvetica, Arial`;

/** Horizontal inset inside the stage for the text column. */
export const FLUID_TEXT_PADDING_X = 48;
/** Vertical inset inside the stage for the text column. */
export const FLUID_TEXT_PADDING_Y = 48;

/** Max column width (shrinkwrap target). Wide enough to keep a 2-word display
 *  phrase on a single line on most desktop viewports. */
export const FLUID_MAX_COLUMN_WIDTH = 1400;

/** Text color on the text canvas. Opaque so it doubles as a clean obstacle
 *  mask for the wave simulation. */
export const FLUID_TEXT_COLOR = "#ffffff";
