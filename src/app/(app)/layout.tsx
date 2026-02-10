import BottomNavbar from '@/components/layout/BottomNavbar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-28 md:pb-32">
        {children}
      </main>
      <BottomNavbar />
    </div>
  );
}
