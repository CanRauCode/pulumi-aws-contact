import * as sanitizeHtml from "sanitize-html";

export const stripHtml = (string: string): string => {
  string = string.replace("<br />", "\n"); // Turn html breaks into line breaks
  return sanitizeHtml(string, {
    allowedTags: [],
    allowedAttributes: {},
  });
};
