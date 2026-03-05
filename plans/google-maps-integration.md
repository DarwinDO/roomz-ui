# Google Maps Integration Plan for RoomZ

## Tổng quan
Chuyển từ Leaflet + OpenStreetMap sang Google Maps Platform để cải thiện trải nghiệm ngườidùng và thêm tính năng mới.

## Agents & Skills sẽ sử dụng

| Phase | Agent/Skill | Mục đích |
|-------|-------------|----------|
| **Phase 1** | `@frontend-specialist` + `@mobile-developer` | Setup configuration |
| **Phase 2** | `@frontend-specialist` + `nextjs-react-expert` | Web implementation |
| **Phase 3** | `@mobile-developer` + `mobile-design` | Mobile implementation |
| **Phase 4** | `@backend-specialist` + `api-patterns` | Edge Functions & APIs |
| **Phase 5** | `@frontend-specialist` + `testing-patterns` | Testing & Optimization |

---

## Phase 1: Setup & Configuration (Ngày 1)

### 1.1 Google Cloud Console Setup
```bash
# Tạo project mới hoặc dùng existing
# Enable APIs:
- Maps JavaScript API
- Places API
- Geocoding API
- Directions API
- Maps SDK for iOS
- Maps SDK for Android
```

### 1.2 Environment Variables
```env
# packages/web/.env
VITE_GOOGLE_MAPS_API_KEY=your_api_key

# packages/mobile/.env
GOOGLE_MAPS_API_KEY=your_api_key
```

### 1.3 Mobile Configuration
```xml
<!-- packages/mobile/android/app/src/main/AndroidManifest.xml -->
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="${GOOGLE_MAPS_API_KEY}" />
```

```xml
<!-- packages/mobile/ios/RoomzMobile/Info.plist -->
<key>GMSApiKey</key>
<string>${GOOGLE_MAPS_API_KEY}</string>
```

---

## Phase 2: Web Implementation (Ngày 2-3)

### 2.1 Cài đặt Dependencies
```bash
cd packages/web
npm install @react-google-maps/api @types/google.maps
```

### 2.2 Tạo Google Maps Provider
```typescript
// packages/web/src/components/maps/GoogleMapsProvider.tsx
import { LoadScript } from '@react-google-maps/api';

const libraries = ['places', 'geometry'];

export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
    >
      {children}
    </LoadScript>
  );
}
```

### 2.3 Thay thế RoomMap (Leaflet → Google Maps)
```typescript
// packages/web/src/components/maps/GoogleRoomMap.tsx
import { GoogleMap, Marker, InfoWindow, Circle } from '@react-google-maps/api';

interface GoogleRoomMapProps {
  rooms: RoomWithDetails[];
  center?: { lat: number; lng: number };
  zoom?: number;
  showRadius?: boolean;  // ⭐ Tính năng mới
  radiusKm?: number;     // ⭐ Tính năng mới
}

export function GoogleRoomMap({ 
  rooms, 
  center, 
  zoom = 13,
  showRadius = false,
  radiusKm = 2 
}: GoogleRoomMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithDetails | null>(null);
  
  // Fit bounds to show all markers
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (rooms.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      rooms.forEach(room => {
        bounds.extend({ lat: room.latitude, lng: room.longitude });
      });
      map.fitBounds(bounds);
    }
  }, [rooms]);

  return (
    <GoogleMap
      onLoad={onLoad}
      center={center}
      zoom={zoom}
      mapContainerClassName="w-full h-full"
      options={{
        mapTypeId: 'hybrid',  // ⭐ Satellite view
        streetViewControl: true,  // ⭐ Street View
        fullscreenControl: true,
      }}
    >
      {/* Radius circle */}
      {showRadius && center && (
        <Circle
          center={center}
          radius={radiusKm * 1000}
          options={{
            fillColor: '#0284C7',
            fillOpacity: 0.1,
            strokeColor: '#0284C7',
            strokeOpacity: 0.5,
          }}
        />
      )}
      
      {/* Room markers */}
      {rooms.map(room => (
        <Marker
          key={room.id}
          position={{ lat: room.latitude, lng: room.longitude }}
          onClick={() => setSelectedRoom(room)}
          icon={{
            url: '/marker-room.png',
            scaledSize: new google.maps.Size(40, 40),
          }}
        />
      ))}
      
      {/* InfoWindow */}
      {selectedRoom && (
        <InfoWindow
          position={{ lat: selectedRoom.latitude, lng: selectedRoom.longitude }}
          onCloseClick={() => setSelectedRoom(null)}
        >
          <RoomPopup room={selectedRoom} />
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
```

