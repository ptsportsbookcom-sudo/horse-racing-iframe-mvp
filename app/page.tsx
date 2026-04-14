"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateExactaBoxed,
  calculateTotalStake,
  calculateTrifectaBoxed,
} from "@/lib/betting";

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
const BET_TYPES: BetType[] = ["WIN", "PLACE", "EXACTA_BOXED", "TRIFECTA_BOXED"];
const INITIAL_COUNTDOWN_SECONDS = 2 * 60;

export default function Home() {
  const [selectedHorseNumbers, setSelectedHorseNumbers] = useState<number[]>([]);
  const [betType, setBetType] = useState<BetType>("WIN");
  const [enabledBetTypes, setEnabledBetTypes] = useState<Record<BetType, boolean>>({
    WIN: true,
    PLACE: true,
    EXACTA_BOXED: true,
    TRIFECTA_BOXED: true,
  });
  const [stakePerLine, setStakePerLine] = useState<string>("1");
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(INITIAL_COUNTDOWN_SECONDS);
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
  const selectedHorseNames = useMemo(
    () =>
      RACE.horses
        .filter((horse) => selectedHorseNumbers.includes(horse.number))
        .map((horse) => horse.name),
    [selectedHorseNumbers]
  );
  const enabledBetTypeOptions = useMemo(
    () => BET_TYPES.filter((type) => enabledBetTypes[type]),
    [enabledBetTypes]
  );
  const raceStatus = secondsRemaining > 0 ? "OPEN" : "CLOSED";
  const isSelectedBetTypeEnabled = enabledBetTypes[betType];
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
  const canPlaceBet =
    raceStatus === "OPEN" &&
    isSelectedBetTypeEnabled &&
    hasValidSelectionForBetType &&
    hasValidStake &&
    !isPlacingBet;
  const formattedCountdown = useMemo(() => {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [secondsRemaining]);

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

  useEffect(() => {
    if (secondsRemaining <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [secondsRemaining]);

  useEffect(() => {
    if (!isSelectedBetTypeEnabled) {
      const firstEnabledType = enabledBetTypeOptions[0];
      if (firstEnabledType) {
        setBetType(firstEnabledType);
      }
    }
  }, [isSelectedBetTypeEnabled, enabledBetTypeOptions]);

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

  function toggleBetType(type: BetType) {
    setEnabledBetTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Operator Settings
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {BET_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={enabledBetTypes[type]}
                  onChange={() => toggleBetType(type)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="grid w-full gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Horse Racing MVP</h1>
            <p className="mt-1 text-sm text-slate-600">
              {RACE.title} - {RACE.time}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-700">
              Balance: {balance === null ? "Loading..." : balance.toFixed(2)}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              Status:{" "}
              <span className={raceStatus === "OPEN" ? "text-green-700" : "text-red-700"}>
                {raceStatus}
              </span>
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Race starts in: {formattedCountdown}
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
                disabled={enabledBetTypeOptions.length === 0}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {enabledBetTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {enabledBetTypeOptions.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No bet types are enabled.</p>
              ) : null}
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
                <span>{selectedHorseNames.length === 1 ? "Selection" : "Selections"}</span>
                <span className="max-w-[60%] text-right font-semibold">
                  {selectedHorseNames.length > 0 ? selectedHorseNames.join(", ") : "-"}
                </span>
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
              {raceStatus === "CLOSED"
                ? "Betting Closed"
                : isPlacingBet
                  ? "Placing Bet..."
                  : "Place Bet"}
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
      </div>
    </main>
  );
}
