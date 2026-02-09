export interface Venue {
  id: string;
  name: string;
  location: string;
  isOpen: boolean;
  image: string;
}

export interface Bottle {
  id: string;
  venueId: string;
  brand: string;
  name: string;
  price: number;
  ml: number;
  image: string;
}

export interface UserBottle {
  id: string;
  bottleId: string;
  venueName: string;
  bottleName: string;
  bottleBrand: string;
  totalMl: number;
  remainingMl: number;
  image: string;
}

export const venues: Venue[] = [
  {
    id: "1",
    name: "Skybar Lounge",
    location: "Bandra West, Mumbai",
    isOpen: true,
    image: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800",
  },
  {
    id: "2",
    name: "Neon Nights",
    location: "Indiranagar, Bangalore",
    isOpen: true,
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800",
  },
  {
    id: "3",
    name: "The Purple Room",
    location: "Cyber Hub, Gurgaon",
    isOpen: false,
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800",
  },
  {
    id: "4",
    name: "Electric Dreams",
    location: "Koramangala, Bangalore",
    isOpen: true,
    image: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800",
  },
];

export const bottles: Bottle[] = [
  {
    id: "b1",
    venueId: "1",
    brand: "Jack Daniel's",
    name: "Tennessee Whiskey",
    price: 4500,
    ml: 750,
    image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400",
  },
  {
    id: "b2",
    venueId: "1",
    brand: "Johnnie Walker",
    name: "Black Label",
    price: 5200,
    ml: 750,
    image: "https://images.unsplash.com/photo-1564958334269-92932d687267?w=400",
  },
  {
    id: "b3",
    venueId: "1",
    brand: "Absolut",
    name: "Vodka",
    price: 3800,
    ml: 750,
    image: "https://images.unsplash.com/photo-1597897982993-9c590c37e9c6?w=400",
  },
  {
    id: "b4",
    venueId: "1",
    brand: "Bacardi",
    name: "White Rum",
    price: 3200,
    ml: 750,
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400",
  },
  {
    id: "b5",
    venueId: "1",
    brand: "Bombay Sapphire",
    name: "Gin",
    price: 4000,
    ml: 750,
    image: "https://images.unsplash.com/photo-1621986049284-4b34c31f0bf1?w=400",
  },
  {
    id: "b6",
    venueId: "1",
    brand: "Grey Goose",
    name: "Vodka",
    price: 8500,
    ml: 750,
    image: "https://images.unsplash.com/photo-1597897982993-9c590c37e9c6?w=400",
  },
];

export const userBottles: UserBottle[] = [
  {
    id: "ub1",
    bottleId: "b1",
    venueName: "Skybar Lounge",
    bottleName: "Tennessee Whiskey",
    bottleBrand: "Jack Daniel's",
    totalMl: 750,
    remainingMl: 540,
    image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400",
  },
  {
    id: "ub2",
    bottleId: "b3",
    venueName: "Skybar Lounge",
    bottleName: "Vodka",
    bottleBrand: "Absolut",
    totalMl: 750,
    remainingMl: 210,
    image: "https://images.unsplash.com/photo-1597897982993-9c590c37e9c6?w=400",
  },
];
