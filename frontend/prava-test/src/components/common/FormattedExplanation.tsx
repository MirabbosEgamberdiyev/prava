import React from "react";
import { Text, Badge, Box } from "@mantine/core";
import { Link } from "react-router-dom";

export function FormattedExplanation({ text }: { text?: string | null }) {
  if (!text) return null;

  const lines = text.split("\n");

  const parseLine = (line: string, lineIdx: number) => {
    const isBullet = line.trim().startsWith("- ");
    const content = isBullet ? line.trim().substring(2) : line;

    const parts: React.ReactNode[] = [];
    const regex = /\[(.*?)\]\((.*?)\)|\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      if (match[1] !== undefined && match[2] !== undefined) {
        const linkText = match[1];
        const linkUrl = match[2];
        parts.push(
          <Link
            key={`link-${lineIdx}-${regex.lastIndex}`}
            to={linkUrl}
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            <Badge
              size="sm"
              variant="light"
              color="blue"
              style={{ cursor: "pointer", margin: "0 4px", textTransform: "none" }}
            >
              {linkText}
            </Badge>
          </Link>
        );
      } else if (match[3] !== undefined) {
        parts.push(
          <strong key={`bold-${lineIdx}-${regex.lastIndex}`}>
            {match[3]}
          </strong>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    if (isBullet) {
      return (
        <li key={lineIdx} style={{ marginBottom: 4, marginLeft: 16 }}>
          {parts}
        </li>
      );
    }

    return (
      <Text key={lineIdx} size="sm" style={{ minHeight: line.trim() ? undefined : 8 }}>
        {parts}
      </Text>
    );
  };

  return (
    <Box style={{ lineHeight: 1.6 }}>
      {lines.map((line, idx) => parseLine(line, idx))}
    </Box>
  );
}
