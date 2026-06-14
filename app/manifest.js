export default function manifest() {
  return {
    name: "Chop Talk",
    short_name: "Chop Talk",
    description: "Your daily Atlanta Braves companion for game context, predictions, roster updates, and fast answers.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#071b34",
    theme_color: "#071b34",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
