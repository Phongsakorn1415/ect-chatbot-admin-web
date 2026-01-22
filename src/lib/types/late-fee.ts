export enum FeeUnit {
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
}

export interface LateFee {
  id: number;
  rate: number;
  unit: FeeUnit;
  max_amount: number;
  updatedAt: string;
}
