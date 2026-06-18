import { useCreateEventType } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, ArrowLeft, Type, AlignLeft, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const schema = z.object({
  name: z.string().min(1, "Обязательное поле").max(100, "Максимум 100 символов"),
  description: z.string().max(500, "Максимум 500 символов").optional(),
  durationMinutes: z.number().min(1, "Минимум 1 минута").max(480, "Максимум 480 минут"),
});

type FormData = z.infer<typeof schema>;

export function EventTypeCreate() {
  const createEventType = useCreateEventType();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createEventType.mutateAsync(data);
      toast.success("Тип события создан");
      navigate("/admin/event-types");
    } catch {
      toast.error("Ошибка при создании");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link to="/admin/event-types">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="p-2 rounded-lg bg-primary/10">
          <Plus className="size-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Новый тип события
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
              <Input id="name" {...register("name")} className="neumorphic-inset border-0" placeholder="Введите название события" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <AlignLeft className="size-4 text-muted-foreground" />
                Описание
              </Label>
              <Input id="description" {...register("description")} className="neumorphic-inset border-0" placeholder="Введите описание" />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes" className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                Длительность (минуты)
              </Label>
              <Input id="durationMinutes" type="number" {...register("durationMinutes", { valueAsNumber: true })} className="neumorphic-inset border-0" placeholder="60" />
              {errors.durationMinutes && <p className="text-sm text-destructive">{errors.durationMinutes.message}</p>}
            </div>
            <Button type="submit" className="neumorphic-sm gap-2">
              <Plus className="size-4" />
              Создать
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
