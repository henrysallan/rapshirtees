import Image from "next/image";
import { formatPrice, product } from "@/product.config";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

export default function Home() {
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-4 py-8 md:grid-cols-2 md:gap-16 md:px-10">
      <Image
        src={product.image}
        alt={product.name}
        preload
        placeholder="blur"
        sizes="(max-width: 768px) 92vw, 560px"
        className="mx-auto h-auto w-full max-w-[560px]"
      />

      <form
        action="/api/checkout"
        method="POST"
        className="flex w-full max-w-sm flex-col gap-5 justify-self-center md:justify-self-start"
      >
        <div>
          <h1 className="text-2xl tracking-tight">{product.name}</h1>
          <p className="mt-2 text-neutral-600">
            {formatPrice(product.price, product.currency)}
            {product.shipping.amount === 0 && " · Free shipping"}
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm text-neutral-600">Size</legend>
          <div className="flex gap-1">
            {product.sizes.map((size) => (
              <label
                key={size.label}
                className="flex h-11 min-w-14 cursor-pointer items-center justify-center border border-black px-3 text-sm transition-colors select-none hover:bg-neutral-100 has-checked:bg-black has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-black"
              >
                <input
                  type="radio"
                  name="size"
                  value={size.label}
                  required
                  className="sr-only"
                />
                {size.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className={`${focusRing} h-12 w-full cursor-pointer bg-green-700 text-sm text-white transition-colors hover:bg-green-800 active:bg-green-900`}
        >
          Buy
        </button>
      </form>
    </main>
  );
}
