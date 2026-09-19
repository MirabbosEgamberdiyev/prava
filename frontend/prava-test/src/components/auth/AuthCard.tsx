import React, { type ReactNode } from "react";
import { Link } from "react-router-dom";
import classes from "./AuthCard.module.css";

interface AuthCardProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  switchPrompt?: string;
  switchLinkText?: string;
  switchLinkHref?: string;
  children: ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  icon,
  title,
  subtitle,
  switchPrompt,
  switchLinkText,
  switchLinkHref,
  children,
}) => {
  return (
    <article className={classes.authCard}>
      {/* Top Brand Icon Squircle */}
      <div className={classes.topIconWrapper}>
        <div className={classes.topIconSquircle}>
          {icon || <img src="/logo.svg" alt="Prava Online" width={28} height={28} style={{ objectFit: "contain" }} />}
        </div>
      </div>

      {/* Title */}
      <h1 className={classes.title}>{title}</h1>

      {/* Subtitle */}
      {subtitle && <p className={classes.subtitle}>{subtitle}</p>}

      {/* Switch link row (e.g. "Akkaunt mavjud emasmi? Ro'yxatdan o'tish") */}
      {switchPrompt && switchLinkText && switchLinkHref && (
        <p className={classes.switchLinkRow}>
          <span className={classes.switchLinkPrompt}>{switchPrompt}</span>{" "}
          <Link to={switchLinkHref} className={classes.switchLinkAction}>
            {switchLinkText}
          </Link>
        </p>
      )}

      {/* Form Content */}
      {children}
    </article>
  );
};

export default AuthCard;
