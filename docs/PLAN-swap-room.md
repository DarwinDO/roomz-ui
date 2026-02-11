# Swap Room Feature Development Plan

## Overview

**Feature:** Swap Room - Chức năng hoán đổi phòng trọ giữa sinh viên  
**Project:** RoomZ - Room Rental Marketplace cho sinh viên Việt Nam  
**Tech Stack:** React + TypeScript + Tailwind CSS + Supabase  
**Status:** Phase 1 - Planning  
**Date:** 11/02/2026  

---

## 1. Feature Analysis

### 1.1 Problem Statement

Sinh viên thường gặp các tình huống cần hoán đổi phòng trọ:
- Đi thực tập/ngành ở quận khác trong thờ gian ngắn (1-3 tháng)
- Du học ngắn hạn và cần ngườ ở thay phòng hiện tại
- Nghỉ hè dài và muốn tiết kiệm tiền phòng bằng cách cho thuê lại
- Chuyển trường/cần chuyển chỗ ở gần hơn

### 1.2 User Stories

#### US-1: Ngườ cho thuê lại (Sublet Owner)
> Là sinh viên đang thuê phòng, tôi muốn đăng tin cho thuê lại phòng trong thờ gian ngắn để tiết kiệm tiền, với điều kiện tôi có thể quay lại ở sau đó.

**Acceptance Criteria:**
- [ ] Có thể đăng tin với thờ gian cụ thể (từ ngày - đến ngày)
- [ ] Đặt giá thuê lại (có thể thấp hơn giá gốc)
- [ ] Yêu cầu ngườ thuê xác thực danh tính
- [ ] Nhận thông báo khi có ngườ quan tâm

#### US-2: Ngườ tìm phòng ngắn hạn (Sublet Seeker)
> Là sinh viên cần chỗ ở ngắn hạn, tôi muốn tìm phòng đã xác thực với giá hợp lý, không cần đặt cọc dài hạn.

**Acceptance Criteria:**
- [ ] Tìm kiếm phòng theo khu vực, giá, thờ gian
- [ ] Xem thông tin chi tiết và ảnh phòng
- [ ] Kiểm tra trạng thái xác thực của chủ phòng
- [ ] Đặt lịch xem phòng hoặc đặt phòng ngay

#### US-3: Hoán đổi phòng (Swap)
> Là sinh viên muốn chuyển phòng, tôi muốn hoán đổi phòng với sinh viên khác có nhu cầu ngược lại để cả hai đều tiết kiệm chi phí.

**Acceptance Criteria:**
- [ ] Đăng ký nhu cầu hoán đổi phòng
- [ ] Hệ thống gợi ý match phù hợp dựa trên vị trí, giá, thờ gian
- [ ] Xem thông tin phòng của đối tác
- [ ] Gửi/nhận lờ mờ hoán đổi
- [ ] Xác nhận và ký kết hợp đồng hoán đổi

### 1.3 User Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SWAP ROOM USER FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

[Sublet Owner Flow]
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   Login  │───▶│  SwapRoom │───▶│  Create  │───▶│  Review  │───▶│  Publish │
│          │    │   Page   │    │  Sublet  │    │  & Edit  │    │   Post   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                                     │
    ┌────────────────────────────────────────────────────────────────┘
    ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Receive │───▶│  Review  │───▶│ Approve/ │───▶│ Complete │
│ Request  │    │ Applicant│    │  Reject  │    │  Swap    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘

[Sublet Seeker Flow]
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Browse  │───▶│  Filter  │───▶│  View    │───▶│  Apply   │───▶│  Wait    │
│  Listings│    │  & Search│    │  Detail  │    │  Sublet  │    │  Approval│
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                                     │
    ┌────────────────────────────────────────────────────────────────┘
    ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Approved│───▶│  Sign    │───▶│  Move    │
│  Match   │    │  Contract│    │    In    │
└──────────┘    └──────────┘    └──────────┘

