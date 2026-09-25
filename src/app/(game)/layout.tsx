import { BottomNav } from "@/components/BottomNav";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main
        className="mx-auto w-full max-w-md flex-1 px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 84px)" }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
