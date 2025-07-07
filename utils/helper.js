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
  const regexEmoji = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu; // regex to match all Unicode emojis
  return messageText.replace(regexEmoji, (match) => {
    return `<span style="font-size:1.5em;margin:0 2px;position:relative;top:2px">${match}</span>`;
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
