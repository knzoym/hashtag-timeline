import { TIMELINE_CONFIG } from "../constants/timelineConfig";

export const extractTagsFromDescription = (description) => {
  const tagRegex = /#([^\s#]+)/g;
  const matches = [];
  let match;
  while ((match = tagRegex.exec(description)) !== null) {
    matches.push(match[1]);
  }
  return matches;
};

export const truncateTitle = (title, maxLength = 12) => {
  return title.length > maxLength
    ? title.substring(0, maxLength) + "..."
    : title;
};

export const getYearFromX = (x, currentPixelsPerYear, panX) => {
  return -5000 + (x - panX) / currentPixelsPerYear;
};

export const getXFromYear = (year, currentPixelsPerYear, panX) => {
  return (year - (-5000)) * currentPixelsPerYear + panX;
};