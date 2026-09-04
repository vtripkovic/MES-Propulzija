export type Product = {
  id: string;
  code: string;
  name: string;
  revision: string;
};

export type BomNode = {
  id: string;
  quantity: number;
  child: Product;
  children: BomNode[];
};

export type AvailableProduct = Product & {
  allowed: boolean;
  reason: "self" | "already-exists" | "cycle" | null;
};

export type BomResponse = {
  product: Product;
  items: BomNode[];
  availableProducts: AvailableProduct[];
};

export type RoutingOperation = {
  id: string;
  sequence: number;
  name: string;
  type: string;
  setupTime: number | null;
  cycleTime: number | null;
};

export type Machine = {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  department: {
    id: string;
    code: string;
    name: string;
  };
};
