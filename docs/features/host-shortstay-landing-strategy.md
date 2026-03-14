# Host + Short-Stay + Landing Product Strategy

## Scope
- Host language and supply-side flow
- Short-stay / sublet / swap positioning
- Landing page, IA, navigation, and entry points

## Decisions Locked
1. User-facing language changes from `landlord` to `host`.
2. `sublet` becomes a variant of room detail inside one shared design system.
3. Host onboarding becomes a clear operational workflow, not a JSON blob in `users.preferences`.
4. `SwapRoom` is de-emphasized as a top-level promise and repositioned as `Ở ngắn hạn` / short-stay.
5. Landing page should be intent-driven, not a generic feature grid.

## Product Architecture
### Demand-side pillars
- Tìm phòng
- Tìm bạn cùng phòng
- Ở ngắn hạn
- Dịch vụ & ưu đãi

### Supply-side pillar
- Host console

### Platform layer
- Verification
- Premium
- ROMI
- Admin quality / moderation

## Language System
### User-facing terms
- `Host` replaces `landlord`
- `Host console` replaces `Quản lý phòng` / landlord dashboard
- `Đăng ký làm host` replaces rent-out entry labels in profile and landing
- `Ở ngắn hạn` replaces `SwapRoom` in navigation and top-level positioning
- `Hoán đổi` remains a secondary action inside the short-stay module

### Internal terms kept for now
- `landlord_id`
- `role = landlord`
- `pending_landlord`
- existing routes `/landlord` and `/become-landlord`

Rationale: change UI first, defer schema churn.

## Information Architecture
### Primary nav
- Tìm phòng
- Tìm bạn cùng phòng
- Ở ngắn hạn
- Dịch vụ
- Cộng đồng
- Ưu đãi

### Profile menu states
- `role = landlord` => show `Host console`
- `account_status = pending_landlord` => show `Đơn host đang chờ duyệt`
- otherwise => show `Đăng ký làm host`

## Landing Strategy
### Hero promise
- Tìm phòng đã xác thực
- Ghép ở phù hợp
- Ở ngắn hạn linh hoạt
- Sống tiện hơn quanh trường

### Primary entry points
- Tìm phòng
- Tìm bạn cùng phòng
- Ở ngắn hạn
- Đăng ký làm host

### Section order
1. Hero with sharp value proposition
2. Intent cards
3. Why RommZ with proof, not generic features
4. By-campus / by-location discovery
5. Ecosystem section: room, roommate, short-stay, services, ROMI
6. Host trust / verification section
7. Final CTA

### Things to remove or reduce
- SwapRoom as an equal hero pillar
- generic testimonial/value-card repetition
- mixed language that over-promises `swap`

## Short-Stay / Swap Strategy
### Repositioning
- Module becomes `Ở ngắn hạn`
- Core behavior: browse short-stay / sublet listings
- Secondary behavior: swap / exchange suggestions and requests

### Page structure
- Main tab: Tìm chỗ ở
- Secondary tab: Hoán đổi
- Tertiary tab: Tin của tôi

### Promise
Do not present it as a mature swap marketplace unless inventory and requests justify it.

## Listing Detail Strategy
### Shared detail shell
Both room detail and sublet detail should share:
- gallery
- title + location
- host block
- map
- nearby places
- amenities
- safety / trust layer
- rich context section

### Variant modules
#### Standard room
- reveal contact
- book viewing
- contact host
- favorite

#### Short-stay / sublet
- availability period
- apply for short-stay
- contact host
- original room relation
- duration / flexibility terms

## Host Onboarding Strategy
### Current issue
Application data is stored in `users.preferences.landlord_application`. This is not operationally sound.

### Target model
Create a dedicated `host_applications` workflow with:
- applicant_id
- phone
- address
- property_count
- experience
- description
- documents
- status
- submitted_at
- reviewed_by
- reviewed_at
- rejection_reason

### Host profile layer
After approval, maintain a host-facing profile / status layer for:
- verification level
- trust signals
- listing count
- response rate
- moderation state

## Host Console Strategy
### Current state
Functional MVP: room list + bookings.

### Target state
A real host console with:
- listing management
- booking management
- quality issues / moderation inbox
- quick actions
- messaging visibility
- performance insights

## Consistency Work Required
1. Rename visible landlord language to host.
2. Rename visible SwapRoom language to ở ngắn hạn.
3. Unify room detail and sublet detail visual system.
4. Separate host application workflow from user preferences JSON.
5. Align ROMI, landing, and premium copy with the new IA.

## Phased Roadmap
### Phase 1: Product language unification
- host naming in UI
- short-stay naming in UI
- nav/profile/landing updates

### Phase 2: Landing + IA redesign
- hero
- intent cards
- host CTA
- short-stay positioning

### Phase 3: Shared listing detail shell
- unify room detail and sublet detail
- preserve variant action modules

### Phase 4: Host domain restructuring
- host applications table/workflow
- host profile / status model
- operational admin review

### Phase 5: Follow-through
- ROMI deep-link and wording alignment
- analytics alignment
- premium / verification messaging alignment
