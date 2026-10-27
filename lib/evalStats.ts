export type Label = "correct" | "wrong" | "unsure";
export type LabelledItem = { trend: string; kept: boolean; label: Label };

// The owner is ground truth. "Correct" means Scout's verdict was right; "wrong" flips it.
function stats(items: LabelledItem[]) {
  const sure = items.filter((i) => i.label !== "unsure");
  const truthKeep = (i: LabelledItem) => (i.label === "correct" ? i.kept : !i.kept);
  const tp = sure.filter((i) => i.kept && truthKeep(i)).length;
  const keptN = sure.filter((i) => i.kept).length;
  const goodN = sure.filter(truthKeep).length;
  const ratio = (a: number, b: number) => (b ? a / b : null);
  return {
    labelled: sure.length,
    unsure: items.length - sure.length,
    accuracy: ratio(sure.filter((i) => i.label === "correct").length, sure.length),
    precision: ratio(tp, keptN), // of what Scout kept, how much was really good
    recall: ratio(tp, goodN), // of the really good images, how many Scout kept
  };
}

export function scoreLabels(items: LabelledItem[]) {
  const trends = [...new Set(items.map((i) => i.trend))];
  return { overall: stats(items), byTrend: Object.fromEntries(trends.map((t) => [t, stats(items.filter((i) => i.trend === t))])) };
}
