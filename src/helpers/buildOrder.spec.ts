import { expect } from "chai";
import { describe, it } from "node:test";

import ArticleModel from "../__mocks__/models/Article";
import AuthorModel from "../__mocks__/models/Author";
import { buildOrder, hasComputedAttributes } from "./buildOrder";
import { literal } from "sequelize";

describe("buildOrder", () => {
  it("returns an empty array when no sorters are provided", () => {
    const order = buildOrder(ArticleModel, []);
    expect(order).to.eql([]);
  });

  it("returns an array of order items when sorters are provided", () => {
    const order = buildOrder(ArticleModel, [
      { field: "releaseDate", order: "ASC" },
    ]);
    expect(order).to.eql([["releaseDate", "ASC"]]);
  });

  it("returns an array of order items when sorters are provided and the field has a path", () => {
    const order = buildOrder(ArticleModel, [
      { field: "owner.firstname", order: "ASC" },
    ]);
    expect(order).to.eql([["owner", "firstname", "ASC"]]);
  });

  it("returns an array of order items when sorters are provided and the field is computed", () => {
    const order = buildOrder(AuthorModel, [
      { field: "publishedQuantity", order: "ASC" },
    ]);
    expect(order).to.eql([[literal("publishedQuantity"), "ASC"]]);
  });
});

describe("hasComputedAttributes", () => {
  it("returns false when empty order", () => {
    const hasComputed = hasComputedAttributes([]);
    expect(hasComputed).to.be.false;
  });

  it("returns false for simple order", () => {
    const hasComputed = hasComputedAttributes(["releaseDate", "ASC"]);
    expect(hasComputed).to.be.false;
  });

  it("returns false for order with path", () => {
    const hasComputed = hasComputedAttributes(["owner", "firstname", "ASC"]);
    expect(hasComputed).to.be.false;
  });

  it("returns true when field is computed", () => {
    const hasComputed = hasComputedAttributes([
      [literal("publishedQuantity"), "ASC"],
    ]);
    expect(hasComputed).to.be.true;
  });
});
