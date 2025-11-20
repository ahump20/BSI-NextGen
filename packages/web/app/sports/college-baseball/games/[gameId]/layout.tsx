// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
