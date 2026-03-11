import { expect, test } from '@playwright/test';
import {
  buildConcernSignals,
  buildMatchFactors,
  buildTopSignals,
  getFactorSignalLabel,
  getMissingDataLabels,
  getOverallGuidance,
  type MatchFactor,
} from './roommateProfileModal.utils';
import type { RoommateMatch } from '@/services/roommates';

function createMatch(overrides: Partial<RoommateMatch> = {}): RoommateMatch {
  return {
    matched_user_id: 'user-2',
    compatibility_score: 48,
    confidence_score: 50,
    match_scope: 'same_city',
    full_name: 'Sinh viên Demo 012',
    avatar_url: null,
    bio: null,
    university: 'Đại học Bách khoa Hà Nội',
    major: 'Công nghệ thông tin',
    city: 'Thành phố Hà Nội',
    district: 'Quận Hai Bà Trưng',
    age: 21,
    gender: 'female',
    occupation: 'student',
    hobbies: ['du lịch'],
    sleep_score: 0,
    cleanliness_score: 0,
    noise_score: 18,
    guest_score: 22,
    weekend_score: 0,
    budget_score: 60,
    hobby_score: 35,
    age_score: 100,
    move_in_score: 30,
    location_score: 75,
    last_seen: '2026-03-10T10:00:00.000Z',
    ...overrides,
  };
}

test.describe('roommate profile modal utils', () => {
  test('treats zero-score factors as missing data instead of positive compatibility', () => {
    const factors = buildMatchFactors(createMatch());
    const sleepFactor = factors.find((factor) => factor.id === 'sleep');

    expect(sleepFactor).toBeTruthy();
    expect(sleepFactor?.score).toBe(0);
    expect(sleepFactor?.description).toContain('Thiếu dữ liệu');
    expect(getFactorSignalLabel(0)).toBe('Thiếu dữ liệu');
    expect(getMissingDataLabels(factors)).toEqual(['Nhịp sinh hoạt', 'Mức gọn gàng', 'Cuối tuần']);
  });

  test('uses cautionary copy for low but non-zero mismatch scores', () => {
    const factors = buildMatchFactors(createMatch({ noise_score: 18 }));
    const noiseFactor = factors.find((factor) => factor.id === 'noise');

    expect(noiseFactor?.description).toContain('khá lệch');
    expect(getFactorSignalLabel(18)).toBe('Lệch rõ');
  });

  test('buildTopSignals prefers meaningful factors over missing data', () => {
    const factors: MatchFactor[] = buildMatchFactors(createMatch());
    const signals = buildTopSignals(factors);

    expect(signals.map((signal) => signal.label)).toEqual(['Độ tuổi', 'Khu vực', 'Ngân sách']);
    expect(signals.every((signal) => signal.score > 0)).toBe(true);
  });

  test('buildConcernSignals highlights only low-score factors with real data', () => {
    const factors = buildMatchFactors(createMatch());
    const concerns = buildConcernSignals(factors);

    expect(concerns.map((signal) => signal.label)).toEqual(['Tiếng ồn', 'Khách ghé chơi', 'Thời gian chuyển vào']);
  });

  test('overall guidance becomes cautious when confidence is low', () => {
    expect(getOverallGuidance(48, 50)).toContain('tham khảo');
    expect(getOverallGuidance(72, 45)).toContain('dữ liệu hiện còn thiếu');
    expect(getOverallGuidance(82, 85)).toContain('nền tảng tốt');
  });
});
