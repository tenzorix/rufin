import { API_BASE_URL } from "@/constants/env";

const API_BASE = API_BASE_URL;

export const ADDRESS_MAP_IMAGE =
  API_BASE ? `${API_BASE.replace(/\/$/, "")}/address-map-image` : "https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3A4b1da329016fbf6ac484b0250d70e1d5e45a50ceb8b1d24ea1ef988d108d4f1b&width=600&height=300&lang=ru_RU";
