import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { BaseGoerli } from "@thirdweb-dev/chains";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import TokenGated from "./TokenGated.jsx";
import { WagmiConfig } from "wagmi";
import { wagmiConfig, chains } from './wagmi.js'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import './index.css'
import './polyfills.js'
import "@rainbow-me/rainbowkit/styles.css";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
        <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
    <ThirdwebProvider
      activeChain={BaseGoerli}
      clientId="e6375f666c4b9e2a910c29336018dba2"
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/secure" element={<TokenGated />} />
        </Routes>
      </BrowserRouter>
    </ThirdwebProvider>
    </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>
);
