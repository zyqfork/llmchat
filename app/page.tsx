import { Analytics } from "@vercel/analytics/react";
import { Home } from "./components/home";
import { getClientConfig } from "./config/client";

export default async function App() {
  const isExport = getClientConfig()?.buildMode === "export";
  return (
    <>
      <Home />
      {!isExport && <Analytics />}
    </>
  );
}
