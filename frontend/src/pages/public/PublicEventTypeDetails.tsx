import { usePublicEventType, useSlots, useCreateBooking, usePublicOwner } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { format, addDays, startOfDay, endOfDay, startOfToday } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ru } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Clock, ArrowLeft, Circle, Loader2, User, Mail, FileText, CalendarDays, AlertCircle } from "lucide-react";

const schema = z.object({
  guestName: z.string().min(1, "Обязательное поле"),
  guestEmail: z.string().email("Некорректный email"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type Step = "slots" | "form";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PublicEventTypeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: eventType, isError: isEventTypeError } = usePublicEventType(id || "");
  const { data: owner } = usePublicOwner();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("slots");
  const [avatarError, setAvatarError] = useState(false);
  const createBooking = useCreateBooking();

  const from = format(startOfDay(selectedDate), "yyyy-MM-dd'T'00:00:00'Z'");
  const to = format(endOfDay(selectedDate), "yyyy-MM-dd'T'23:59:59'Z'");
  const { data: slots, isPending: slotsPending } = useSlots(id || "", from, to);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const isDateDisabled = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const today = startOfToday();
    const max = addDays(today, 13);
    if (d < today) return true;
    if (d > max) return true;
    return false;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedSlotId(null);
  };

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlotId(slotId);
    setStep("form");
  };

  const handleBack = () => {
    setStep("slots");
    setSelectedSlotId(null);
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedSlotId) {
      toast.error("Выберите слот");
      return;
    }
    try {
      const result = await createBooking.mutateAsync({
        slotId: selectedSlotId,
        ...data,
      });
      toast.success("Бронирование успешно!");
      navigate(`/public/bookings/${result.id}`);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        toast.error("Слот уже занят. Выберите другой.");
        setStep("slots");
        setSelectedSlotId(null);
      } else if (status === 422) {
        toast.error("Некорректный слот. Выберите другой.");
      } else {
        toast.error("Ошибка при бронировании. Попробуйте позже.");
      }
    }
  };

  const availableSlots = slots?.filter((s) => s.isAvailable) || [];

  if (isEventTypeError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in-up">
        <AlertCircle className="size-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Событие не найдено</h3>
        <p className="text-muted-foreground max-w-xs mb-6">
          Запрашиваемый тип события не существует или был удален
        </p>
        <Button variant="outline" asChild className="neumorphic-sm gap-2">
          <Link to="/public">
            <ArrowLeft className="size-4" />
            Назад к списку встреч
          </Link>
        </Button>
      </div>
    );
  }

  if (!eventType || !owner)
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );

  const selectedSlot = availableSlots.find((s) => s.id === selectedSlotId);

  return (
    <div className="flex justify-center animate-fade-in-up">
      <div className="bg-background rounded-2xl shadow-lg border overflow-hidden w-full max-w-[980px] neumorphic-sm">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr_280px] min-h-[500px]">
          {/* Left sidebar */}
          <div className="bg-muted/30 p-6 border-b md:border-b-0 md:border-r flex flex-col gap-6">
            {/* Avatar */}
            <div className="flex items-center gap-3">
              <div className="relative size-12 rounded-full overflow-hidden bg-secondary flex items-center justify-center shrink-0 border neumorphic-sm">
                {owner.avatar && !avatarError ? (
                  <img
                    src={owner.avatar}
                    alt={owner.name}
                    className="size-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    {getInitials(owner.name)}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{owner.name}</span>
                <span className="text-xs text-muted-foreground">Организатор</span>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Event info */}
            <div className="flex flex-col gap-3">
              <h1 className="text-xl font-semibold text-foreground">
                {eventType.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" />
                <span>{eventType.durationMinutes} мин</span>
              </div>
              {eventType.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {eventType.description}
                </p>
              )}
            </div>
          </div>

          {/* Center + Right content */}
          {step === "slots" ? (
            <>
              {/* Center: Calendar */}
              <div className="p-6 flex flex-col gap-4 border-b md:border-b-0 md:border-r">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="size-5 text-primary" />
                  <h3 className="font-medium">Выберите дату</h3>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={isDateDisabled}
                  autoFocus
                  showOutsideDays={true}
                  locale={ru}
                  className="mx-auto"
                  classNames={{
                    root: "w-full",
                    month: "w-full",
                    month_caption: "flex items-center justify-center h-10 text-base font-medium mb-6",
                    nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between px-2 h-10",
                    button_previous: "flex items-center justify-center h-8 w-8 rounded-md border bg-background hover:bg-muted neumorphic-sm",
                    button_next: "flex items-center justify-center h-8 w-8 rounded-md border bg-background hover:bg-muted neumorphic-sm",
                    month_grid: "w-full border-collapse",
                    weekdays: "flex gap-1 mb-2 w-full",
                    weekday: "flex-1 text-center text-xs text-muted-foreground font-normal",
                    week: "flex w-full gap-1 mb-1",
                    day: "flex items-center justify-center relative aspect-square h-full w-full p-0 text-center",
                    day_button: "w-full h-full rounded-lg font-normal text-sm",
                    selected: "rounded-lg bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    today: "rounded-lg bg-accent text-accent-foreground",
                    outside: "text-muted-foreground/40",
                    disabled: "text-muted-foreground/40",
                    hidden: "invisible",
                  }}
                  formatters={{
                    formatCaption: (month, options) => {
                      const formatted = format(month, "LLLL yyyy", { locale: options?.locale || ru });
                      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                    },
                  }}
                />
              </div>

              {/* Right: Slots */}
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium">
                    {format(selectedDate, "EEEE, d MMMM", { locale: ru }).replace(/^./, str => str.toUpperCase())}
                  </h3>
                </div>
                <div className="overflow-hidden rounded-lg">
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] scrollbar-hide">
                    {slotsPending ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
                      <Loader2 className="size-5 animate-spin" />
                      <span>Загрузка слотов...</span>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant="outline"
                        data-slot-id={slot.id}
                        className="justify-start w-full h-11 gap-2 rounded-lg border bg-background hover:bg-muted"
                        onClick={() => handleSlotSelect(slot.id)}
                      >
                        <Circle className="size-2 fill-green-500 text-green-500" />
                        <span className="text-sm font-medium">
                          {formatInTimeZone(slot.startTime, owner.timezone, "HH:mm", { locale: ru })}
                        </span>
                      </Button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Нет доступных слотов
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Form replaces center + right */
            <div className="md:col-span-2 p-6 flex flex-col gap-4 animate-slide-in-right">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="size-8 rounded-full"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <div>
                  <h2 className="text-lg font-medium text-foreground">
                    Оформление бронирования
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedSlot
                      ? `${formatInTimeZone(selectedSlot.startTime, owner.timezone, "EEEE, d MMMM", { locale: ru })} в ${formatInTimeZone(
                          selectedSlot.startTime,
                          owner.timezone,
                          "HH:mm",
                          { locale: ru }
                        )}`
                      : ""}
                  </p>
                </div>
              </div>
              <form
                noValidate
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4 max-w-md"
              >
                <div className="space-y-2">
                  <Label htmlFor="guestName" className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    Имя
                  </Label>
                  <Input id="guestName" {...register("guestName")} className="neumorphic-inset border-0" placeholder="Введите ваше имя" />
                  {errors.guestName && (
                    <p className="text-sm text-destructive">
                      {errors.guestName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestEmail" className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    {...register("guestEmail")}
                    className="neumorphic-inset border-0"
                    placeholder="email@example.com"
                  />
                  {errors.guestEmail && (
                    <p className="text-sm text-destructive">
                      {errors.guestEmail.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    Заметки
                  </Label>
                  <Input id="notes" {...register("notes")} className="neumorphic-inset border-0" placeholder="Дополнительная информация" />
                </div>
                <Button type="submit" className="w-full neumorphic-sm gap-2">
                  <CalendarDays className="size-4" />
                  Забронировать
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
