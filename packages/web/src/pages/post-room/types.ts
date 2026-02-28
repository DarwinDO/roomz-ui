export interface PostRoomFormData {
    title: string;
    description: string;
    address: string;
    district: string;
    city: string;
    pricePerMonth: string;
    depositAmount: string;
    areaSqm: string;
    bedroomCount: string;
    bathroomCount: string;
    maxOccupants: string;
    roomType: "private" | "shared" | "studio" | "entire";
    furnished: boolean;
    availableFrom: string;
    minLeaseTerm: string;
    // Amenities
    wifi: boolean;
    airConditioning: boolean;
    parking: boolean;
    washingMachine: boolean;
    refrigerator: boolean;
    heater: boolean;
    securityCamera: boolean;
    balcony: boolean;
}
