import {
    Gamepad2,
    Dumbbell,
    BookOpen,
    Music,
    Camera,
    Plane,
    Coffee,
    Film,
    Palette,
    Code,
    Users,
    Briefcase,
    GraduationCap,
    Laptop,
} from 'lucide-react';

export const HOBBY_OPTIONS = [
    { value: 'gaming', label: 'Gaming', icon: Gamepad2 },
    { value: 'gym', label: 'Gym', icon: Dumbbell },
    { value: 'reading', label: 'Đọc sách', icon: BookOpen },
    { value: 'music', label: 'Âm nhạc', icon: Music },
    { value: 'photography', label: 'Chụp ảnh', icon: Camera },
    { value: 'travel', label: 'Du lịch', icon: Plane },
    { value: 'coffee', label: 'Cà phê', icon: Coffee },
    { value: 'movies', label: 'Xem phim', icon: Film },
    { value: 'art', label: 'Nghệ thuật', icon: Palette },
    { value: 'coding', label: 'Lập trình', icon: Code },
    // Adding more options to match EditRoommateProfile
    { value: 'cooking', label: 'Nấu ăn', icon: Coffee }, // Using generic icon if specific not available
    { value: 'hiking', label: 'Leo núi', icon: Dumbbell },
    { value: 'yoga', label: 'Yoga', icon: Users },
    { value: 'sports', label: 'Thể thao', icon: Dumbbell },
    { value: 'languages', label: 'Học ngoại ngữ', icon: BookOpen },
    { value: 'gardening', label: 'Làm vườn', icon: Coffee },
];

export const GENDER_OPTIONS = [
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
    { value: 'other', label: 'Khác' },
];

export const PREFERRED_GENDER_OPTIONS = [
    { value: 'any', label: 'Không phân biệt' },
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
];

export const OCCUPATION_OPTIONS = [
    { value: 'student', label: 'Sinh viên' },
    { value: 'worker', label: 'Đi làm' },
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'other', label: 'Khác' },
];
