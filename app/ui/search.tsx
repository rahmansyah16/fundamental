"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export default function Search({ placeholder }: { placeholder: string }) {
  // untuk mengambil query parameter pada URL
  const searchParams = useSearchParams();

  const router = useRouter();
  const pathName = usePathname();

  const handleSearch = useDebouncedCallback((term: string) => {
    console.log({ term });
    // untuk mengubah URL parameter menjadi sesuai searchParams (ini memastikan query parameter di URL tetap ada)
    const params = new URLSearchParams(searchParams);

    if (term) {
      // jika ada inputan, maka set query = term
      params.set("query", term);
      params.set("page", "1");
    } else {
      params.delete("query");
      params.delete("page");
    }
    // ubah URL melalui useRouter.replace(), menggunakan usePathName() + params.toString()
    router.replace(`${pathName}?${params.toString()}`); // params.toString() => mengambil dan mengubah parameter menjadi string
  }, 500);

  // console.log({ params: searchParams.get("query") });

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={`${searchParams.get("query") ?? ""}`}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
