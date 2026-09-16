import React from "react";
import { Link } from "react-router-dom";

interface DomainLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  className?: string;
  children: React.ReactNode;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  onTouchStart?: () => void;
  target?: string;
  rel?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
  "aria-current"?: "page" | "step" | "location" | "date" | "time" | "true" | "false" | boolean;
}

/**
 * Universal Domain-Aware Link
 * If href is external (starts with http/https), renders standard <a> tag.
 * If href is internal (relative path), renders React Router <Link> for instant SPA transition.
 */
export const DomainLink: React.FC<DomainLinkProps> = ({
  href,
  className,
  children,
  onMouseEnter,
  onFocus,
  onTouchStart,
  target,
  rel,
  style,
  "aria-label": ariaLabel,
  "aria-current": ariaCurrent,
  ...rest
}) => {
  const isExternal = href.startsWith("http://") || href.startsWith("https://");

  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        onMouseEnter={onMouseEnter}
        onFocus={onFocus}
        onTouchStart={onTouchStart}
        target={target}
        rel={rel}
        style={style}
        aria-label={ariaLabel}
        aria-current={ariaCurrent}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      to={href}
      className={className}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      onTouchStart={onTouchStart}
      style={style}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      {...rest}
    >
      {children}
    </Link>
  );
};

export default DomainLink;
