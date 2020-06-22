import * as sanitizeHtmlLibrary from "sanitize-html";
import {Autolinker} from "autolinker";

export const sanitizeHtml = (string: string): string => {
  string = string.replace(/<3/g, "♡"); // Preserve <3, otherwise everything after will be stripped
  string = string.replace(/(\r\n|\n\r|\r|\n)/g, "<br />"); // Turn line breaks into html breaks
  string = string.replace(/\s{2,}/g, " "); // Compress multiple spaces to one
  string = Autolinker.link(string, {
    truncate: {length: 60, location: "smart"},
  });
  string = sanitizeHtmlLibrary(string, {
    allowedTags: ["br", "b", "i", "em", "strong", "a", "iframe"],
    allowedAttributes: {a: ["href"], iframe: ["src"]},
    allowedIframeHostnames: ["www.youtube.com"],
    nonTextTags: ["style", "script", "textarea", "noscript"],
    disallowedTagsMode: "escape",
  });
  string = string.trim();
  return string;
};
