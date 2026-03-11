import { expect, test } from '@playwright/test';
import {
  buildMatchFactors,
  buildTopSignals,
  getFactorSignalLabel,
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
    full_name: 'Sinh vien Demo 012',
    avatar_url: null,
    bio: null,
    university: 'Dai hoc Bach khoa Ha Noi',
    major: 'Cong nghe thong tin',
    city: 'Thanh pho Ha Noi',
    district: 'Quan Hai Ba Trung',
    age: 21,
    gender: 'female',
    occupation: 'student',
    hobbies: ['du lich'],
    sleep_score: 0,
    cleanliness_score: 0,
    noise_score: 0,
    guest_score: 0,
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
  test('uses non-positive copy and neutral status when a factor score is zero', () => {
    const factors = buildMatchFactors(createMatch());
    const sleepFactor = factors.find((factor) => factor.id === 'sleep');

    expect(sleepFactor).toBeTruthy();
    expect(sleepFactor?.score).toBe(0);
    expect(sleepFactor?.description).toContain('Chưa thấy tín hiệu phù hợp rõ');
    expect(sleepFactor?.description).not.toContain('đồng pha');
    expect(getFactorSignalLabel(0)).toBe('Chưa rõ');
  });

  test('keeps positive copy only for genuinely high scores', () => {
    const factors = buildMatchFactors(createMatch({ sleep_score: 82 }));
    const sleepFactor = factors.find((factor) => factor.id === 'sleep');

    expect(sleepFactor?.description).toBe('Lịch ngủ và nhịp sinh hoạt khá đồng pha.');
    expect(getFactorSignalLabel(82)).toBe('Khớp tốt');
  });

  test('buildTopSignals prefers meaningful signals over zero-score factors', () => {
    const factors: MatchFactor[] = buildMatchFactors(createMatch());
    const signals = buildTopSignals(factors);

    expect(signals.map((signal) => signal.label)).toEqual(['Độ tuổi', 'Khu vực', 'Ngân sách']);
    expect(signals.every((signal) => signal.score > 0)).toBe(true);
  });

  test('overall guidance becomes cautious when confidence is low', () => {
    expect(getOverallGuidance(48, 50)).toContain('tham khảo');
    expect(getOverallGuidance(82, 85)).toContain('nền tảng tốt');
  });
});