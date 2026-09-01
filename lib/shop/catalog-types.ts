export type ShopProduct = {
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  categories: string[];
  image: string;
  details: string;
  ingredients: string;
  usage: string;
  attributes: Record<string, string>;
};

export type ShopCategory = {
  name: string;
  description: string;
};
