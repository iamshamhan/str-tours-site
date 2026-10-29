export type PlaceRouteChoice = {
  id: string;
  title: string;
  updated_at: string;
  connected: boolean;
  days: { id: string; title: string; day_number: number }[];
};
