const { getInitialState } = require("../monitor");
const puppeteer = require("puppeteer");

jest.mock("puppeteer");

describe("Monitor Tests", () => {
  beforeAll(() => {
    puppeteer.launch = jest.fn(() =>
      Promise.resolve({
        newPage: jest.fn(() =>
          Promise.resolve({
            goto: jest.fn(),
            content: jest.fn(() => Promise.resolve("<html></html>")),
            close: jest.fn(),
          })
        ),
      })
    );
  });

  test("should get initial state", async () => {
    const url = "http://example.com";
    const initialState = await getInitialState(url);
    expect(initialState).toBe("<html></html>");
  });
});