[Swap Matching Flow]
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Register │───▶│  System  │───▶│  View    │───▶│  Send    │
│  Swap    │    │  Match   │    │  Matches │    │  Request │
│  Intent  │    │  Engine  │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                     │
    ┌────────────────────────────────────────────────┘
    ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Receive │───▶│  Accept  │───▶│  Sign    │───▶│  Execute │
│  Request │    │  /Reject │    │  Agreement│    │   Swap   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 1.4 Business Rules

| Rule ID | Description | Priority |
|---------|-------------|----------|
| BR-1 | Chỉ user đã xác thực danh tính mới được đăng tin cho thuê lại | P0 |
| BR-2 | Thờ gian cho thuê lại tối thiểu 1 tháng, tối đa 6 tháng | P0 |
| BR-3 | Không được cho thuê lại với giá cao hơn giá gốc quá 20% | P1 |
| BR-4 | Chủ phòng gốc phải đồng ý bằng văn bản nếu hợp đồng yêu cầu | P1 |
| BR-5 | Ngườ thuê lại phải đặt cọc 1 tháng qua nền tảng | P0 |
| BR-6 | Phí nền tảng: 5% giá trị hợp đồng | P2 |
| BR-7 | Rating và review bắt buộc sau khi kết thúc sublet | P2 |

---

## 2. Database Schema

### 2.1 New Tables