### 2.4 ⭐ Tính năng mới: Places Autocomplete
```typescript
// packages/web/src/components/maps/PlacesAutocomplete.tsx
import { Autocomplete } from '@react-google-maps/api';

export function PlacesAutocomplete({ onSelect }: PlacesAutocompleteProps) {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  
  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      onSelect({
        address: place.formatted_address,
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng(),
      });
    }
  };

  return (
    <Autocomplete
      onLoad={setAutocomplete}
      onPlaceChanged={onPlaceChanged}
      options={{
        componentRestrictions: { country: 'vn' },  // Chỉ VN
        types: ['address'],
      }}
    >
      <Input placeholder="Nhập địa chỉ..." />
    </Autocomplete>
  );
}
```

### 2.5 ⭐ Tính năng mới: Directions
```typescript
// packages/web/src/components/maps/DirectionsPanel.tsx
import { DirectionsService, DirectionsRenderer } from '@react-google-maps/api';

export function DirectionsPanel({ origin, destination }: DirectionsProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  
  return (
    <>
      <DirectionsService
        options={{
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
        }}
        callback={(result) => result && setDirections(result)}
      />
      {directions && <DirectionsRenderer directions={directions} />}
    </>
  );
}
```

---

## Phase 3: Mobile Implementation (Ngày 4-5)

### 3.1 Cài đặt Dependencies
```bash
cd packages/mobile
npx expo install react-native-maps
```

### 3.2 iOS Setup
```bash
cd ios
pod install
```

### 3.3 Tạo RoomMap cho Mobile
```typescript
// packages/mobile/components/maps/RoomMap.tsx
import MapView, { Marker, Callout, Circle } from 'react-native-maps';

interface RoomMapProps {
  rooms: RoomWithDetails[];
  initialRegion?: Region;
  showUserLocation?: boolean;
  onMarkerPress?: (room: RoomWithDetails) => void;
}

export function RoomMap({ 
  rooms, 
  initialRegion,
  showUserLocation = true,
  onMarkerPress 
}: RoomMapProps) {
  return (
    <MapView
      provider={Platform.OS === 'ios' ? undefined : 'google'}
      style={styles.map}
      initialRegion={initialRegion}
      showsUserLocation={showUserLocation}
      showsMyLocationButton={true}
      mapType="hybrid"  // ⭐ Satellite view
    >
      {rooms.map(room => (
        <Marker
          key={room.id}
          coordinate={{
            latitude: room.latitude,
            longitude: room.longitude,
          }}
          onPress={() => onMarkerPress?.(room)}
        >
          <Callout>
            <RoomCallout room={room} />
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}
```

