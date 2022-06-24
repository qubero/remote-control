export type RCcommand = 'mouse_up'
  | 'mouse_down'
  | 'mouse_left'
  | 'mouse_right'
  | 'mouse_position'
  | 'draw_circle'
  | 'draw_rectangle'
  | 'draw_square'
  | 'prnt_scrn';

export interface ICoords {
  x: number,
  y: number,
}

export interface ICommandFn {
  (coords: ICoords, args: Array<number>): Promise<number | string>;
}
