import { describe, it } from "node:test";
import assert from "node:assert/strict";

function getVerifiedTotpFactors(
  factors: { totp?: Array<{ id: string; status: string }> | null } | null | undefined
): Array<{ id: string; status: string }> {
  return (factors?.totp ?? []).filter((f) => f.status === "verified");
}

describe("getVerifiedTotpFactors", () => {
  it("returns empty for null/undefined", () => {
    assert.deepEqual(getVerifiedTotpFactors(null), []);
    assert.deepEqual(getVerifiedTotpFactors(undefined), []);
    assert.deepEqual(getVerifiedTotpFactors({}), []);
  });

  it("ignores unverified factors", () => {
    const factors = {
      totp: [
        { id: "a", status: "unverified" },
        { id: "b", status: "verified" },
      ],
    };
    const verified = getVerifiedTotpFactors(factors);
    assert.equal(verified.length, 1);
    assert.equal(verified[0].id, "b");
  });

  it("treats only verified as enrolled", () => {
    const onlyUnverified = {
      totp: [{ id: "x", status: "unverified" }],
    };
    assert.equal(getVerifiedTotpFactors(onlyUnverified).length, 0);
  });
});
