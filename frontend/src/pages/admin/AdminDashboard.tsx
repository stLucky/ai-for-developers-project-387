import { useState } from "react";
import { useOwner } from "@/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { User, Settings, Calendar, List, ArrowRight } from "lucide-react";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AdminDashboard() {
  const { data: owner, isLoading } = useOwner();
  const [avatarError, setAvatarError] = useState(false);

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-pulse text-muted-foreground">Загрузка...</div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="size-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Администрирование
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 animate-stagger">
        <Card className="card-hover border-0 neumorphic-sm">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <User className="size-5 text-blue-500" />
            </div>
            <CardTitle className="text-lg">Профиль владельца</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="relative size-4 rounded-full overflow-hidden bg-secondary flex items-center justify-center shrink-0 border">
                {owner?.avatar && !avatarError ? (
                  <img
                    src={owner.avatar}
                    alt={owner.name}
                    className="size-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="text-[8px] font-medium text-muted-foreground">
                    {getInitials(owner?.name || "")}
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Имя</div>
                <div className="font-medium">{owner?.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="size-4 text-muted-foreground">@</div>
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="font-medium">{owner?.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="size-4 text-muted-foreground">🌐</div>
              <div>
                <div className="text-xs text-muted-foreground">Часовой пояс</div>
                <div className="font-medium">{owner?.timezone}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 neumorphic-sm">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950">
              <Settings className="size-5 text-indigo-500" />
            </div>
            <CardTitle className="text-lg">Управление</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            <Link 
              to="/admin/event-types" 
              className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-primary/5 transition-colors group"
            >
              <Calendar className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="flex-1 font-medium">Типы событий</span>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition group-hover:translate-x-1" />
            </Link>
            <Link 
              to="/admin/bookings" 
              className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-primary/5 transition-colors group"
            >
              <List className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="flex-1 font-medium">Бронирования</span>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition group-hover:translate-x-1" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