### 3.4 ⭐ Tính năng mới: In-app Navigation
```typescript
// packages/mobile/components/maps/NavigationButton.tsx
import { Linking, Platform } from 'react-native';

export function openNavigation(room: RoomWithDetails) {
  const destination = `${room.latitude},${room.longitude}`;
  const label = encodeURIComponent(room.title);
  
  if (Platform.OS === 'ios') {
    // Apple Maps
    Linking.openURL(`http://maps.apple.com/?daddr=${destination}`);
  } else {
    // Google Maps
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${label}`
    );
  }
}
```

### 3.5 Tích hợp vào Room Detail Screen
```typescript
// packages/mobile/app/(app)/room/[id].tsx
// Thêm section map mới

{room.latitude && room.longitude && (
  <View style={styles.mapSection}>
    <Text style={styles.sectionTitle}>Vị trí</Text>
    <RoomMap
      rooms={[room]}
      initialRegion={{
        latitude: room.latitude,
        longitude: room.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    />
    <Button 
      title="Chỉ đường" 
      onPress={() => openNavigation(room)} 
    />
  </View>
)}
```

---

## Phase 4: Backend & APIs (Ngày 6)

### 4.1 Edge Function: Geocoding
```typescript
// supabase/functions/geocode/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { address } = await req.json();
  
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${Deno.env.get('GOOGLE_MAPS_API_KEY')}&region=vn`
  );
  
  const data = await response.json();
  
  if (data.results.length > 0) {
    const { lat, lng } = data.results[0].geometry.location;
    return new Response(JSON.stringify({ lat, lng }));
  }
  
  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
});
```

### 4.2 Edge Function: Reverse Geocoding
```typescript
// supabase/functions/reverse-geocode/index.ts
serve(async (req) => {
  const { lat, lng } = await req.json();
  
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${Deno.env.get('GOOGLE_MAPS_API_KEY')}&language=vi`
  );
  
  const data = await response.json();
  
  // Extract address components
  const address = data.results[0];
  const formattedAddress = address.formatted_address;
  
  return new Response(JSON.stringify({ address: formattedAddress }));
});
```

### 4.3 ⭐ Tính năng mới: Radius Search
```typescript
// supabase/functions/search-nearby/index.ts
serve(async (req) => {
  const { lat, lng, radiusKm = 2 } = await req.json();
  
  const { data, error } = await supabase.rpc('search_rooms_nearby', {
    lat,
    lng,
    radius_km: radiusKm,
  });
  
  return new Response(JSON.stringify({ rooms: data }));
});
```

---

## Phase 5: Testing & Optimization (Ngày 7)

### 5.1 Test Cases
- [ ] Map hiển thị đúng markers
- [ ] InfoWindow hoạt động trên web
- [ ] Callout hoạt động trên mobile
- [ ] Autocomplete gợi ý địa chỉ VN
- [ ] Chỉ đường mở đúng app (iOS/Android)
- [ ] Fallback khi không có API key

### 5.2 Performance Optimization
```typescript
// Sử dụng MarkerClusterer cho nhiều markers
import MarkerClusterer from '@googlemaps/markerclusterer';

// Lazy load Google Maps
const GoogleMap = lazy(() => import('./GoogleRoomMap'));

// Debounce autocomplete
const debouncedSearch = debounce(handleSearch, 300);
```

### 5.3 Error Handling
```typescript
// packages/web/src/components/maps/MapErrorBoundary.tsx
export function MapErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-center">
          <p>Không thể tải bản đồ. Vui lòng thử lại sau.</p>
          <Button onClick={() => window.location.reload()}>Tải lại</Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
```

---

## 📊 Tóm tắt cải tiến

| Tính năng | Leaflet (cũ) | Google Maps (mới) |
|-----------|--------------|-------------------|
| **Satellite view** | ❌ | ✅ |
| **Street View** | ❌ | ✅ |
| **Places Autocomplete** | ❌ | ✅ |
| **In-app Directions** | ❌ | ✅ |
| **Radius Search** | ❌ | ✅ |
| **Mobile Native Maps** | ❌ | ✅ |
| **Performance** | Trung bình | Tốt |
| **Data quality (VN)** | Trung bình | Tốt nhất |

---

## 💰 Chi phí ước tính

| API | Free tier | Chi phí thực tế (10k users/tháng) |
|-----|-----------|-----------------------------------|
| Maps JavaScript API | 28,000 loads/tháng | ~$50-100 |
| Places API | 5,000 requests/tháng | ~$20-40 |
| Geocoding API | 40,000 requests/tháng | ~$10-20 |
| Directions API | 40,000 requests/tháng | ~$10-20 |
| **Tổng** | - | **~$90-180/tháng** |

---

## 🚀 Bắt đầu implementation

Muốn tôi switch sang **Code mode** để bắt đầu implement Phase 1 không?