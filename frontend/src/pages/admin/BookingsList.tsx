import { useBookings, useEventTypes } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { List, Filter, Calendar, CheckCircle2, XCircle, ArrowRight, Inbox, SearchX } from "lucide-react";

export function BookingsList() {
  const { data: eventTypes } = useEventTypes();
  const [eventTypeId, setEventTypeId] = useState("");
  const [status, setStatus] = useState<"" | "confirmed" | "cancelled">("");

  const { data: bookings, isLoading } = useBookings(
    eventTypeId || status ? { eventTypeId: eventTypeId || undefined, status: status || undefined } : undefined
  );

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-pulse text-muted-foreground">Загрузка...</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <List className="size-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Бронирования
        </h1>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={eventTypeId} onValueChange={(v) => setEventTypeId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[220px] neumorphic-sm border-0">
              <SelectValue placeholder="Все типы событий" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы событий</SelectItem>
              {eventTypes?.map((et) => (
                <SelectItem key={et.id} value={et.id}>{et.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v === "all" ? "" : (v as "confirmed" | "cancelled"))}>
          <SelectTrigger className="w-[180px] neumorphic-sm border-0">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="confirmed">Подтверждено</SelectItem>
            <SelectItem value="cancelled">Отменено</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 neumorphic-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <Calendar className="size-5 text-primary" />
          <CardTitle>Список бронирований</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {bookings && bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Гость</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Создано</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b, index) => (
                  <TableRow 
                    key={b.id} 
                    className="table-row-hover"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-medium">{b.guestName}</TableCell>
                    <TableCell className="text-muted-foreground">{b.guestEmail}</TableCell>
                    <TableCell>
                      <span className={b.status === "confirmed" 
                        ? "inline-flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-950 px-2 py-1 rounded-full text-xs font-medium" 
                        : "inline-flex items-center gap-1 text-red-600 bg-red-50 dark:bg-red-950 px-2 py-1 rounded-full text-xs font-medium"
                      }>
                        {b.status === "confirmed" ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                        {b.status === "confirmed" ? "Подтверждено" : "Отменено"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(b.createdAt), "dd.MM.yyyy HH:mm", { locale: ru })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild className="neumorphic-sm border-0 hover:bg-primary/10 hover:text-primary">
                        <Link to={`/admin/bookings/${b.id}`} className="flex items-center gap-1">
                          Детали
                          <ArrowRight className="size-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {eventTypeId || status ? (
                <>
                  <SearchX className="size-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Нет бронирований по выбранным фильтрам</h3>
                  <p className="text-muted-foreground max-w-xs">
                    Попробуйте изменить условия фильтрации
                  </p>
                </>
              ) : (
                <>
                  <Inbox className="size-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Нет бронирований</h3>
                  <p className="text-muted-foreground max-w-xs">
                    Когда гость забронирует встречу, она появится здесь
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
