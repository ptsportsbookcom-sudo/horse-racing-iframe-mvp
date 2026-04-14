"use client";

import { useMemo, useState } from "react";
import {
  calculateExactaBoxed,
  calculateTotalStake,
  calculateTrifectaBoxed,
} from "@/lib/betting";
import { useEffect } from "react";

type BetType = "WIN" | "PLACE" | "EXACTA_BOXED" | "TRIFECTA_BOXED";

type Horse = {
  number: number;
  name: string;
  odds: string;
};

const RACE = {
  title: "Race 5 - Springfield Park",
  time: "3:45 PM",
  horses: [
    { number: 1, name: "Thunder Strike", odds: "4.50" },
    { number: 2, name: "Silver Comet", odds: "6.00" },
    { number: 3, name: "Moonlight Dash", odds: "8.00" },
    { number: 4, name: "Golden Arrow", odds: "3.80" },
    { number: 5, name: "Crimson Tide", odds: "11.00" },
    { number: 6, name: "Rapid Echo", odds: "5.50" },
    { number: 7, name: "Night Falcon", odds: "9.50" },
    { number: 8, name: "Emerald Storm", odds: "7.00" },
    { number: 9, name: "Iron Spirit", odds: "13.00" },
    { number: 10, name: "Royal Legend", odds: "10.00" },
  ] satisfies Horse[],
};

export default function Home() {
  const [selectedHorseNumbers, setSelectedHorseNumbers] = useState<number[]>([]);
  const [betType, setBetType] = useState<BetType>("WIN");
  const [stakePerLine, setStakePerLine] = useState<string>("1");
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [placedBetSummary, setPlacedBetSummary] = useState<{
    betType: BetType;
    selectedHorses: number[];
    totalStake: number;
  } | null>(null);
  const [placeBetError, setPlaceBetError] = useState<string | null>(null);

  const lines = useMemo(() => {
    switch (betType) {
      case "EXACTA_BOXED":
        return calculateExactaBoxed(selectedHorseNumbers).numberOfLines;
      case "TRIFECTA_BOXED":
        return calculateTrifectaBoxed(selectedHorseNumbers).numberOfLines;
      case "WIN":
      case "PLACE":
        return selectedHorseNumbers.length;
      default:
        return 0;
    }
  }, [selectedHorseNumbers, betType]);

  const stakeValue = Number(stakePerLine) > 0 ? Number(stakePerLine) : 0;
  const totalStake = useMemo(
    () => calculateTotalStake(lines, stakeValue),
    [lines, stakeValue]
  );
  const hasValidSelectionForBetType = useMemo(() => {
    if (betType === "EXACTA_BOXED") {
      return selectedHorseNumbers.length >= 2;
    }

    if (betType === "TRIFECTA_BOXED") {
      return selectedHorseNumbers.length >= 3;
    }

    return selectedHorseNumbers.length > 0;
  }, [betType, selectedHorseNumbers.length]);
  const hasValidStake = stakePerLine.trim() !== "" && stakeValue > 0;
  const canPlaceBet = hasValidSelectionForBetType && hasValidStake && !isPlacingBet;

  useEffect(() => {
    async function fetchBalance() {
      setBalanceError(null);

      try {
        const response = await fetch("/api/balance");

        if (!response.ok) {
          throw new Error("Failed to fetch balance");
        }

        const data: { balance?: number } = await response.json();
        setBalance(typeof data.balance === "number" ? data.balance : 0);
      } catch {
        setBalanceError("Unable to load balance.");
      }
    }

    fetchBalance();
  }, []);

  function toggleHorseSelection(horseNumber: number) {
    setSelectedHorseNumbers((prev) =>
      prev.includes(horseNumber)
        ? prev.filter((number) => number !== horseNumber)
        : [...prev, horseNumber]
    );
  }

  async function handlePlaceBet() {
    if (!canPlaceBet) {
      return;
    }

    const payload = {
      betType,
      selectedHorses: selectedHorseNumbers,
      stakePerLine: stakeValue,
      totalStake,
      numberOfLines: lines,
    };

    setIsPlacingBet(true);
    setPlaceBetError(null);

    try {
      const response = await fetch("/api/place-bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to place bet");
      }

      setPlacedBetSummary({
        betType: payload.betType,
        selectedHorses: payload.selectedHorses,
        totalStake: payload.totalStake,
      });
      setBalance((prevBalance) =>
        typeof prevBalance === "number" ? Math.max(0, prevBalance - payload.totalStake) : prevBalance
      );
      setSelectedHorseNumbers([]);
    } catch {
      setPlaceBetError("Unable to place bet. Please try again.");
    } finally {
      setIsPlacingBet(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Horse Racing MVP</h1>
            <p className="mt-1 text-sm text-slate-600">
              {RACE.title} - {RACE.time}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-700">
              Balance: {balance === null ? "Loading..." : balance.toFixed(2)}
            </p>
            {balanceError ? (
              <p className="mt-1 text-sm text-red-700">{balanceError}</p>
            ) : null}
          </div>

          <div className="space-y-3">
            {RACE.horses.map((horse) => {
              const isSelected = selectedHorseNumbers.includes(horse.number);

              return (
                <button
                  key={horse.number}
                  type="button"
                  onClick={() => toggleHorseSelection(horse.number)}
                  className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div>
                    <p className="font-semibold">
                      {horse.number}. {horse.name}
                    </p>
                    <p className="text-sm text-slate-600">Odds: {horse.odds}</p>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Bet Slip</h2>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Bet Type</label>
              <select
                value={betType}
                onChange={(event) => setBetType(event.target.value as BetType)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="WIN">WIN</option>
                <option value="PLACE">PLACE</option>
                <option value="EXACTA_BOXED">EXACTA_BOXED</option>
                <option value="TRIFECTA_BOXED">TRIFECTA_BOXED</option>
              </select>
            </div>

            <div>
              <label htmlFor="stake" className="mb-2 block text-sm font-medium">
                Stake per line
              </label>
              <input
                id="stake"
                type="number"
                min="0"
                step="0.5"
                value={stakePerLine}
                onChange={(event) => setStakePerLine(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="rounded-md bg-slate-50 p-4 text-sm">
              <p className="flex justify-between">
                <span>Selected horses</span>
                <span className="font-semibold">{selectedHorseNumbers.length}</span>
              </p>
              <p className="mt-2 flex justify-between">
                <span>Number of lines</span>
                <span className="font-semibold">{lines}</span>
              </p>
              <p className="mt-2 flex justify-between">
                <span>Total stake</span>
                <span className="font-semibold">{totalStake.toFixed(2)}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handlePlaceBet}
              disabled={!canPlaceBet}
              className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isPlacingBet ? "Placing Bet..." : "Place Bet"}
            </button>

            {placeBetError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {placeBetError}
              </div>
            ) : null}

            {placedBetSummary ? (
              <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <p className="font-semibold">Bet placed successfully</p>
                <p className="mt-2">
                  <span className="font-medium">Bet type:</span>{" "}
                  {placedBetSummary.betType}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Selected horses:</span>{" "}
                  {placedBetSummary.selectedHorses.join(", ")}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Total stake:</span>{" "}
                  {placedBetSummary.totalStake.toFixed(2)}
                </p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  );
}
