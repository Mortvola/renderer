import { DrawableNodeInterface } from "../../types";

export const isDrawableNode = (r: unknown): r is DrawableNodeInterface => (
  (r as DrawableNodeInterface).drawable !== undefined
)
