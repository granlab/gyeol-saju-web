import { BottomNav } from "@/components/BottomNav";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="pb-tabbar flex flex-1 flex-col">{children}</main>
      <BottomNav />
    </>
  );
}
