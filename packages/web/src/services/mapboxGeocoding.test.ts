import { expect, test } from '@playwright/test';
import {
  buildRoomGeocodingQuery,
  normalizeAddressText,
  normalizeCityName,
  normalizeDistrictName,
  normalizeRoomLocationInput,
} from './mapboxGeocoding';

test.describe('mapbox geocoding service helpers', () => {
  test('normalizes common city aliases into canonical labels', () => {
    expect(normalizeCityName('Ha Noi')).toBe('Thành phố Hà Nội');
    expect(normalizeCityName('TP Ho Chi Minh')).toBe('Thành phố Hồ Chí Minh');
    expect(normalizeCityName('Đà Nẵng')).toBe('Đà Nẵng');
  });

  test('normalizes district prefixes and whitespace', () => {
    expect(normalizeDistrictName('q. 1')).toBe('Quận 1');
    expect(normalizeDistrictName('  huyen   cu chi ')).toBe('Huyện Cu Chi');
  });

  test('builds a stable geocoding query from normalized room fields', () => {
    expect(
      buildRoomGeocodingQuery({
        address: ' 12  Duy Tan ',
        district: 'q. cau giay',
        city: 'ha noi',
      }),
    ).toBe('12 Duy Tan, Quận Cau Giay, Thành phố Hà Nội');
  });

  test('normalizes room location input without dropping empty optional fields', () => {
    expect(
      normalizeRoomLocationInput({
        address: ' 99   Nguyen Van Linh ',
        district: '',
        city: 'tp da nang',
      }),
    ).toEqual({
      address: '99 Nguyen Van Linh',
      district: undefined,
      city: 'Thành phố Đà Nẵng',
    });

    expect(normalizeAddressText('  10,  Le Loi   ')).toBe('10, Le Loi');
  });
});
