import { Analytics } from "@vercel/analytics/react";
import { Home } from "./components/home";
import { getServerSideConfig } from "./config/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "./logto";

const serverConfig = getServerSideConfig();

export default async function App() {
  // Get Logto authentication context
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  return (
    <>
      <Home isAuthenticated={isAuthenticated} userClaims={claims} />
      {serverConfig?.isVercel && (
        <>
          <Analytics />
        </>
      )}
    </>
  );
}
