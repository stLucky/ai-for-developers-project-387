import { useEventTypes, useUpdateEventType } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useEffect } from "react";
import { Pencil, ArrowLeft, Type, AlignLeft, Clock, Save } from "lucide-react";
import { Link } from "react-router-dom";

const schema = z.object({
  name: z.string().min(1, "Обязательное поле").max(100, "Максимум 100 символов"),
  description: z.string().max(500, "Максимум 500 символов").optional(),
  durationMinutes: z.number().min(1, "Минимум 1 минута").max(480, "Максимум 480 минут"),
});

type FormData = z.infer<typeof schema>;

export function EventTypeEdit() {
  const { id } = useParams<{ id: string }>();
  const { data: eventTypes, isLoading: isLoadingList } = useEventTypes();
  const updateEventType = useUpdateEventType();
  const navigate = useNavigate();
  const eventType = eventTypes?.find((et) => et.id === id);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (eventType) {
      reset({
        name: eventType.name,
        description: eventType.description || "",
        durationMinutes: eventType.durationMinutes,
      });
    }
  }, [eventType, reset]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    try {
      await updateEventType.mutateAsync({ id, body: data });
      toast.success("Тип события обновлен");
      navigate("/admin/event-types");
    } catch {
      toast.error("Ошибка при обновлении");
    }
  };

  if (!isLoadingList && !eventType) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Тип события не найден</div>
      </div>
    );
  }

  if (isLoadingList || !eventType) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-pulse text-muted-foreground">Загрузка...</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/admin/event-types">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="p-2 rounded-lg bg-primary/10">
          <Pencil className="size-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Редактирование типа события
        </h1>
      </div>

      <Card className="border-0 neumorphic-sm">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <Type className="size-5 text-primary" />
          <CardTitle>Информация</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Type className="size-4 text-muted-foreground" />
                Название
              </Label>
              <Input id="name" {...register("name")} className="neumorphic-inset border-0" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <AlignLeft className="size-4 text-muted-foreground" />
                Описание
              </Label>
              <Input id="description" {...register("description")} className="neumorphic-inset border-0" />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes" className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                Длительность (минуты)
              </Label>
              <Input id="durationMinutes" type="number" {...register("durationMinutes", { valueAsNumber: true })} className="neumorphic-inset border-0" />
              {errors.durationMinutes && <p className="text-sm text-destructive">{errors.durationMinutes.message}</p>}
            </div>
            <Button type="submit" className="neumorphic-sm gap-2">
              <Save className="size-4" />
              Сохранить
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
