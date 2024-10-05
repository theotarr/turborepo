"use client";

declare global {
  interface Window {
    dataLayer?: Object[];
  }
}

export const sendGAEvent = (...args: Object[]) => {
  if (window.dataLayer === undefined || window.gtag === undefined) {
    console.warn(`GA has not been initialized`);
    return;
  }

  if (window.dataLayer) window.gtag(...args);
  else console.warn(`GA dataLayer ${window.dataLayer} does not exist`);
};
