import { useEffect, useRef } from "react";

type SavedBodyStyles = {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
};

let lockDepth = 0;
let savedScrollY = 0;
let savedBodyStyles: SavedBodyStyles | null = null;

function lockBodyScroll() {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  const { body, documentElement } = document;
  if (!body) {
    return;
  }

  if (lockDepth === 0) {
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    savedBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };

    body.style.position = "fixed";
    body.style.top = `-${savedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    documentElement.classList.add("scrollLocked");
    body.classList.add("scrollLocked");
  }

  lockDepth += 1;
}

function unlockBodyScroll() {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  const { body, documentElement } = document;
  if (!body || lockDepth === 0) {
    return;
  }

  lockDepth -= 1;
  if (lockDepth > 0) {
    return;
  }

  documentElement.classList.remove("scrollLocked");
  body.classList.remove("scrollLocked");

  if (savedBodyStyles) {
    body.style.position = savedBodyStyles.position;
    body.style.top = savedBodyStyles.top;
    body.style.left = savedBodyStyles.left;
    body.style.right = savedBodyStyles.right;
    body.style.width = savedBodyStyles.width;
  } else {
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
  }

  window.scrollTo(0, savedScrollY);
  savedBodyStyles = null;
  savedScrollY = 0;
}

export function useBodyScrollLock(isLocked: boolean) {
  const isAppliedRef = useRef(false);

  useEffect(() => {
    if (!isLocked || isAppliedRef.current) {
      return;
    }

    lockBodyScroll();
    isAppliedRef.current = true;

    return () => {
      if (!isAppliedRef.current) {
        return;
      }

      unlockBodyScroll();
      isAppliedRef.current = false;
    };
  }, [isLocked]);
}
