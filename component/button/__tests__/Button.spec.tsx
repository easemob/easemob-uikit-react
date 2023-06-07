import * as React from "react";
import { render, screen } from "@testing-library/react";
import Button from "../index";
import { beforeEach, describe, expect, test, vi } from "vitest";
import "@testing-library/jest-dom/extend-expect";
import "@testing-library/jest-dom";
describe("button", () => {
  test("simple render", () => {
    render(
      <Button size="large">
        <h1>text</h1>
      </Button>
    );
    expect(screen.getByText("text")).toBeInTheDocument();
  });
});
