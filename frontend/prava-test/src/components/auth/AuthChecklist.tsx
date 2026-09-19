import React, { type ReactNode } from "react";
import { IconCheck } from "@tabler/icons-react";
import classes from "./AuthChecklist.module.css";

export interface ChecklistItem {
  id: string;
  text: string;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
}

interface AuthChecklistProps {
  items: ChecklistItem[];
}

export const AuthChecklist: React.FC<AuthChecklistProps> = ({ items }) => {
  return (
    <ul className={classes.checklistWrapper} style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {items.map((item) => (
        <li key={item.id} className={classes.checkItem}>
          <div
            className={classes.checkIconCircle}
            style={{
              backgroundColor: item.iconBg || "#10b981",
              color: item.iconColor || "#ffffff",
            }}
          >
            {item.icon || <IconCheck size={14} stroke={2.5} />}
          </div>
          <span className={classes.checkItemText}>{item.text}</span>
        </li>
      ))}
    </ul>
  );
};

export default AuthChecklist;
