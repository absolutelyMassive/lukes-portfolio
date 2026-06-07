/** Base path for about floating photos (`public/about/`). */
export const ABOUT_FLOAT_DIR = "/about";

/**
 * Floating 1:1 photos on the about overlay (Figma 3399:35471).
 * Positions are % of the 1376×841 reference frame.
 */
export type AboutFloatingImage = {
  id: string;
  src: string;
  alt: string;
  top: string;
  left: string;
  driftClass: `aboutFloat-drift-${1 | 2 | 3 | 4 | 5 | 6}`;
};

export const ABOUT_FLOAT_SIZE_PX = 200;

export const ABOUT_FLOATING_IMAGES: AboutFloatingImage[] = [
  {
    id: "photo-1",
    src: `${ABOUT_FLOAT_DIR}/float-01.png`,
    alt: "",
    top: "8.09%",
    left: "1.45%",
    driftClass: "aboutFloat-drift-1",
  },
  {
    id: "photo-2",
    src: `${ABOUT_FLOAT_DIR}/float-02.png`,
    alt: "",
    top: "69.68%",
    left: "-3.78%",
    driftClass: "aboutFloat-drift-2",
  },
  {
    id: "photo-3",
    src: `${ABOUT_FLOAT_DIR}/float-03.png`,
    alt: "",
    top: "48.16%",
    left: "21.66%",
    driftClass: "aboutFloat-drift-3",
  },
  {
    id: "photo-4",
    src: `${ABOUT_FLOAT_DIR}/float-04.png`,
    alt: "",
    top: "75.39%",
    left: "61.05%",
    driftClass: "aboutFloat-drift-4",
  },
  {
    id: "photo-5",
    src: `${ABOUT_FLOAT_DIR}/float-05.png`,
    alt: "",
    top: "48.16%",
    left: "86.19%",
    driftClass: "aboutFloat-drift-5",
  },
  {
    id: "photo-6",
    src: `${ABOUT_FLOAT_DIR}/float-06.png`,
    alt: "",
    top: "4.76%",
    left: "68.6%",
    driftClass: "aboutFloat-drift-6",
  },
];
