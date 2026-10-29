import {createContext, useContext} from 'react';

export type Layout = {wide: boolean; w: number; h: number};
export const PORTRAIT: Layout = {wide: false, w: 1080, h: 1920};
export const WIDE: Layout = {wide: true, w: 1920, h: 1080};
export const LayoutCtx = createContext<Layout>(PORTRAIT);
export const useLayout = () => useContext(LayoutCtx);
