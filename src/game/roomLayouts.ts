/** Painted base room per store stage (1–7) with anchor boxes in % of the image, so gear sits on the real counter. */
import s1 from '@/assets/rooms/stage-1.jpg'; import s2 from '@/assets/rooms/stage-2.jpg'; import s3 from '@/assets/rooms/stage-3.jpg';
import s4 from '@/assets/rooms/stage-4.jpg'; import s5 from '@/assets/rooms/stage-5.jpg'; import s6 from '@/assets/rooms/stage-6.jpg'; import s7 from '@/assets/rooms/stage-7.jpg';
export type Box = [x: number, y: number, w: number, h: number];
export interface RoomLayout { src: string; counterTop: number; counter: [left: number, right: number]; wall: Box; floor?: Box; seats: number }
export const ROOM_LAYOUTS: RoomLayout[] = [
  { src: s1, counterTop: 52, counter: [24, 76], wall: [12, 5, 72, 49], seats: 0 },
  { src: s2, counterTop: 58, counter: [12, 89], wall: [22, 21, 56, 37], seats: 0 },
  { src: s3, counterTop: 47, counter: [11, 91], wall: [15, 3, 73, 43], floor: [0, 72, 100, 28], seats: 3 },
  { src: s4, counterTop: 50, counter: [3, 97], wall: [9, 0, 82, 49], floor: [0, 77, 100, 23], seats: 4 },
  { src: s5, counterTop: 38, counter: [44, 96], wall: [43, 8, 51, 29], floor: [0, 62, 100, 38], seats: 6 },
  { src: s6, counterTop: 52, counter: [25, 99], wall: [34, 5, 52, 46], floor: [0, 74, 100, 26], seats: 5 },
  { src: s7, counterTop: 56, counter: [12, 85], wall: [17, 31, 66, 24], floor: [0, 72, 100, 28], seats: 6 },
];
export const roomLayout = (stage: number) => ROOM_LAYOUTS[Math.max(1, Math.min(7, stage)) - 1]!;