```sql
-- ============================================
-- Table: sublet_listings
-- Description: Tin đăng cho thuê lại phòng
-- ============================================
CREATE TABLE sublet_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Thờ gian cho thuê
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Giá cả
    original_price DECIMAL(10,2) NOT NULL, -- Giá gốc
    sublet_price DECIMAL(10,2) NOT NULL,   -- Giá cho thuê lại
    deposit_required DECIMAL(10,2) DEFAULT 0,
    
    -- Mô tả và yêu cầu
    description TEXT,
    requirements TEXT[], -- ['student_card', 'id_verified', 'no_pet', ...]
    
    -- Trạng thái
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('draft', 'pending', 'active', 'booked', 'completed', 'cancelled')),
    
    -- Thống kê
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Validation
    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    CONSTRAINT valid_price CHECK (sublet_price > 0),
    CONSTRAINT max_duration CHECK (end_date <= start_date + INTERVAL '6 months')
);

-- Indexes
CREATE INDEX idx_sublet_listings_status ON sublet_listings(status);
CREATE INDEX idx_sublet_listings_owner ON sublet_listings(owner_id);
CREATE INDEX idx_sublet_listings_dates ON sublet_listings(start_date, end_date);
CREATE INDEX idx_sublet_listings_price ON sublet_listings(sublet_price);

-- ============================================
-- Table: swap_requests
-- Description: Yêu cầu hoán đổi phòng
-- ============================================
CREATE TABLE swap_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ngườ gửi yêu cầu
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requester_listing_id UUID NOT NULL REFERENCES sublet_listings(id) ON DELETE CASCADE,
    
    -- Ngườ nhận yêu cầu
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_listing_id UUID NOT NULL REFERENCES sublet_listings(id) ON DELETE CASCADE,
    
    -- Nội dung
    message TEXT,
    proposed_start_date DATE NOT NULL,
    proposed_end_date DATE NOT NULL,
    
    -- Trạng thái
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected', 'negotiating', 'confirmed', 'completed', 'cancelled')),
    
    -- Timeline
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Metadata
    rejection_reason TEXT,
    cancellation_reason TEXT
);

-- Indexes
CREATE INDEX idx_swap_requests_requester ON swap_requests(requester_id);
CREATE INDEX idx_swap_requests_recipient ON swap_requests(recipient_id);
CREATE INDEX idx_swap_requests_status ON swap_requests(status);
CREATE INDEX idx_swap_requests_expires ON swap_requests(expires_at);

-- ============================================
-- Table: swap_matches
-- Description: Gợi ý match hoán đổi (pre-calculated)
-- ============================================
CREATE TABLE swap_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    listing_1_id UUID NOT NULL REFERENCES sublet_listings(id) ON DELETE CASCADE,
    listing_2_id UUID NOT NULL REFERENCES sublet_listings(id) ON DELETE CASCADE,
    
    -- Điểm tương đồng (0-100)
    match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    
    -- Chi tiết điểm
    location_score INTEGER,      -- Gần khu vực mong muốn
    price_score INTEGER,         -- Chênh lệch giá
    time_score INTEGER,          -- Thờ gian phù hợp
    preference_score INTEGER,    -- Sở thích/lối sống
    
    -- Lý do match
    match_reasons TEXT[],
    
    -- Trạng thái
    is_active BOOLEAN DEFAULT true,
    shown_to_user1 BOOLEAN DEFAULT false,
    shown_to_user2 BOOLEAN DEFAULT false,
    user1_swiped BOOLEAN,        -- true: like, false: pass, null: not seen
    user2_swiped BOOLEAN,
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT different_listings CHECK (listing_1_id != listing_2_id)
);

CREATE INDEX idx_swap_matches_score ON swap_matches(match_score DESC);
CREATE INDEX idx_swap_matches_listing1 ON swap_matches(listing_1_id);
CREATE INDEX idx_swap_matches_listing2 ON swap_matches(listing_2_id);
CREATE INDEX idx_swap_matches_active ON swap_matches(is_active, match_score);

-- ============================================
-- Table: sublet_applications
-- Description: Đơn đăng ký thuê phòng sublet
-- ============================================
CREATE TABLE sublet_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    sublet_listing_id UUID NOT NULL REFERENCES sublet_listings(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Thông tin đăng ký
    message TEXT,
    preferred_move_in_date DATE NOT NULL,
    preferred_move_out_date DATE,
    
    -- Tài liệu
    documents JSONB, -- [{type: 'student_card', url: '...'}, ...]
    
    -- Trạng thái
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'withdrawn', 'expired')),
    
    -- Timeline
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Review
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    rejection_reason TEXT,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 days')
);

CREATE INDEX idx_sublet_applications_listing ON sublet_applications(sublet_listing_id);
CREATE INDEX idx_sublet_applications_applicant ON sublet_applications(applicant_id);
CREATE INDEX idx_sublet_applications_status ON sublet_applications(status);

-- ============================================
-- Table: swap_agreements
-- Description: Hợp đồng hoán đổi đã ký kết
-- ============================================
CREATE TABLE swap_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    swap_request_id UUID NOT NULL REFERENCES swap_requests(id) ON DELETE CASCADE,
    
    -- Bên A
    party_a_id UUID NOT NULL REFERENCES users(id),
    party_a_listing_id UUID NOT NULL REFERENCES sublet_listings(id),
    party_a_signed_at TIMESTAMP WITH TIME ZONE,
    party_a_signature_url TEXT,
    
    -- Bên B
    party_b_id UUID NOT NULL REFERENCES users(id),
    party_b_listing_id UUID NOT NULL REFERENCES sublet_listings(id),
    party_b_signed_at TIMESTAMP WITH TIME ZONE,
    party_b_signature_url TEXT,
    
    -- Điều khoản
    terms JSONB NOT NULL, -- {start_date, end_date, deposit, rules, ...}
    
    -- Trạng thái
    status VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending_signatures', 'active', 'completed', 'terminated')),
    
    -- Timeline
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Phí
    platform_fee DECIMAL(10,2),
    fee_paid_by UUID REFERENCES users(id),
    fee_paid_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- Table: sublet_reviews
-- Description: Đánh giá sau khi kết thúc sublet
-- ============================================
CREATE TABLE sublet_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    sublet_listing_id UUID NOT NULL REFERENCES sublet_listings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Đánh giá
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
    
    -- Nội dung
    comment TEXT,
    would_recommend BOOLEAN,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(sublet_listing_id, reviewer_id)
);

CREATE INDEX idx_sublet_reviews_listing ON sublet_reviews(sublet_listing_id);
CREATE INDEX idx_sublet_reviews_reviewee ON sublet_reviews(reviewee_id);
```

