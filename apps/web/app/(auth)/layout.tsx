type AuthLayoutProps = {
  children: React.ReactNode;
};

/** Login and other auth pages intentionally omit Header/Sidebar chrome. */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return children;
}
