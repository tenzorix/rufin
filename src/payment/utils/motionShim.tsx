/* eslint-disable react-refresh/only-export-components */
import {
  forwardRef,
  Fragment,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export type PanInfo = {
  offset: { x: number; y: number };
  velocity: { x: number; y: number };
};

type MotionProps = Omit<HTMLAttributes<HTMLDivElement>, "onDragEnd"> & {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
  drag?: unknown;
  dragConstraints?: unknown;
  dragElastic?: unknown;
  onDragEnd?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
};

export function AnimatePresence({ children }: { children?: ReactNode }) {
  return <Fragment>{children}</Fragment>;
}

const MotionDiv = forwardRef<HTMLDivElement, MotionProps>(
  (
    {
      initial,
      animate,
      exit,
      transition,
      drag,
      dragConstraints,
      dragElastic,
      onDragEnd,
      onPointerDown,
      style,
      ...props
    },
    ref,
  ) => {
    void initial;
    void animate;
    void exit;
    void transition;
    void dragConstraints;
    void dragElastic;

    const nodeRef = useRef<HTMLDivElement | null>(null);
    const dragStateRef = useRef<{
      pointerId: number;
      startY: number;
      lastY: number;
      lastTime: number;
      offsetY: number;
      isDragging: boolean;
    } | null>(null);

    const isYDragEnabled = drag === "y";

    const setRefs = (node: HTMLDivElement | null) => {
      nodeRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const resetDragTransform = () => {
      const node = nodeRef.current;
      if (!node) {
        return;
      }

      node.style.transition = "transform 180ms ease";
      node.style.transform = "";
      window.setTimeout(() => {
        if (nodeRef.current === node) {
          node.style.transition = "";
        }
      }, 180);
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      onPointerDown?.(event);

      if (!isYDragEnabled || event.button !== 0 || event.defaultPrevented) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isHandleDrag =
        target?.closest(".popupPurchaseHandleArea, .popupWithdrawHandleArea") !==
        null;

      if (!isHandleDrag) {
        return;
      }

      dragStateRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        lastY: event.clientY,
        lastTime: performance.now(),
        offsetY: 0,
        isDragging: false,
      };

      event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
      const dragState = dragStateRef.current;
      const node = nodeRef.current;

      if (!isYDragEnabled || !dragState || !node || event.pointerId !== dragState.pointerId) {
        return;
      }

      const offsetY = Math.max(0, event.clientY - dragState.startY);

      dragState.lastY = event.clientY;
      dragState.lastTime = performance.now();
      dragState.offsetY = offsetY;

      if (offsetY > 4) {
        dragState.isDragging = true;
        event.preventDefault();
      }

      if (dragState.isDragging) {
        node.style.transition = "";
        node.style.transform = `translate3d(0, ${offsetY}px, 0)`;
      }
    };

    const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
      const dragState = dragStateRef.current;

      if (!isYDragEnabled || !dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      dragStateRef.current = null;

      const elapsedSeconds = Math.max(
        (performance.now() - dragState.lastTime) / 1000,
        0.016,
      );
      const velocityY = (event.clientY - dragState.lastY) / elapsedSeconds;
      const offsetY = Math.max(0, event.clientY - dragState.startY);

      onDragEnd?.(event.nativeEvent, {
        offset: { x: 0, y: offsetY },
        velocity: { x: 0, y: velocityY },
      });

      resetDragTransform();
    };

    const mergedStyle: CSSProperties | undefined = isYDragEnabled
      ? { ...style, touchAction: style?.touchAction ?? "pan-x" }
      : style;

    return (
      <div
        ref={setRefs}
        style={mergedStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        {...props}
      />
    );
  },
);

MotionDiv.displayName = "MotionDiv";

export const motion = {
  div: MotionDiv,
};
