import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RESET Clinic — клініка естетичної медицини",
    short_name: "RESET Clinic",
    description:
      "Клініка естетичної медицини у Львові: дерматологія, косметологія, трихологія, нутриціологія та сімейна медицина.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F6EE",
    theme_color: "#29201B",
    icons: [
      {
        src: "/assets/favicon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
    lang: "uk-UA",
  };
}