### 2.2 New Enums

```sql
-- Thêm vào enum notification_type
ALTER TYPE notification_type ADD VALUE 'sublet_request';
ALTER TYPE notification_type ADD VALUE 'sublet_approved';
ALTER TYPE notification_type ADD VALUE 'swap_match';
ALTER TYPE notification_type ADD VALUE 'swap_request';
ALTER TYPE notification_type ADD VALUE 'swap_confirmed';
```

### 2.3 RLS Policies

```sql
-- sublet_listings policies
ALTER TABLE sublet_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sublet listings are viewable by everyone" 
    ON sublet_listings FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create their own sublet listings" 
    ON sublet_listings FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own sublet listings" 
    ON sublet_listings FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own sublet listings" 
    ON sublet_listings FOR DELETE USING (owner_id = auth.uid());

-- swap_requests policies
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own swap requests" 
    ON swap_requests FOR SELECT USING (
        requester_id = auth.uid() OR recipient_id = auth.uid()
    );

CREATE POLICY "Users can create swap requests" 
    ON swap_requests FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Recipients can update swap request status" 
    ON swap_requests FOR UPDATE USING (recipient_id = auth.uid());
```

---

## 3. API Endpoints

### 3.1 REST API Endpoints

#### Sublet Listings API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/sublists` | Lấy danh sách tin cho thuê lại | No |
| GET | `/api/sublists/:id` | Lấy chi tiết tin cho thuê lại | No |
| POST | `/api/sublists` | Tạo tin cho thuê lại mới | Yes |
| PATCH | `/api/sublists/:id` | Cập nhật tin cho thuê lại | Yes (Owner) |
| DELETE | `/api/sublists/:id` | Xóa tin cho thuê lại | Yes (Owner) |
| POST | `/api/sublists/:id/apply` | Nộp đơn đăng ký thuê | Yes |
| GET | `/api/sublists/:id/applications` | Lấy danh sách đơn đăng ký | Yes (Owner) |

#### Swap Requests API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/swaps/matches` | Lấy danh sách gợi ý match | Yes |
| POST | `/api/swaps/requests` | Gửi yêu cầu hoán đổi | Yes |
| GET | `/api/swaps/requests` | Lấy danh sách yêu cầu | Yes |
| GET | `/api/swaps/requests/:id` | Lấy chi tiết yêu cầu | Yes |
| PATCH | `/api/swaps/requests/:id` | Cập nhật trạng thái | Yes |
| POST | `/api/swaps/requests/:id/accept` | Chấp nhận yêu cầu | Yes |
| POST | `/api/swaps/requests/:id/reject` | Từ chối yêu cầu | Yes |
| POST | `/api/swaps/requests/:id/cancel` | Hủy yêu cầu | Yes |

#### Swap Agreements API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/swaps/agreements` | Lấy danh sách hợp đồng | Yes |
| GET | `/api/swaps/agreements/:id` | Lấy chi tiết hợp đồng | Yes |
| POST | `/api/swaps/agreements/:id/sign` | Ký hợp đồng | Yes |
| GET | `/api/swaps/agreements/:id/document` | Tải hợp đồng PDF | Yes |

### 3.2 Supabase Edge Functions

```typescript
// functions/swap-match-engine/index.ts
// Tính toán và cập nhật gợi ý match

// functions/swap-notification/index.ts  
// Gửi notification khi có match/request mới

// functions/swap-agreement-generator/index.ts
// Tạo hợp đồng PDF
```

### 3.3 Database Functions

