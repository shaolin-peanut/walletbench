"use client";

import { useEffect } from "react";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const header = document.querySelector("header");
    if (header) {
      header.style.display = "none";
    }
    return () => {
      if (header) {
        header.style.display = "";
      }
    };
  }, []);

  return <>{children}</>;
}
