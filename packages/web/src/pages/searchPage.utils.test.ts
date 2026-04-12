import { describe, expect, test } from "vitest";
import {
  buildSearchParamsFromState,
  getNextRadiusOption,
  getSelectedLocationLabel,
  parseSearchLocationState,
} from "./searchPage.utils";

describe("searchPage utils", () => {
  test("builds a stable location label from district and city", () => {
    expect(
      getSelectedLocationLabel({
        address: "Bất kỳ",
        district: "Thành phố Thủ Đức",
        city: "Thành phố Hồ Chí Minh",
        lat: 10.84,
        lng: 106.81,
      }),
    ).toBe("Thành phố Thủ Đức, Thành phố Hồ Chí Minh");
  });

  test("falls back to a generic selected-area label when no textual place data exists", () => {
    expect(
      getSelectedLocationLabel({
        address: "",
        lat: 10.84,
        lng: 106.81,
      }),
    ).toBe("Khu vực đã chọn");
  });

  test("ignores missing coordinate params instead of turning them into 0,0", () => {
    const state = parseSearchLocationState(new URLSearchParams("q=thu+duc"));

    expect(state.query).toBe("thu duc");
    expect(state.selectedLocation).toBeNull();
    expect(state.radiusKm).toBe(5);
    expect(state.locationSource).toBeNull();
  });

  test("keeps explicit coordinates and applies a sane default radius", () => {
    const state = parseSearchLocationState(
      new URLSearchParams("lat=10.84&lng=106.81&address=Th%E1%BB%A7%20%C4%90%E1%BB%A9c"),
    );

    expect(state.selectedLocation).toEqual({
      address: "Thủ Đức",
      lat: 10.84,
      lng: 106.81,
      city: undefined,
      district: undefined,
    });
    expect(state.radiusKm).toBe(5);
    expect(state.locationSource).toBeNull();
  });

  test("preserves explicit current_location source from URL", () => {
    const state = parseSearchLocationState(
      new URLSearchParams("lat=10.84&lng=106.81&radius=10&location_source=current_location"),
    );

    expect(state.selectedLocation).toEqual({
      address: "",
      lat: 10.84,
      lng: 106.81,
      city: undefined,
      district: undefined,
    });
    expect(state.radiusKm).toBe(10);
    expect(state.locationSource).toBe("current_location");
  });

  test("builds clean URL params from an explicit current-location search", () => {
    const params = buildSearchParamsFromState({
      searchInput: "",
      selectedLocation: {
        address: "Tăng Nhơn Phú B",
        district: "Thành phố Thủ Đức",
        city: "Thành phố Hồ Chí Minh",
        lat: 10.847,
        lng: 106.785,
      },
      radiusKm: 5,
      locationSource: "current_location",
    });

    expect(params.toString()).toBe(
      "lat=10.847&lng=106.785&radius=5&address=T%C4%83ng+Nh%C6%A1n+Ph%C3%BA+B&city=Th%C3%A0nh+ph%E1%BB%91+H%E1%BB%93+Ch%C3%AD+Minh&district=Th%C3%A0nh+ph%E1%BB%91+Th%E1%BB%A7+%C4%90%E1%BB%A9c&location_source=current_location",
    );
  });

  test("omits location params entirely when no selected location exists", () => {
    const params = buildSearchParamsFromState({
      searchInput: "phòng studio",
      selectedLocation: null,
      radiusKm: 5,
      locationSource: null,
    });

    expect(params.toString()).toBe("q=ph%C3%B2ng+studio");
  });

  test("returns the next wider radius option", () => {
    expect(getNextRadiusOption(3, [3, 5, 10, 20])).toBe(5);
    expect(getNextRadiusOption(10, [3, 5, 10, 20])).toBe(20);
    expect(getNextRadiusOption(20, [3, 5, 10, 20])).toBeNull();
  });
});
