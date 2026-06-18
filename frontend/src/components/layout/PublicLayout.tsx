import { Header } from "./Header";
import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4 animate-fade-in-up">
        <Outlet />
      </main>
    </div>
  );
}
