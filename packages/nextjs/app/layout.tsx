import "@rainbow-me/rainbowkit/styles.css";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";
import { Roboto, Syne } from "next/font/google";
const _Roboto = Roboto({ subsets: ["latin"], weight: "400" });
const _Syne = Syne({ subsets: ["latin"], weight: "400" });

export const runtime = "edge";

export const metadata = getMetadata({
  title: "Reputation & Roles",
  description: "Onchain tracking of trust.",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body className={`${_Roboto.className} ${_Syne.className}`}>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
