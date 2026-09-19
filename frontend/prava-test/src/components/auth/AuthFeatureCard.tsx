import React, { type ReactNode } from "react";
import classes from "./AuthFeatureCard.module.css";

export interface AuthFeatureCardProps {
  icon: ReactNode;
  iconBg?: string;
  iconColor?: string;
  title: string;
  description: string;
}

export const AuthFeatureCard: React.FC<AuthFeatureCardProps> = ({
  icon,
  iconBg,
  iconColor,
  title,
  description,
}) => {
  return (
    <div className={classes.featureCard}>
      <div
        className={classes.iconBox}
        style={
          iconBg || iconColor
            ? {
                backgroundColor: iconBg,
                color: iconColor,
              }
            : undefined
        }
      >
        {icon}
      </div>
      <div className={classes.contentBox}>
        <h4 className={classes.title}>{title}</h4>
        <p className={classes.description}>{description}</p>
      </div>
    </div>
  );
};

export default AuthFeatureCard;
