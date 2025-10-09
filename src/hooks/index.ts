import { useDispatch, useSelector, useStore } from "react-redux";
import type { AppDispatch, AppStore, RootState } from "../store";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();

// Export custom hooks
export { useBackgroundMusic } from "./use-background-music";
export { useSkillTreePositions } from "./use-skill-tree-positions";
export { useViewportDrag } from "./use-viewport-drag";
