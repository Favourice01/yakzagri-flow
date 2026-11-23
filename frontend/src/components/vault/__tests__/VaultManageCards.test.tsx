import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { checkWithdrawal } from "../withdrawalReserve";
import { WithdrawalCard } from "../WithdrawalCard";
import { FeeSummary } from "../FeeSummary";
import { StatCard } from "../StatCard";
import { applySlippage } from "@/lib/stellar/assets";

describe("checkWithdrawal", () => {
  it("is ok when reserve covered", () => {
    expect(checkWithdrawal(1000, 200, 100).level).toBe("ok");
  });
  it("warns with exact deficit", () => {
    const r = checkWithdrawal(1000, 600, 500);
    expect(r).toMatchObject({ level: "warn", deficit: 100 });
  });
  it("blocks below hard minimum with deficit", () => {
    const r = checkWithdrawal(100, 50, 95, 10);
    expect(r).toMatchObject({ level: "blocked", deficit: 5 });
  });
  it("rejects invalid amounts", () => {
    expect(checkWithdrawal(100, 0, 200).level).toBe("invalid");
  });
});

describe("components", () => {
  it("WithdrawalCard shows warning and disables on block", () => {
    render(<WithdrawalCard balance={100} committed={50} />);
    fireEvent.change(screen.getByLabelText("Withdrawal amount"), { target: { value: "99" } });
    expect(screen.getByRole("alert").textContent).toMatch(/short by/);
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled();
  });
  it("FeeSummary computes net", () => {
    render(<FeeSummary amount={100} feeRate={0.01} />);
    expect(screen.getByText("99.00 cNGN")).toBeTruthy();
  });
  it("StatCard renders", () => {
    render(<StatCard label="L" value="V" sub="S" />);
    expect(screen.getByText("V")).toBeTruthy();
  });
});

describe("applySlippage", () => {
  it("adds percentage", () => {
    expect(applySlippage("100", 1)).toBe("101");
  });
});
