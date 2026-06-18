import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Shield, CalendarDays } from "lucide-react";

export function Header() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isPublic = location.pathname.startsWith("/public") || location.pathname === "/";

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="mr-8 flex items-center gap-2 font-semibold text-lg">
          <CalendarDays className="size-5 text-primary" />
          <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Call Booking
          </span>
        </div>
        <nav className="flex gap-1">
          <Link
            to="/public"
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              isPublic
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Home className="size-4" />
            Публичная страница
          </Link>
          <Link
            to="/admin"
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              isAdmin
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Shield className="size-4" />
            Администрирование
          </Link>
        </nav>
      </div>
    </header>
  );
}
