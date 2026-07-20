import { z } from "zod";

/** Form-friendly number field (works with zod 4 + react-hook-form). */
export const formNumber = () =>
  z.union([z.string(), z.number()]).transform((v) => (typeof v === "string" ? Number(v) : v));

export const formPositiveNumber = () => formNumber().pipe(z.number().positive());

export const formNonNegativeNumber = () => formNumber().pipe(z.number().min(0));
