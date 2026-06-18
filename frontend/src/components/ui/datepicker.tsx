import { format, addDays } from "date-fns"
import { ru } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  toDate?: Date
  fromDate?: Date
}

function formatDateLabel(date: Date): string {
  const today = new Date()
  const tomorrow = addDays(today, 1)

  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return "Сегодня"
  }

  if (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  ) {
    return "Завтра"
  }

  return format(date, "PPP", { locale: ru })
}

export function DatePicker({
  date,
  onDateChange,
  disabled,
  className,
  toDate,
  fromDate,
}: DatePickerProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const maxDate = toDate ? addDays(toDate, 1) : undefined

  const isDateDisabled = (day: Date) => {
    const d = new Date(day)
    d.setHours(0, 0, 0, 0)

    if (fromDate && d < fromDate) return true
    if (maxDate && d >= maxDate) return true
    if (disabled && disabled(day)) return true

    return false
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formatDateLabel(date) : <span>Выберите дату</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          disabled={isDateDisabled}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
