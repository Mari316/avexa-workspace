"use client";

import { AppDataProvider } from "../../context/AppDataContext";

type AppProvidersProps = {
  children: React.ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return <AppDataProvider>{children}</AppDataProvider>;
}
