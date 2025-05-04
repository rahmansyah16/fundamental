"use server";
// "use server" adalah tanda bahwa isinya akn menjadi Server Action

import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" }); // menggil sql
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({ invalid_type_error: "Please select a customer" }),
  amount: z.coerce.number().gt(0, { message: "Please enter an amount greater than $0." }), // mengubah tipe data yg diterima sebelumnya string menjadi number (coerce = mengubah paksa)
  date: z.string(),
  status: z.enum(["pending", "paid"], { invalid_type_error: "Please select an invoice status" }),
});

export async function createInvoice(prevState: State, formData: FormData): Promise<State> {
  // buat Skema untuk mengecek tipe data yg masuk valid. Data

  const CreateInvoice = FormSchema.omit({ id: true, date: true }); // untuk mengecualikan data id dan date pada FormSchema

  //   masukkan data yg diterima dari form untuk di validasi
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // jika validasi gagal
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Faild to Create Invoice",
    };
  }

  // destructure data yg sudah di validasi
  const { amount, customerId, status } = validatedFields.data;

  const amountInCent = amount * 100; //ubah harga menjadi bentuk cent (keinginan dari sana, utk mencegah error data floating dijavascript )
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCent}, ${status}, ${date})
  `;
  } catch (error) {
    return {
      message: "Database Error: Failed to Create Invoice",
    };
  }
  //  query sql
  revalidatePath("/dashboard/invoices"); // untuk membersihkan data cache pada suatu path, dalam kasus ini membersihkan data pada PAGE Invoices dan melakukan REFETCHING untuk data yg dibutuhkan

  redirect("/dashboard/invoices"); // redirect, biasalahhh
}

// ...

export async function updateInvoice(id: string, prevState: State, formData: FormData): Promise<State> {
  // Use Zod to update the expected types

  const UpdateInvoice = FormSchema.omit({ id: true, date: true });

  const validatedUpdate = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedUpdate.success) {
    return {
      errors: validatedUpdate.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Edit Invoice",
    };
  }

  const { amount, customerId, status } = validatedUpdate.data;

  const amountInCents = amount * 100;
  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath("/dashboard/invoice");
}

// authenticate
export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

// google sign-in
export async function signInWithGoogle() {
  await signIn("google");
}
