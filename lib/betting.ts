export type BoxedCalculationResult = {
  combinations: number[][];
  numberOfLines: number;
};

export function calculateExactaBoxed(
  selections: number[]
): BoxedCalculationResult {
  const n = selections.length;
  const numberOfLines = n >= 2 ? n * (n - 1) : 0;
  const combinations: number[][] = [];

  return {
    combinations,
    numberOfLines,
  };
}

export function calculateTrifectaBoxed(
  selections: number[]
): BoxedCalculationResult {
  const n = selections.length;
  const numberOfLines = n >= 3 ? n * (n - 1) * (n - 2) : 0;
  const combinations: number[][] = [];

  return {
    combinations,
    numberOfLines,
  };
}

export function calculateTotalStake(lines: number, stakePerLine: number): number {
  const safeLines = Number.isFinite(lines) && lines > 0 ? lines : 0;
  const safeStake =
    Number.isFinite(stakePerLine) && stakePerLine > 0 ? stakePerLine : 0;

  return safeLines * safeStake;
}
