import React from "react";
import classes from "./AuthQuoteCard.module.css";

interface AuthQuoteCardProps {
  quote: string;
  author?: string;
}

export const AuthQuoteCard: React.FC<AuthQuoteCardProps> = ({
  quote,
  author = "PRAVA ONLINE",
}) => {
  return (
    <div className={classes.quoteCard}>
      <div className={classes.quoteMark}>“</div>
      <p className={classes.quoteText}>{quote}</p>
      {author && <div className={classes.author}>— {author}</div>}
    </div>
  );
};

export default AuthQuoteCard;
