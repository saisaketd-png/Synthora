import { permanentRedirect } from "next/navigation";

export default function ChemicalsRootPage() {
  permanentRedirect("/products");
}
