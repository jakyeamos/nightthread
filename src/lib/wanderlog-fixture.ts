import type { DemoCity, DemoDay, DemoIdea, DemoItem } from "@/lib/demo-data";

export const wanderlogSourceUrl = "https://wanderlog.com/plan/kbtkhysjlxosqhzv/trip-to-budapest-prague-and-more/shared";

export const wanderlogCities: DemoCity[] = [
  { id: "budapest", name: "Budapest", country: "Hungary", nights: 2, timeZone: "Europe/Budapest", lat: 47.4979, lon: 19.0402, image: "https://itin-dev.wanderlogstatic.com/freeImageSmall/UPhFX77MC4FC6LFe41Mf2mGA6QYja5zl", stayStatus: "needs_confirmation", lodgingName: "The Hive Party Hostel" },
  { id: "prague", name: "Prague", country: "Czechia", nights: 3, timeZone: "Europe/Prague", lat: 50.0755, lon: 14.4378, image: "https://itin-dev.wanderlogstatic.com/freeImageSmall/v42E25XvxE1zWYhKASBjKvg3SuBp97D7", stayStatus: "needed" },
  { id: "ortisei", name: "Ortisei", country: "Italy", nights: 2, timeZone: "Europe/Rome", lat: 46.5753, lon: 11.6711, image: "https://itin-dev.wanderlogstatic.com/freeImageSmall/o8UtK8LmFcXTSSd4oT9cAcNkOeM2MnuW", stayStatus: "needed" },
  { id: "lermoos", name: "Lermoos", country: "Austria", nights: 1, timeZone: "Europe/Vienna", lat: 47.4037, lon: 10.8807, image: "https://itin-dev.wanderlogstatic.com/freeImageSmall/7vDzrKuMrxkTQJb5IPivVwRXrTY12qiZ", stayStatus: "needed" },
  { id: "bern", name: "Bern", country: "Switzerland", nights: 0, timeZone: "Europe/Zurich", lat: 46.948, lon: 7.4474, image: "https://itin-dev.wanderlogstatic.com/freeImageSmall/CAE3Sx9herhOvTPzGeguTTFw7YxmsT2O" },
  { id: "kandersteg", name: "Kandersteg", country: "Switzerland", nights: 1, timeZone: "Europe/Zurich", lat: 46.4947, lon: 7.6733, image: "https://itin-dev.wanderlogstatic.com/freeImageSmall/UDFnJbb0uFr5qO6GuoNNMa1I2hwQMH08", stayStatus: "needed" },
  { id: "zermatt", name: "Zermatt", country: "Switzerland", nights: 3, timeZone: "Europe/Zurich", lat: 46.0207, lon: 7.7491, image: "https://itin-dev.wanderlogstatic.com/freeImageSmall/9QIX2Ahkja6HfvNypEHlQcpp1bokv1Mn", stayStatus: "needed" },
  { id: "rome", name: "Rome", country: "Italy", nights: 5, timeZone: "Europe/Rome", lat: 41.9028, lon: 12.4964, image: "https://itin-dev.wanderlogstatic.com/freeImageSmall/mn1PEqM9dcRXFhVWSIX5soCBqOTgZKtk", stayStatus: "needed" },
];