```sql
-- Tính điểm match giữa 2 listing
CREATE OR REPLACE FUNCTION calculate_swap_match_score(
    p_listing1_id UUID,
    p_listing2_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_listing1 RECORD;
    v_listing2 RECORD;
    v_user1_prefs RECORD;
    v_user2_prefs RECORD;
BEGIN
    -- Lấy thông tin listings
    SELECT * INTO v_listing1 FROM sublet_listings WHERE id = p_listing1_id;
    SELECT * INTO v_listing2 FROM sublet_listings WHERE id = p_listing2_id;
    
    -- Location score (30%)
    -- Dựa trên khoảng cách giữa 2 phòng
    
    -- Price score (25%)
    -- Chênh lệch giá càng nhỏ càng tốt
    
    -- Time score (25%)
    -- Thờ gian overlap càng nhiều càng tốt
    
    -- Preference score (20%)
    -- Dựa trên user preferences
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Tìm các match tiềm năng cho một listing
CREATE OR REPLACE FUNCTION find_potential_swap_matches(
    p_listing_id UUID,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    match_id UUID,
    listing_id UUID,
    match_score INTEGER,
    match_reasons TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.id,
        CASE 
            WHEN sm.listing_1_id = p_listing_id THEN sm.listing_2_id
            ELSE sm.listing_1_id
        END,
        sm.match_score,
        sm.match_reasons
    FROM swap_matches sm
    WHERE (sm.listing_1_id = p_listing_id OR sm.listing_2_id = p_listing_id)
        AND sm.is_active = true
        AND sm.match_score >= 60
    ORDER BY sm.match_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. UI/UX Components

### 4.1 Component List

#### Pages

| Component | Path | Description |
|-----------|------|-------------|
| `SwapRoomPage` | `src/pages/SwapRoomPage.tsx` | Trang chính SwapRoom (đã có) |
| `SubletDetailPage` | `src/pages/SubletDetailPage.tsx` | Chi tiết tin cho thuê (đã có) |
| `SwapMatchesPage` | `src/pages/SwapMatchesPage.tsx` | Trang gợi ý match mới |
| `SwapRequestsPage` | `src/pages/SwapRequestsPage.tsx` | Quản lý yêu cầu hoán đổi |
| `MySubletsPage` | `src/pages/MySubletsPage.tsx` | Quản lý tin đăng của tôi |
| `SwapAgreementPage` | `src/pages/SwapAgreementPage.tsx` | Xem và ký hợp đồng |

#### Components

| Component | Path | Description |
|-----------|------|-------------|
| `SubletCard` | `src/components/swap/SubletCard.tsx` | Card hiển thị tin cho thuê |
| `SwapMatchCard` | `src/components/swap/SwapMatchCard.tsx` | Card gợi ý match |
| `SwapRequestCard` | `src/components/swap/SwapRequestCard.tsx` | Card yêu cầu hoán đổi |
| `SubletFilter` | `src/components/swap/SubletFilter.tsx` | Bộ lọc tìm kiếm |
| `SwapComparison` | `src/components/swap/SwapComparison.tsx` | So sánh 2 phòng |
| `CreateSubletDialog` | `src/components/modals/CreateSubletDialog.tsx` | Dialog tạo tin (đã có) |
| `ApplySubletDialog` | `src/components/modals/ApplySubletDialog.tsx` | Dialog nộp đơn |
| `SwapRequestDialog` | `src/components/modals/SwapRequestDialog.tsx` | Dialog gửi yêu cầu |
| `AgreementSigner` | `src/components/swap/AgreementSigner.tsx` | Component ký hợp đồng |

#### Hooks

| Hook | Path | Description |
|------|------|-------------|
| `useSublets` | `src/hooks/useSublets.ts` | Quản lý sublet listings |
| `useSwapMatches` | `src/hooks/useSwapMatches.ts` | Quản lý gợi ý match |
| `useSwapRequests` | `src/hooks/useSwapRequests.ts` | Quản lý yêu cầu hoán đổi |
| `useSubletApplications` | `src/hooks/useSubletApplications.ts` | Quản lý đơn đăng ký |

#### Services

| Service | Path | Description |
|---------|------|-------------|
| `sublets.ts` | `src/services/sublets.ts` | API calls cho sublets |
| `swap.ts` | `src/services/swap.ts` | API calls cho swap |

### 4.2 Component Specifications

#### SubletCard

```typescript
interface SubletCardProps {
  id: string;
  image: string;
  title: string;
  location: string;
  originalPrice: number;
  subletPrice: number;
  startDate: string;
  endDate: string;
  verified: boolean;
  ownerAvatar?: string;
  ownerName?: string;
  matchPercentage?: number; // For swap matches
  onClick?: () => void;
  onApply?: () => void;
  onSwapRequest?: () => void;
}
```

#### SwapMatchCard

```typescript
interface SwapMatchCardProps {
  matchId: string;
  myListing: SubletListing;
  matchedListing: SubletListing;
  matchScore: number;
  matchReasons: string[];
  onAccept: () => void;
  onPass: () => void;
  onViewDetails: () => void;
}
```

### 4.3 TanStack Query Patterns

The project uses **TanStack Query v5** for server state management. All Swap Room hooks will follow the established patterns from `useRooms.ts`:

#### Query Key Factory Pattern

```typescript
// src/hooks/useSublets.ts
export const subletKeys = {
  all: ['sublets'] as const,
  lists: () => [...subletKeys.all, 'list'] as const,
  list: (filters: SubletFilters) => [...subletKeys.lists(), filters] as const,
  details: () => [...subletKeys.all, 'detail'] as const,
  detail: (id: string) => [...subletKeys.details(), id] as const,
  matches: (userId: string) => [...subletKeys.all, 'matches', userId] as const,
  requests: (userId: string) => [...subletKeys.all, 'requests', userId] as const,
  applications: (listingId: string) => [...subletKeys.all, 'applications', listingId] as const,
};
```

#### Hook Examples

```typescript
// useSublets - List with pagination
export function useSublets(filters: SubletFilters) {
  return useInfiniteQuery<SubletSearchResponse>({
    queryKey: subletKeys.list(filters),
    queryFn: ({ pageParam }) => fetchSublets({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => 
      lastPage.hasMore ? allPages.length + 1 : undefined,
    staleTime: 30_000,
  });
}

// useSublet - Detail query
export function useSublet(id: string | undefined) {
  return useQuery<SubletListing>({
    queryKey: subletKeys.detail(id!),
    queryFn: () => fetchSubletById(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

// useSwapMatches - Background refetching
export function useSwapMatches(userId: string) {
  return useQuery<SwapMatch[]>({
    queryKey: subletKeys.matches(userId),
    queryFn: () => fetchSwapMatches(userId),
    staleTime: 5 * 60_000, // 5 minutes
    refetchInterval: 5 * 60_000, // Auto refetch every 5 min
  });
}

// useSwapRequests - Real-time updates
export function useSwapRequests(userId: string) {
  return useQuery<SwapRequest[]>({
    queryKey: subletKeys.requests(userId),
    queryFn: () => fetchSwapRequests(userId),
    staleTime: 10_000,
  });
}

// Mutations with optimistic updates
export function useCreateSublet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createSubletAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subletKeys.lists() });
    },
  });
}

