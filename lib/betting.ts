export type BoxedCalculationResult = {
  combinations: number[][];
  numberOfLines: number;
};

export function calculateExactaBoxed(
  selections: number[]
): BoxedCalculationResult {
  const combinations: number[][] = [];

  if (selections.length < 2) {
    return { combinations, numberOfLines: 0 };
  }

  for (let i = 0; i < selections.length; i += 1) {
    for (let j = 0; j < selections.length; j += 1) {
      if (i !== j) {
        combinations.push([selections[i], selections[j]]);
      }
    }
  }

  return {
    combinations,
    numberOfLines: combinations.length,
  };
}

export function calculateTrifectaBoxed(
  selections: number[]
): BoxedCalculationResult {
  const combinations: number[][] = [];

  if (selections.length < 3) {
    return { combinations, numberOfLines: 0 };
  }

  for (let i = 0; i < selections.length; i += 1) {
    for (let j = 0; j < selections.length; j += 1) {
      for (let k = 0; k < selections.length; k += 1) {
        if (i !== j && i !== k && j !== k) {
          combinations.push([selections[i], selections[j], selections[k]]);
        }
      }
    }
  }

  return {
    combinations,
    numberOfLines: combinations.length,
  };
}

export function calculateTotalStake(lines: number, stakePerLine: number): number {
  const safeLines = Number.isFinite(lines) && lines > 0 ? lines : 0;
  const safeStake =
    Number.isFinite(stakePerLine) && stakePerLine > 0 ? stakePerLine : 0;

  return safeLines * safeStake;
}
