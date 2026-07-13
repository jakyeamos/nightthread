import type { IdeaPriority, PlaceholderType, ReservationStatus } from "@/domain/types";

export interface DemoCity { id: string; name: string; country: string; nights: number; lat: number; lon: number; image: string }
export interface DemoIdea { id: string; name: string; detail: string; cityId: string; priority: IdeaPriority; votes: number; image: string; imageAttribution?: { label: string; url: string }; scheduled: boolean; lat: number; lon: number }
export interface DemoItem { id: string; dayId: string; title: string; subtitle: string; start?: string; duration: number; kind: "activity" | "placeholder"; placeholderType?: PlaceholderType; reservation?: ReservationStatus; cost?: string; ideaId?: string }
export interface DemoDay { id: string; ordinal: number; date: string; cityId: string; title: string }

export const demoCities: DemoCity[] = [
  { id: "tokyo", name: "Tokyo", country: "Japan", nights: 4, lat: 35.6762, lon: 139.6503, image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=82" },
  { id: "kyoto", name: "Kyoto", country: "Japan", nights: 3, lat: 35.0116, lon: 135.7681, image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=82" },
  { id: "osaka", name: "Osaka", country: "Japan", nights: 2, lat: 34.6937, lon: 135.5023, image: "https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=1200&q=82" },
];

export const demoDays: DemoDay[] = [
  { id: "day-1", ordinal: 1, date: "Oct 12", cityId: "tokyo", title: "Arrival & Shibuya glow" },
  { id: "day-2", ordinal: 2, date: "Oct 13", cityId: "tokyo", title: "Old Tokyo, new Tokyo" },
  { id: "day-5", ordinal: 5, date: "Oct 16", cityId: "kyoto", title: "Temple paths" },
];

export const demoIdeas: DemoIdea[] = [
  { id: "idea-teamlab", name: "teamLab Borderless", detail: "Azabudai Hills · digital art", cityId: "tokyo", priority: "must_do", votes: 4, image: "https://images.unsplash.com/photo-1551913902-c92207136625?auto=format&fit=crop&w=480&q=80", scheduled: true, lat: 35.6605, lon: 139.7293 },
  { id: "idea-tsukiji", name: "Tsukiji outer market", detail: "Breakfast · street food", cityId: "tokyo", priority: "would_like", votes: 3, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=480&q=80", scheduled: false, lat: 35.6655, lon: 139.7707 },
  { id: "idea-bar", name: "Bar Benfiddich", detail: "Shinjuku · cocktails", cityId: "tokyo", priority: "if_time", votes: 2, image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=480&q=80", scheduled: false, lat: 35.692, lon: 139.697 },
  { id: "idea-nezu", name: "Nezu Museum", detail: "Aoyama · art & garden", cityId: "tokyo", priority: "would_like", votes: 2, image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=480&q=80", scheduled: false, lat: 35.662, lon: 139.717 },
];

export const demoItems: DemoItem[] = [
  { id: "item-arrive", dayId: "day-1", title: "Arrive at Haneda", subtitle: "Travel · Terminal 3", start: "10:40", duration: 90, kind: "activity", reservation: "confirmed", cost: "¥1,200" },
  { id: "item-lunch", dayId: "day-1", title: "Lunch near the hotel", subtitle: "Needs a decision", start: "13:00", duration: 75, kind: "placeholder", placeholderType: "eat" },
  { id: "item-crossing", dayId: "day-1", title: "Shibuya crossing & wander", subtitle: "Shibuya City", start: "16:30", duration: 120, kind: "activity" },
  { id: "item-buffer", dayId: "day-1", title: "Room to drift", subtitle: "Buffer", start: "18:30", duration: 45, kind: "placeholder", placeholderType: "buffer" },
  { id: "item-sensoji", dayId: "day-2", title: "Sensō-ji before the crowds", subtitle: "Asakusa", start: "08:00", duration: 105, kind: "activity" },
  { id: "item-coffee", dayId: "day-2", title: "Good coffee, somewhere close", subtitle: "Needs a decision", start: "10:15", duration: 45, kind: "placeholder", placeholderType: "coffee" },
  { id: "item-teamlab", dayId: "day-2", title: "teamLab Borderless", subtitle: "Azabudai Hills", start: "14:00", duration: 150, kind: "activity", ideaId: "idea-teamlab", reservation: "needed", cost: "¥4,000" },
];

export const demoActivity = [
  ["Maya", "moved teamLab Borderless to Day 2", "12 minutes ago"],
  ["Jon", "voted for Tsukiji outer market", "34 minutes ago"],
  ["You", "added a dinner placeholder", "Yesterday at 9:41 PM"],
  ["Priya", "joined the trip", "Yesterday at 8:16 PM"],
  ["Maya", "created Tokyo after dark", "Jul 10 at 7:02 PM"],
] as const;