export function useSendSwapRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sendSwapRequestAPI,
    onMutate: async (newRequest) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: subletKeys.requests(newRequest.recipientId) });
      const previousRequests = queryClient.getQueryData(subletKeys.requests(newRequest.recipientId));
      queryClient.setQueryData(subletKeys.requests(newRequest.recipientId), (old: any) => [...old, newRequest]);
      return { previousRequests };
    },
    onError: (err, newRequest, context) => {
      // Rollback on error
      queryClient.setQueryData(subletKeys.requests(newRequest.recipientId), context?.previousRequests);
    },
    onSettled: (data, error, newRequest) => {
      queryClient.invalidateQueries({ queryKey: subletKeys.requests(newRequest.recipientId) });
    },
  });
}

// Cache invalidation helpers
export function useInvalidateSublets() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: subletKeys.all }),
    invalidateList: () => queryClient.invalidateQueries({ queryKey: subletKeys.lists() }),
    invalidateDetail: (id: string) => queryClient.invalidateQueries({ queryKey: subletKeys.detail(id) }),
    invalidateMatches: (userId: string) => queryClient.invalidateQueries({ queryKey: subletKeys.matches(userId) }),
  };
}
```

#### Why TanStack Query for Swap Room?

| Feature | Benefit for Swap Room |
|---------|----------------------|
| **Caching** | Tránh fetch lại sublet listings đã load |
| **Background Refetching** | Swap matches luôn được cập nhật mới nhất |
| **Optimistic Updates** | UI phản hồi ngay khi gửi swap request |
| **Retry Logic** | Tự động retry khi network error |
| **Query Keys** | Invalidation chính xác theo scope |
| **Pagination** | Load more sublet listings hiệu quả |

### 4.4 State Management

```typescript
// src/types/swap.ts

