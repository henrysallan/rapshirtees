import Link from "next/link";

export const metadata = { title: "Thank you — rapshirtees" };

export default function Success() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-xl">Thank you — your order is in.</h1>
      <p className="max-w-sm text-sm text-neutral-600">
        A receipt is on its way to your inbox. Your shirt is printed to order
        and usually ships within a few business days.
      </p>
      <Link href="/" className="text-sm underline underline-offset-4">
        Back to the shop
      </Link>
    </main>
  );
}
