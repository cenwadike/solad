import { type WHITE_LABEL_THEME } from "./interfaces";
export declare function getColorsList(colorsAmount?: number, colorsShiftAmount?: number, mixColor?: string, rotate?: number, saturation?: number, mainColor?: string): string[];
export declare function generateWhiteLabelTheme(primary: string): string[];
export declare function applyWhiteLabelTheme(rootElement: HTMLElement, theme: WHITE_LABEL_THEME): void;
