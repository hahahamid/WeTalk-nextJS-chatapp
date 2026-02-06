import moment from "moment";
export const formatDate = (date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return "now";
  }

  if (diff < 3600000) {
    return `${Math.round(diff / 60000)} min ago`;
  }

  if (diff < 86400000) {
    return moment(date).format("h:mm A");
  }

  return moment(date).format("MM/DD/YY");
};

export const wrapEmojisInHtmlTag = (messageText) => {
  // Comprehensive emoji regex that handles:
  // - Flag sequences (regional indicator pairs)
  // - Keycap sequences (digit + VS16 + combining enclosing keycap)
  // - ZWJ sequences (family, profession, etc.)
  // - Skin tone modifier sequences
  // - Basic emoji presentation sequences
  const regexEmoji =
    /\p{RI}\p{RI}|[\d#*]\uFE0F\u20E3|(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\p{Emoji_Modifier})?(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\p{Emoji_Modifier})?)*/gu;
  return messageText.replace(regexEmoji, (match) => {
    return `<span style="font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;font-size:1.5em;margin:0 2px;position:relative;top:2px">${match}</span>`;
  });
};

export function wrapAndLinkify(text) {
  // 1) wrap emojis however you already do
  const withEmojis = wrapEmojisInHtmlTag(text);

  // 2) regex to find URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  // ensure safe new‐tab links
  return withEmojis.replace(urlRegex, (url) => {
    return `<a
      href="${url}"
      target="_blank"
      rel="noopener noreferrer"
      class="text-blue-500 underline underline-offset-2"
    >${url}</a>`;
  });
}
