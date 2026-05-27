import { ClientAnalytics } from "./components/client-analytics";
import { Home } from "./components/home";

export default async function App() {
  return (
    <>
      <Home />
      <ClientAnalytics />
    </>
  );
}