export interface SubletListing {
  id: string;
  originalRoomId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  originalPrice: number;
  subletPrice: number;
  depositRequired: number;
  description?: string;
  requirements: string[];
  status: 'draft' | 'pending' | 'active' | 'booked' | 'completed' | 'cancelled';
  viewCount: number;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
  // Joined data
  room?: Room;
  owner?: User;
  images?: RoomImage[];
}

export interface SwapRequest {
  id: string;
  requesterId: string;
  requesterListingId: string;
  recipientId: string;
  recipientListingId: string;
  message?: string;
  proposedStartDate: string;
  proposedEndDate: string;
  status: SwapRequestStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  // Joined data
  requester?: User;
  requesterListing?: SubletListing;
  recipient?: User;
  recipientListing?: SubletListing;
}

export interface SwapMatch {
  id: string;
  listing1Id: string;
  listing2Id: string;
  matchScore: number;
  locationScore?: number;
  priceScore?: number;
  timeScore?: number;
  preferenceScore?: number;
  matchReasons: string[];
  isActive: boolean;
  calculatedAt: string;
  // Joined data
  myListing?: SubletListing;
  matchedListing?: SubletListing;
}

export type SwapRequestStatus = 
  | 'pending' 
  | 'accepted' 
  | 'rejected' 
  | 'negotiating' 
  | 'confirmed' 
  | 'completed' 
  | 'cancelled';
```

---

## 5. Testing Strategy

### 5.1 Unit Tests

```typescript
// tests/unit/swap.test.ts

describe('Swap Match Calculation', () => {
  it('should calculate high score for matching location and price', () => {
    // Test case
  });
  
  it('should calculate low score for distant locations', () => {
    // Test case
  });
  
  it('should handle overlapping dates correctly', () => {
    // Test case
  });
});

describe('Sublet Validation', () => {
  it('should reject sublet with price > 120% of original', () => {
    // Test case
  });
  
  it('should reject sublet with duration > 6 months', () => {
    // Test case
  });
  
  it('should require verified user to create sublet', () => {
    // Test case
  });
});
```

### 5.2 Integration Tests

```typescript
// tests/integration/swap-flow.test.ts

describe('Complete Swap Flow', () => {
  it('should complete full swap request flow', async () => {
    // 1. User A creates sublet listing
    // 2. User B creates sublet listing
    // 3. System calculates match
    // 4. User A sends swap request
    // 5. User B accepts
    // 6. Both sign agreement
    // 7. Status updated to active
  });
  
  it('should handle swap request expiration', async () => {
    // Test expiration logic
  });
  
  it('should handle cancellation by either party', async () => {
    // Test cancellation
  });
});
```

### 5.3 E2E Tests

```typescript
// tests/e2e/swap.spec.ts

test('user can create sublet listing', async ({ page }) => {
  await page.goto('/swap');
  await page.click('[data-testid="create-sublet-btn"]');
  await page.fill('[data-testid="start-date"]', '2025-06-01');
  await page.fill('[data-testid="end-date"]', '2025-08-31');
  await page.fill('[data-testid="price"]', '2500000');
  await page.click('[data-testid="submit-btn"]');
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});

