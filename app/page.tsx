import Image from "next/image";
import { formatPrice, product } from "@/product.config";

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white p-4">
      <div className="relative">
        <Image
          src={product.image}
          alt={product.name}
          preload
          placeholder="blur"
          sizes="(max-width: 768px) 92vw, 720px"
          className="block h-auto max-h-[85dvh] w-auto max-w-[min(92vw,720px)]"
        />
        <form
          action="/api/checkout"
          method="POST"
          className="absolute bottom-4 left-4"
        >
          <button
            type="submit"
            className="cursor-pointer bg-black px-6 py-3 text-sm font-medium tracking-wide text-white uppercase transition-opacity hover:opacity-80 active:opacity-60"
          >
            Buy — {formatPrice(product.price, product.currency)}
          </button>
        </form>
      </div>
    </main>
  );
}
