import { useEventTypes, useDeleteEventType } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Calendar, Plus, Pencil, Trash2, CalendarX } from "lucide-react";

export function EventTypesList() {
  const { data: eventTypes, isLoading } = useEventTypes();
  const deleteEventType = useDeleteEventType();

  const handleDelete = async (id: string) => {
    try {
      await deleteEventType.mutateAsync(id);
      toast.success("Тип события удален");
    } catch {
      toast.error("Ошибка при удалении");
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-pulse text-muted-foreground">Загрузка...</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="size-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Типы событий
          </h1>
        </div>
        <Button asChild className="neumorphic-sm gap-2">
          <Link to="/admin/event-types/new">
            <Plus className="size-4" />
            Создать
          </Link>
        </Button>
      </div>

      <Card className="border-0 neumorphic-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <Calendar className="size-5 text-primary" />
          <CardTitle>Список</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {eventTypes && eventTypes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Название</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Длительность (мин)</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventTypes.map((et, index) => (
                  <TableRow 
                    key={et.id} 
                    className="table-row-hover"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-medium">{et.name}</TableCell>
                    <TableCell className="text-muted-foreground">{et.description || "—"}</TableCell>
                    <TableCell>{et.durationMinutes}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" asChild className="neumorphic-sm border-0 hover:bg-primary/10 hover:text-primary gap-1">
                        <Link to={`/admin/event-types/${et.id}/edit`}>
                          <Pencil className="size-3" />
                          Редактировать
                        </Link>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(et.id)} className="neumorphic-sm gap-1">
                        <Trash2 className="size-3" />
                        Удалить
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarX className="size-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Нет типов событий</h3>
              <p className="text-muted-foreground max-w-xs mb-6">
                Создайте первый тип события, чтобы гости могли записываться
              </p>
              <Button asChild className="neumorphic-sm gap-2">
                <Link to="/admin/event-types/new">
                  <Plus className="size-4" />
                  Создать тип события
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
