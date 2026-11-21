import { useCallback, useEffect, useState } from "react";
import { pageFromHash, type PageId } from "@/lib/navigation";

export function useHashPage(): { page: PageId; setPage: (id: PageId) => void } {
  const [page, setPageState] = useState<PageId>(() =>
    typeof window === "undefined" ? "uebersicht" : pageFromHash(window.location.hash)
  );

  useEffect(() => {
    function onHash() {
      setPageState(pageFromHash(window.location.hash));
    }
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setPage = useCallback((id: PageId) => {
    const next = `#${id}`;
    if (window.location.hash !== next) {
      window.location.hash = next;
    } else {
      setPageState(id);
    }
  }, []);

  return { page, setPage };
}
