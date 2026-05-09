// srd-core/src/index.ts
export const calculateModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

export type PlayerToken = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  x: number;
  y: number;
};
