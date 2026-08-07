import type { Product, User } from '@prisma/client';

type ProductWithOwner = Product & {
  productOwner: Pick<User, 'id' | 'fullName' | 'email'> | null;
};

export function toProductSummary(product: ProductWithOwner) {
  const { productOwner, ...rest } = product;
  return {
    ...rest,
    productOwnerName: productOwner?.fullName ?? null,
    productOwnerEmail: productOwner?.email ?? null,
  };
}