export const wanderlogDays: DemoDay[] = [
  { id: "wl-day-1", ordinal: 1, date: "Jun 10", cityId: "budapest", title: "Arrive, check in, eat, party" },
  { id: "wl-day-2", ordinal: 2, date: "Jun 11", cityId: "budapest", title: "Buda views and bath party" },
  { id: "wl-day-3", ordinal: 3, date: "Jun 12", cityId: "prague", title: "Train ride recovery day" },
  { id: "wl-day-4", ordinal: 4, date: "Jun 13", cityId: "prague", title: "Kutná Hora day trip" },
  { id: "wl-day-5", ordinal: 5, date: "Jun 14", cityId: "prague", title: "Bohemian Switzerland" },
  { id: "wl-day-6", ordinal: 6, date: "Jun 15", cityId: "ortisei", title: "Across the Alps to Val Gardena" },
  { id: "wl-day-7", ordinal: 7, date: "Jun 16", cityId: "ortisei", title: "Gran Cir" },
  { id: "wl-day-8", ordinal: 8, date: "Jun 17", cityId: "lermoos", title: "Long transfer to Lermoos" },
  { id: "wl-day-9", ordinal: 9, date: "Jun 18", cityId: "kandersteg", title: "Bern to Kandersteg" },
  { id: "wl-day-10", ordinal: 10, date: "Jun 19", cityId: "zermatt", title: "Via ferrata to Zermatt" },
  { id: "wl-day-11", ordinal: 11, date: "Jun 20", cityId: "zermatt", title: "Matterhorn railway day" },
  { id: "wl-day-12", ordinal: 12, date: "Jun 21", cityId: "zermatt", title: "Open mountain day" },
  { id: "wl-day-13", ordinal: 13, date: "Jun 22", cityId: "rome", title: "Transfer to Rome" },
  { id: "wl-day-14", ordinal: 14, date: "Jun 23", cityId: "rome", title: "Rome — open day" },
  { id: "wl-day-15", ordinal: 15, date: "Jun 24", cityId: "rome", title: "Rome — open day" },
  { id: "wl-day-16", ordinal: 16, date: "Jun 25", cityId: "rome", title: "Rome — open day" },
  { id: "wl-day-17", ordinal: 17, date: "Jun 26", cityId: "rome", title: "Rome — open day" },
  { id: "wl-day-18", ordinal: 18, date: "Jun 27", cityId: "rome", title: "Departure day" },
];

const activity = (id: string, dayId: string, title: string, subtitle: string, duration?: number): DemoItem => ({ id, dayId, title, subtitle, duration, durationSource: duration ? "estimate" : undefined, kind: "activity" });
const placeholder = (id: string, dayId: string, title: string, subtitle: string, duration: number, placeholderType: DemoItem["placeholderType"], durationSource: DemoItem["durationSource"] = "estimate"): DemoItem => ({ id, dayId, title, subtitle, duration, durationSource, kind: "placeholder", placeholderType });