test('user can send swap request', async ({ page }) => {
  await page.goto('/swap/matches');
  await page.click('[data-testid="match-card"]:first-child');
  await page.click('[data-testid="request-swap-btn"]');
  await page.fill('[data-testid="message"]', 'I want to swap with you!');
  await page.click('[data-testid="send-request-btn"]');
  await expect(page.locator('[data-testid="request-sent"]')).toBeVisible();
});

test('user can accept swap request', async ({ page }) => {
  // Setup: Create a swap request
  await page.goto('/swap/requests');
  await page.click('[data-testid="request-card"]:first-child');
  await page.click('[data-testid="accept-btn"]');
  await expect(page.locator('[data-testid="create-agreement-btn"]')).toBeVisible();
});
```

### 5.4 Test Coverage Requirements

| Category | Target Coverage |
|----------|-----------------|
| Database Functions | 90% |
| API Endpoints | 85% |
| UI Components | 80% |
| E2E Critical Flows | 100% |

### 5.5 Test Data

```sql
-- Seed data for testing
INSERT INTO sublet_listings (id, owner_id, original_room_id, start_date, end_date, original_price, sublet_price, status)
VALUES 
  ('test-sublet-1', 'test-user-1', 'test-room-1', '2025-06-01', '2025-08-31', 3500000, 3000000, 'active'),
  ('test-sublet-2', 'test-user-2', 'test-room-2', '2025-06-15', '2025-09-15', 4000000, 3800000, 'active');
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Database schema migration
- [ ] RLS policies
- [ ] Database functions
- [ ] TypeScript types

### Phase 2: Core API (Week 1-2)
- [ ] Sublet listings API
- [ ] Applications API
- [ ] Basic Supabase edge functions

### Phase 3: UI Components (Week 2-3)
- [ ] SubletCard component
- [ ] SubletFilter component
- [ ] Update SwapRoomPage
- [ ] CreateSubletDialog enhancements

### Phase 4: Swap Matching (Week 3-4)
- [ ] Match calculation engine
- [ ] Swap match API
- [ ] SwapMatchesPage
- [ ] SwapMatchCard component

### Phase 5: Swap Requests (Week 4-5)
- [ ] Swap request API
- [ ] SwapRequestsPage
- [ ] Request dialogs
- [ ] Notifications

### Phase 6: Agreements (Week 5-6)
- [ ] Agreement generation
- [ ] Digital signature
- [ ] PDF generation
- [ ] Payment integration

### Phase 7: Testing & Polish (Week 6-7)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Bug fixes
- [ ] Performance optimization

---

## 7. Success Criteria

| Criteria | Target | Measurement |
|----------|--------|-------------|
| **Functional** | 100% | All user stories complete |
| **Test Coverage** | > 80% | Code coverage report |
| **Performance** | < 2s | Page load time |
| **Match Accuracy** | > 70% | User feedback survey |
| **Conversion Rate** | > 15% | Swaps completed / Requests sent |

---

## 8. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low user adoption | High | Medium | Marketing campaign, referral rewards |
| Fraudulent listings | High | Low | Strict verification, review system |
| Legal issues with subletting | Medium | Low | Clear terms, landlord notification |
| Match algorithm not effective | Medium | Medium | Continuous improvement, user feedback |

---

## 9. Appendix

### A. Existing Code References

- `src/pages/SwapRoomPage.tsx` - Trang SwapRoom hiện tại
- `src/pages/SubletDetailPage.tsx` - Trang chi tiết sublet
- `src/components/modals/CreateSubletDialog.tsx` - Dialog tạo sublet
- `src/lib/database.types.ts` - Database types

### B. Related Features

- Roommate Finder (roommates feature)
- Verification System
- Booking System
- Payment System
- Notification System

---

**Plan Created:** 11/02/2026  
**Next Review:** Pending User Approval
