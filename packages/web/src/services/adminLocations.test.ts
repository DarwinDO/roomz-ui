import { expect, test } from '@playwright/test';
import {
  buildAdminLocationUpdateInput,
  normalizeLocationCatalogName,
  parseLocationTags,
} from './adminLocations';

test.describe('adminLocations service helpers', () => {
  test('normalizes Vietnamese location names for unique identity updates', () => {
    expect(normalizeLocationCatalogName('Đại học Bách khoa Hà Nội')).toBe(
      'dai hoc bach khoa ha noi',
    );
  });

  test('parses comma-separated tags into a clean array', () => {
    expect(parseLocationTags('university, engineering , hanoi,')).toEqual([
      'university',
      'engineering',
      'hanoi',
    ]);
  });

  test('builds a trimmed admin update payload with nullable coordinates', () => {
    expect(
      buildAdminLocationUpdateInput({
        name: ' Đại học Bách khoa Hà Nội ',
        location_type: 'university',
        city: ' Thành phố Hà Nội ',
        district: '',
        address: ' 1 Đại Cồ Việt ',
        latitude: '',
        longitude: '105.8431',
        source_name: '',
        source_url: ' https://example.com/bkhn ',
        tags: 'university, engineering',
        status: 'active',
      }),
    ).toEqual({
      name: 'Đại học Bách khoa Hà Nội',
      normalized_name: 'dai hoc bach khoa ha noi',
      location_type: 'university',
      city: 'Thành phố Hà Nội',
      district: null,
      address: '1 Đại Cồ Việt',
      latitude: null,
      longitude: 105.8431,
      source_name: null,
      source_url: 'https://example.com/bkhn',
      tags: ['university', 'engineering'],
      status: 'active',
    });
  });
});