export const wanderlogItems: DemoItem[] = [
  activity("wl-kiosk", "wl-day-1", "KIOSK Budapest", "Dinner · Budapest"),
  activity("wl-hive", "wl-day-1", "The Hive Party Hostel", "Lodging · check-in", 45),
  activity("wl-fogas", "wl-day-1", "Instant-Fogas Complex", "Nightlife · District VII", 120),
  activity("wl-szimpla", "wl-day-1", "Szimpla Kert", "Ruin bar · District VII", 120),
  activity("wl-bastion", "wl-day-2", "Fisherman's Bastion", "Castle District"),
  activity("wl-funicular", "wl-day-2", "Budapest Castle Hill Funicular", "Castle Hill", 45),
  activity("wl-chain", "wl-day-2", "Széchenyi Chain Bridge", "Danube crossing", 45),
  { ...activity("wl-cake", "wl-day-2", "Kürtőskalács", "Food stop"), health: "permanently_closed", healthCheckedAt: "2026-07-12" },
  activity("wl-beer", "wl-day-2", "Élesztő kézműves söröző", "Craft beer bar", 90),
  activity("wl-sparty", "wl-day-2", "SPARTY — Széchenyi Bath Party", "Ticketed nightlife", 180),
  placeholder("wl-budapest-prague", "wl-day-3", "Budapest → Prague", "Train or flight undecided", 453, "travel", "provider"),
  activity("wl-vinohrady", "wl-day-3", "Vinohrady", "Prague neighborhood", 120),
  placeholder("wl-recovery", "wl-day-3", "Train ride recovery", "Keep the rest of the day deliberately open", 180, "rest"),
  activity("wl-sedlec", "wl-day-4", "Sedlec Ossuary", "Kutná Hora"),
  activity("wl-barbara", "wl-day-4", "St Barbara's Church", "Kutná Hora"),
  activity("wl-peppers", "wl-day-4", "Hot Peppers", "Prague", 75),
  activity("wl-bohemian", "wl-day-5", "Bohemian Switzerland National Park", "Day trip · Czechia", 480),
  activity("wl-innsbruck", "wl-day-6", "Innsbruck", "Flight or rail gateway", 60),
  activity("wl-ortisei", "wl-day-6", "Ortisei — Val Gardena", "2 hr 28 min from Innsbruck", 148),
  activity("wl-seceda", "wl-day-6", "Seceda Ridgeline", "Dolomites hike", 240),
  activity("wl-gran-cir", "wl-day-7", "Gran Cir", "Dolomites hike", 360),
  placeholder("wl-lermoos-transfer", "wl-day-8", "Gran Cir → Lermoos", "Transit route", 420, "travel", "provider"),
  activity("wl-lermoos", "wl-day-8", "Lermoos", "Explore Lermoos", 90),
  placeholder("wl-bern-transfer", "wl-day-9", "Lermoos → Bern", "Transit choice unresolved", 448, "travel", "provider"),
  activity("wl-bern", "wl-day-9", "Bern", "Transfer stop", 60),
  activity("wl-kandersteg", "wl-day-9", "Kandersteg", "1 hr 6 min from Bern", 66),
  activity("wl-ferrata", "wl-day-10", "Via Ferrata Kandersteg–Allmenalp", "Climb · weather dependent", 300),
  activity("wl-zermatt", "wl-day-10", "Zermatt", "2 hr 27 min transit", 147),
  activity("wl-gornergrat", "wl-day-11", "Gornergrat Railway", "Mountain railway", 90),
  activity("wl-matterhorn", "wl-day-11", "Matterhorn", "Mountain viewpoint", 90),
  activity("wl-rotenboden", "wl-day-11", "Rotenboden", "Rail stop", 45),
  activity("wl-riffelsee", "wl-day-11", "Riffelsee", "Alpine lake", 90),
  activity("wl-riffelberg", "wl-day-11", "Riffelberg", "Mountain stop", 60),
  placeholder("wl-open-mountain", "wl-day-12", "Open mountain day", "Weather buffer and recovery", 360, "buffer"),
  placeholder("wl-rome-transfer", "wl-day-13", "Zermatt → Rome", "Transport still needs a decision", 480, "travel", "estimate"),
  activity("wl-rome", "wl-day-13", "Rome", "Arrival and check-in", 90),
];

export const wanderlogIdeas: DemoIdea[] = [
  { id: "wl-idea-parliament", name: "Hungarian Parliament Building", detail: "Budapest · recommended", cityId: "budapest", priority: "would_like", votes: 1, image: "https://itin-dev.wanderlogstatic.com/freeImage80/A2fRwwa4IXYLTDKWCPN9bFWqapSxjnFN", imageAttribution: { label: "Source trip", url: wanderlogSourceUrl }, scheduled: false, lat: 47.5071, lon: 19.0457 },
  { id: "wl-idea-basilica", name: "St. Stephen's Basilica", detail: "Budapest · recommended", cityId: "budapest", priority: "if_time", votes: 1, image: "https://itin-dev.wanderlogstatic.com/freeImage80/oNtRn7TrjJZWQr0grf4UqC3PRtiSqe6e", imageAttribution: { label: "Source trip", url: wanderlogSourceUrl }, scheduled: false, lat: 47.5009, lon: 19.0539 },
  { id: "wl-idea-oeschinen", name: "Oeschinen Lake", detail: "Kandersteg · recommended", cityId: "kandersteg", priority: "must_do", votes: 2, image: "https://itin-dev.wanderlogstatic.com/freeImage80/OtbqTsu2a1JE2FGGXISKFdFRzYg20A9O", imageAttribution: { label: "Source trip", url: wanderlogSourceUrl }, scheduled: false, lat: 46.4988, lon: 7.7266 },
  { id: "wl-idea-colosseum", name: "First day in Rome", detail: "Rome · still unplanned", cityId: "rome", priority: "would_like", votes: 1, image: "https://itin-dev.wanderlogstatic.com/freeImageSmall/mn1PEqM9dcRXFhVWSIX5soCBqOTgZKtk", imageAttribution: { label: "Source trip", url: wanderlogSourceUrl }, scheduled: false, lat: 41.8902, lon: 12.4922 },
];
