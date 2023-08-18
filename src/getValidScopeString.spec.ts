import { assert, expect } from "chai";

import { getValidScopeString } from "./getValidScopeString";

describe("getValidScopeString", () => {
  it("throws error when incorrect parts are supplied", () => {
    let scopeString = "id|gt| ";
    try {
      getValidScopeString(scopeString);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).to.equal(
          `Incorrect Parts supplied for scope: ${scopeString}`
        );
      } else {
        expect.fail("Error is not an instance of Error");
      }
    }

    scopeString = "id|gt";
    try {
      getValidScopeString(scopeString);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).to.equal(
          `Incorrect Parts supplied for scope: ${scopeString}`
        );
      } else {
        expect.fail("Error is not an instance of Error");
      }
    }
  });

  it("returns appropriate array value when correct parts are supplied", () => {
    const scopeString = "id|gt|1";
    assert.sameOrderedMembers(getValidScopeString(scopeString), [
      "id",
      "gt",
      "1",
    ]);
  });
});
