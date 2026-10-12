export type Unit = 'kg' | '500g' | '250g' | 'piece' | 'bunch';

export interface Product {
  id: string;
  name: string;
  image_url: string | null;
  image_path: string | null;
  price: number;
  unit: Unit;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderLine {
  id: string;
  name: string;
  qtyLabel: string;
  totalPaise: number;
}
