"use client";

import { ReactNode } from "react";
import Link from "next/link";

const AnchorLink: React.FC<{
  elementId: string;
  className: string;
  children: ReactNode;
}> = ({ elementId, className, children, ...props }) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    document.getElementById(elementId)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <Link
      href={`#${elementId}`}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </Link>
  );
};

export default AnchorLink;
