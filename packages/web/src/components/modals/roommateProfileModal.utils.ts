import {
  Cake,
  Calendar,
  Clock,
  Gamepad2,
  MapPin,
  Moon,
  Sparkles,
  Users,
  Volume2,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { RoommateMatch } from '@/services/roommates';

export type MatchFactorId =
  | 'sleep'
  | 'clean'
  | 'noise'
  | 'guest'
  | 'weekend'
  | 'budget'
  | 'hobby'
  | 'age'
  | 'location'
  | 'move-in';

export interface MatchFactor {
  id: MatchFactorId;
  label: string;
  score: number;
  icon: LucideIcon;
  description: string;
}

type ScoreBand = 'high' | 'medium' | 'low' | 'none';

const factorCopy: Record<MatchFactorId, Record<ScoreBand, string>> = {
  sleep: {
    high: 'Lịch ngủ và nhịp sinh hoạt khá đồng pha.',
    medium: 'Nhịp sinh hoạt có thể phối hợp được, nhưng vẫn nên chốt rõ giờ ngủ và giờ thức.',
    low: 'Nhịp sinh hoạt đang lệch đáng kể. Nên hỏi kỹ trước khi quyết định ở chung.',
    none: 'Thiếu dữ liệu về giờ ngủ và nhịp sống. Nên hỏi trực tiếp trước khi kết nối.',
  },
  clean: {
    high: 'Quan điểm về dọn dẹp và giữ phòng gọn gàng khá tương đồng.',
    medium: 'Mức độ gọn gàng có thể hòa hợp nếu hai bên thống nhất quy tắc chung.',
    low: 'Thói quen dọn dẹp đang lệch khá nhiều, dễ phát sinh khó chịu khi ở chung.',
    none: 'Thiếu dữ liệu về thói quen dọn dẹp. Cần xác nhận thêm trước khi ghép phòng.',
  },
  noise: {
    high: 'Mức chấp nhận tiếng ồn tương đối khớp nhau.',
    medium: 'Khả năng chịu tiếng ồn ở mức có thể trao đổi để thống nhất thêm.',
    low: 'Quan điểm về tiếng ồn khá lệch, nên nói trước về giờ yên tĩnh.',
    none: 'Thiếu dữ liệu về mức chấp nhận tiếng ồn. Nên hỏi kỹ trước khi kết nối.',
  },
  guest: {
    high: 'Cách đón bạn bè hoặc người thân khá tương đồng.',
    medium: 'Việc có khách ghé chơi có thể phối hợp nếu nói rõ tần suất và quy tắc.',
    low: 'Kỳ vọng về khách ghé chơi đang lệch khá nhiều, dễ ảnh hưởng trải nghiệm sống chung.',
    none: 'Thiếu dữ liệu về cách tiếp khách. Nên trao đổi thẳng trước khi ghép.',
  },
  weekend: {
    high: 'Nhịp sinh hoạt cuối tuần khá đồng pha.',
    medium: 'Cuối tuần vẫn có thể khớp nếu hai bên thống nhất lịch đi lại và nghỉ ngơi.',
    low: 'Nhịp cuối tuần đang lệch tương đối nhiều, nên làm rõ kỳ vọng về sinh hoạt cá nhân.',
    none: 'Thiếu dữ liệu về lịch cuối tuần. Cần hỏi thêm trước khi quyết định.',
  },
  budget: {
    high: 'Khả năng chia tiền thuê và chi phí sinh hoạt khá khớp.',
    medium: 'Ngân sách có thể phù hợp nếu chốt rõ trần chi phí và khoản phát sinh.',
    low: 'Ngân sách đang lệch khá nhiều, đây là điểm cần xác nhận sớm.',
    none: 'Thiếu dữ liệu ngân sách từ một trong hai bên. Nên hỏi kỹ trước khi đi tiếp.',
  },
  hobby: {
    high: 'Có nhiều sở thích chung để bắt đầu kết nối tự nhiên hơn.',
    medium: 'Có một vài điểm chung đủ để mở đầu câu chuyện.',
    low: 'Sở thích giao nhau còn ít. Nên xem thêm mức độ hợp nhau qua nói chuyện trực tiếp.',
    none: 'Thiếu dữ liệu sở thích hoặc chưa ai chia sẻ đủ để so sánh.',
  },
  age: {
    high: 'Độ tuổi khá gần nhau, thường dễ đồng pha về nhịp sống hơn.',
    medium: 'Chênh lệch độ tuổi không lớn, vẫn có thể phù hợp.',
    low: 'Độ tuổi đang lệch khá nhiều. Nên kiểm tra thêm cách sống và kỳ vọng sinh hoạt.',
    none: 'Thiếu dữ liệu độ tuổi nên chưa đánh giá được mức độ phù hợp.',
  },
  location: {
    high: 'Khu vực ưu tiên khá gần nhau, thuận lợi để cân nhắc ghép phòng.',
    medium: 'Vị trí sống có thể chấp nhận được nếu hai bên linh hoạt về khu vực.',
    low: 'Khu vực ưu tiên đang lệch khá nhiều, dễ ảnh hưởng quyết định ở chung.',
    none: 'Thiếu dữ liệu vị trí ưu tiên. Nên xác nhận lại khu vực mong muốn.',
  },
  'move-in': {
    high: 'Mốc chuyển vào khá khớp nhau.',
    medium: 'Thời gian chuyển vào có thể phối hợp nếu chốt lịch sớm.',
    low: 'Mốc chuyển vào đang lệch khá xa, cần làm rõ trước khi kết nối sâu hơn.',
    none: 'Thiếu dữ liệu về thời điểm chuyển vào. Nên hỏi thêm trước khi quyết định.',
  },
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getScoreBand(score: number): ScoreBand {
  const normalizedScore = clampScore(score);

  if (normalizedScore >= 75) return 'high';
  if (normalizedScore >= 55) return 'medium';
  if (normalizedScore > 0) return 'low';
  return 'none';
}

export function formatLastSeen(lastSeen: string | null | undefined): string {
  if (!lastSeen) return 'Chưa rõ';

  const now = new Date();
  const seenDate = new Date(lastSeen);
  const diffMs = now.getTime() - seenDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 5) return 'Đang hoạt động';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return 'Lâu rồi';
}

export function getMatchScopeLabel(scope: RoommateMatch['match_scope']): string {
  if (scope === 'same_district') return 'Cùng khu vực';
  if (scope === 'same_city') return 'Cùng thành phố';
  return 'Ngoài khu vực ưu tiên';
}

export function getConfidenceLabel(score: number): string {
  if (score >= 80) return 'Độ tin cậy cao';
  if (score >= 60) return 'Độ tin cậy khá';
  return 'Cần thêm dữ liệu';
}

export function getConfidenceTone(score: number): string {
  if (score >= 80) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (score >= 60) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-100 text-slate-600';
}

export function getMatchTone(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 65) return 'text-sky-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

export function getMatchSummary(score: number): string {
  if (score >= 80) return 'Rất đáng để mở lời';
  if (score >= 65) return 'Có nhiều điểm hợp';
  if (score >= 50) return 'Có thể phù hợp nếu nói chuyện thêm';
  return 'Nên kiểm tra kỹ trước khi kết nối';
}

export function getOverallGuidance(score: number, confidenceScore: number): string {
  if (score >= 75 && confidenceScore >= 70) {
    return 'Hai bên có nhiều nền tảng tốt để bắt đầu nói chuyện. Nên chốt sớm ngân sách, lịch chuyển vào và quy tắc sống chung.';
  }

  if (score >= 65 && confidenceScore < 60) {
    return 'Điểm nền khá ổn nhưng dữ liệu hiện còn thiếu. Nên hỏi thêm trực tiếp về ngân sách, lịch sống và khu vực ưu tiên trước khi đi xa hơn.';
  }

  if (score >= 55 && confidenceScore >= 60) {
    return 'Có vài tín hiệu khá ổn để mở lời. Tuy vậy, vẫn nên xác nhận kỹ khu vực ưu tiên, nhịp sinh hoạt và chi phí trước khi tiến xa hơn.';
  }

  if (confidenceScore < 60) {
    return 'Điểm hiện tại mới mang tính tham khảo vì hồ sơ còn thiếu dữ liệu. Nên hỏi trực tiếp về lịch sống, ngân sách và kỳ vọng ở chung.';
  }

  return 'Kết quả hiện cho thấy vẫn còn vài khoảng lệch rõ. Chỉ nên kết nối nếu bạn sẵn sàng nói chuyện thẳng về các điểm chưa khớp.';
}

export function formatOccupation(occupation: RoommateMatch['occupation']): string {
  if (occupation === 'student') return 'Sinh viên';
  if (occupation === 'worker') return 'Đi làm';
  if (occupation === 'freelancer') return 'Freelancer';
  if (occupation === 'other') return 'Khác';
  return 'Chưa cập nhật';
}

export function getScoreTone(score: number): { track: string; fill: string; label: string } {
  const normalizedScore = clampScore(score);

  if (normalizedScore >= 80) {
    return {
      track: 'bg-emerald-50',
      fill: 'bg-emerald-500',
      label: 'text-emerald-700',
    };
  }

  if (normalizedScore >= 65) {
    return {
      track: 'bg-sky-50',
      fill: 'bg-sky-500',
      label: 'text-sky-700',
    };
  }

  if (normalizedScore >= 40) {
    return {
      track: 'bg-amber-50',
      fill: 'bg-amber-500',
      label: 'text-amber-700',
    };
  }

  if (normalizedScore > 0) {
    return {
      track: 'bg-rose-50',
      fill: 'bg-rose-500',
      label: 'text-rose-700',
    };
  }

  return {
    track: 'bg-slate-100',
    fill: 'bg-slate-300',
    label: 'text-slate-500',
  };
}

export function getFactorSignalLabel(score: number): string {
  const normalizedScore = clampScore(score);

  if (normalizedScore === 0) return 'Thiếu dữ liệu';
  if (normalizedScore >= 75) return 'Khớp tốt';
  if (normalizedScore >= 55) return 'Khá ổn';
  if (normalizedScore >= 40) return 'Cần hỏi kỹ';
  return 'Lệch rõ';
}

export function getFactorSignalTone(score: number): string {
  const normalizedScore = clampScore(score);

  if (normalizedScore === 0) return 'border-slate-200 bg-slate-100 text-slate-600';
  if (normalizedScore >= 75) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalizedScore >= 55) return 'border-sky-200 bg-sky-50 text-sky-700';
  if (normalizedScore >= 40) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

function getFactorDescription(id: MatchFactorId, score: number): string {
  return factorCopy[id][getScoreBand(score)];
}

export function buildMatchFactors(roommate: RoommateMatch): MatchFactor[] {
  const factorBlueprints: Array<Pick<MatchFactor, 'id' | 'label' | 'icon'> & { score: number }> = [
    { id: 'sleep', label: 'Nhịp sinh hoạt', score: roommate.sleep_score, icon: Moon },
    { id: 'clean', label: 'Mức gọn gàng', score: roommate.cleanliness_score, icon: Sparkles },
    { id: 'noise', label: 'Tiếng ồn', score: roommate.noise_score, icon: Volume2 },
    { id: 'guest', label: 'Khách ghé chơi', score: roommate.guest_score, icon: Users },
    { id: 'weekend', label: 'Cuối tuần', score: roommate.weekend_score, icon: Calendar },
    { id: 'budget', label: 'Ngân sách', score: roommate.budget_score, icon: Wallet },
    { id: 'hobby', label: 'Sở thích', score: roommate.hobby_score, icon: Gamepad2 },
    { id: 'age', label: 'Độ tuổi', score: roommate.age_score, icon: Cake },
    { id: 'location', label: 'Khu vực', score: roommate.location_score, icon: MapPin },
    { id: 'move-in', label: 'Thời gian chuyển vào', score: roommate.move_in_score, icon: Clock },
  ];

  return factorBlueprints.map((factor) => {
    const score = clampScore(factor.score);

    return {
      ...factor,
      score,
      description: getFactorDescription(factor.id, score),
    };
  });
}

export function buildTopSignals(factors: MatchFactor[]) {
  const ranked = [...factors].sort((left, right) => right.score - left.score);
  const preferredSignals = ranked.filter((factor) => factor.score >= 55);
  const fallbackSignals = ranked.filter((factor) => factor.score > 0);
  const pickedSignals = (preferredSignals.length > 0 ? preferredSignals : fallbackSignals.length > 0 ? fallbackSignals : ranked).slice(0, 3);

  return pickedSignals.map((factor) => ({
    label: factor.label,
    score: factor.score,
    description: factor.description,
  }));
}

export function buildConcernSignals(factors: MatchFactor[]) {
  return factors
    .filter((factor) => factor.score > 0 && factor.score < 40)
    .sort((left, right) => left.score - right.score)
    .slice(0, 3)
    .map((factor) => ({
      label: factor.label,
      score: factor.score,
      description: factor.description,
    }));
}

export function getMissingDataLabels(factors: MatchFactor[], limit = 3): string[] {
  return factors
    .filter((factor) => factor.score === 0)
    .map((factor) => factor.label)
    .slice(0, limit);
}
