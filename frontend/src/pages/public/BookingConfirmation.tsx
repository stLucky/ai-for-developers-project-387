import { usePublicBooking } from "@/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CheckCircle2, User, Mail, Calendar, FileText } from "lucide-react";

export function BookingConfirmation() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading } = usePublicBooking(id || "");

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-pulse text-muted-foreground">Загрузка...</div>
    </div>
  );
  if (!booking) return <div className="text-center py-12 text-muted-foreground">Бронирование не найдено</div>;

  return (
    <div className="space-y-8 animate-fade-in-up max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-100 dark:bg-green-950">
          <CheckCircle2 className="size-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
          Бронирование подтверждено
        </h1>
        <p className="text-muted-foreground">
          Ваше бронирование успешно создано. Мы отправили подтверждение на указанный email.
        </p>
      </div>

      <Card className="border-0 neumorphic-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <FileText className="size-5 text-primary" />
          <CardTitle>Детали бронирования</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <User className="size-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Имя</div>
              <div className="font-medium">{booking.guestName}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Mail className="size-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="font-medium">{booking.guestEmail}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <CheckCircle2 className="size-4 text-green-500" />
            <div>
              <div className="text-xs text-muted-foreground">Статус</div>
              <div className="font-medium text-green-600">
                {booking.status === "confirmed" ? "Подтверждено" : "Отменено"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="size-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Создано</div>
              <div className="font-medium">{format(new Date(booking.createdAt), "dd.MM.yyyy HH:mm", { locale: ru })}</div>
            </div>
          </div>
          {booking.notes && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="size-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-xs text-muted-foreground">Заметки</div>
                <div className="font-medium">{booking.notes}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
