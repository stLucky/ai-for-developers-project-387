import { usePublicEventTypes } from "@/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CalendarDays, Clock, ArrowRight, CalendarX } from "lucide-react";

export function PublicEventTypesList() {
  const { data: eventTypes, isLoading } = usePublicEventTypes();

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-pulse text-muted-foreground">Загрузка...</div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up">
      {eventTypes && eventTypes.length > 0 ? (
        <>
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-2">
              <CalendarDays className="size-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Доступные типы встреч
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Выберите подходящий тип встречи и забронируйте удобное время
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {eventTypes.map((et) => (
              <Link key={et.id} to={`/public/event-types/${et.id}`}>
                <Card className="card-hover border-0 neumorphic-sm h-full cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {et.name}
                      </CardTitle>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {et.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {et.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="size-4" />
                      <span>Длительность: {et.durationMinutes} мин</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-muted-foreground/10 mb-2">
            <CalendarX className="size-8 text-muted-foreground/40" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Нет доступных встреч
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Организатор пока не добавил типы событий
          </p>
        </div>
      )}
    </div>
  );
}
