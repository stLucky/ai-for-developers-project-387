import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;

/**
 * Call Booking — упрощенный сервис бронирования времени по мотивам Cal.com.
 * Владелец публикует доступные интервалы, а гость выбирает свободное время и бронирует встречу.
 * Нет авторизации, личных кабинетов и интеграций с внешними календарями.
 */
@service(#{ title: "Call Booking API" })
@server("https://api.call-booking.example.com", "Production endpoint")
@server("http://localhost:3000", "Local development endpoint")
namespace CallBooking;

// ============================================
// Доменные сущности
// ============================================

/**
 * Владелец календаря — один заранее заданный профиль.
 * Используется в админской части по умолчанию.
 */
@example(#{
  id: "00000000-0000-0000-0000-000000000001",
  name: "Анна Смирнова",
  email: "anna@example.com",
  timezone: "Europe/Moscow",
  avatar: "https://i.pravatar.cc/150?u=anna",
})
model Owner {
  @key
  @format("uuid")
  id: string;

  /** Имя владельца, отображается публично */
  @minLength(1)
  @maxLength(100)
  name: string;

  /** Email для уведомлений */
  @format("email")
  email: string;

  /** Часовой пояс для расчета слотов (например, Europe/Moscow) */
  timezone: string;

  /** URL аватара владельца */
  @minLength(1)
  avatar: string;
}

/**
 * Тип события — шаблон встречи, который создает владелец.
 * Определяет название, описание и длительность.
 */
@example(#{
  id: "00000000-0000-0000-0000-000000000002",
  ownerId: "00000000-0000-0000-0000-000000000001",
  name: "Консультация 30 мин",
  description: "Индивидуальная консультация",
  durationMinutes: 30,
})
model EventType {
  @key
  @format("uuid")
  id: string;

  /** Ссылка на владельца */
  @format("uuid")
  ownerId: string;

  /** Название типа события (например, "Консультация 30 мин") */
  @minLength(1)
  @maxLength(100)
  name: string;

  /** Описание, отображается публично */
  @maxLength(500)
  description?: string;

  /** Длительность встречи в минутах */
  @minValue(1)
  @maxValue(480)
  durationMinutes: int32;
}

/**
 * Слот — конкретный временной интервал для бронирования.
 * Генерируется на основе типа события и доступности владельца.
 */
@example(#{
  id: "00000000-0000-0000-0000-000000000010",
  eventTypeId: "00000000-0000-0000-0000-000000000002",
  startTime: utcDateTime.fromISO("2026-06-15T09:00:00Z"),
  endTime: utcDateTime.fromISO("2026-06-15T09:30:00Z"),
  isAvailable: true,
})
model Slot {
  @key
  @format("uuid")
  id: string;

  /** Ссылка на тип события */
  @format("uuid")
  eventTypeId: string;

  /** Начало слота в UTC */
  @encode("rfc3339")
  startTime: utcDateTime;

  /** Окончание слота в UTC */
  @encode("rfc3339")
  endTime: utcDateTime;

  /** Доступен ли слот для бронирования */
  isAvailable: boolean;
}

/**
 * Бронирование — запись гостя на конкретный слот.
 * Гость не создает аккаунт, указывает только контактные данные.
 */
@example(#{
  id: "00000000-0000-0000-0000-000000000004",
  slotId: "00000000-0000-0000-0000-000000000010",
  guestName: "Иван Петров",
  guestEmail: "ivan@example.com",
  notes: "Хочу обсудить проект",
  status: BookingStatus.confirmed,
  createdAt: utcDateTime.fromISO("2026-06-10T12:00:00Z"),
})
model Booking {
  @key
  @format("uuid")
  id: string;

  /** Ссылка на слот */
  @format("uuid")
  slotId: string;

  /** Имя гостя */
  @minLength(1)
  @maxLength(100)
  guestName: string;

  /** Email гостя для уведомлений */
  @format("email")
  guestEmail: string;

  /** Дополнительные заметки/вопросы */
  @maxLength(1000)
  notes?: string;

  /** Статус бронирования */
  status: BookingStatus;

  /** Время создания бронирования */
  @encode("rfc3339")
  createdAt: utcDateTime;
}

/** Статус бронирования */
enum BookingStatus {
  confirmed,
  cancelled,
}

// ============================================
// DTO для запросов и ответов
// ============================================

/** Тело запроса для создания типа события */
@example(#{
  name: "Встреча 1 час",
  description: "Командная встреча",
  durationMinutes: 60,
})
model CreateEventTypeRequest {
  name: string;
  description?: string;
  durationMinutes: int32;
}

/** Тело запроса для обновления типа события */
@example(#{
  name: "Обновленная консультация",
  description: "Индивидуальная консультация (обновлено)",
  durationMinutes: 45,
})
model UpdateEventTypeRequest {
  name?: string;
  description?: string;
  durationMinutes?: int32;
}

/** Тело запроса для создания бронирования */
@example(#{
  slotId: "00000000-0000-0000-0000-000000000012",
  guestName: "Иван Петров",
  guestEmail: "ivan@example.com",
  notes: "Хочу обсудить проект",
})
model CreateBookingRequest {
  @format("uuid")
  slotId: string;

  guestName: string;
  guestEmail: string;
  notes?: string;
}

/** Параметры запроса для фильтрации слотов */
model ListSlotsQuery {
  /** Дата начала периода (включительно) в формате ISO 8601 */
  @query
  @encode("rfc3339")
  from?: utcDateTime;

  /** Дата окончания периода (включительно) в формате ISO 8601 */
  @query
  @encode("rfc3339")
  to?: utcDateTime;
}

/** Параметры запроса для фильтрации бронирований */
model ListBookingsQuery {
  /** Фильтр по типу события */
  @query
  @format("uuid")
  eventTypeId?: string;

  /** Фильтр по статусу */
  @query
  status?: BookingStatus;
}

// ============================================
// Модели ошибок
// ============================================

@error
model NotFoundError {
  @statusCode _: 404;
  code: "NOT_FOUND";
  message: string;
}

@error
model ConflictError {
  @statusCode _: 409;
  code: "CONFLICT";
  message: string;
}

@error
model ValidationError {
  @statusCode _: 422;
  code: "VALIDATION_ERROR";
  message: string;
  details?: string[];
}

// ============================================
// Публичный сценарий гостя
// ============================================
/**
 * Гостевой сценарий:
 * 1. Гость просматривает список типов событий владельца (GET /public/event-types).
 * 2. Гость выбирает тип события и запрашивает доступные слоты (GET /public/event-types/{id}/slots).
 * 3. Гость выбирает слот и оформляет бронирование (POST /public/bookings).
 * 4. Гость получает подтверждение с деталями бронирования.
 * Гость не создает аккаунт и не проходит авторизацию.
 */

// ============================================
// Админские эндпоинты (владелец календаря)
// ============================================

@route("/admin")
@tag("Admin")
interface Admin {
  /** Получить информацию о владельце (по умолчанию единственный) */
  @opExample(#{
    returnType: #{
      id: "00000000-0000-0000-0000-000000000001",
      name: "Анна Смирнова",
      email: "anna@example.com",
      timezone: "Europe/Moscow",
      avatar: "https://i.pravatar.cc/150?u=anna",
    },
  })
  @get
  @route("/owner")
  getOwner(): Owner;

  /** Создать новый тип события */
  @opExample(#{
    parameters: #{
      body: #{
        name: "Встреча 1 час",
        description: "Командная встреча",
        durationMinutes: 60,
      },
    },
    returnType: #{
      id: "00000000-0000-0000-0000-000000000007",
      ownerId: "00000000-0000-0000-0000-000000000001",
      name: "Встреча 1 час",
      description: "Командная встреча",
      durationMinutes: 60,
    },
  })
  @post
  @route("/event-types")
  createEventType(@body body: CreateEventTypeRequest): EventType | ValidationError;

  /** Получить список всех типов событий владельца */
  @opExample(#{
    returnType: #[
      #{
        id: "00000000-0000-0000-0000-000000000002",
        ownerId: "00000000-0000-0000-0000-000000000001",
        name: "Консультация 30 мин",
        description: "Индивидуальная консультация",
        durationMinutes: 30,
      },
      #{
        id: "00000000-0000-0000-0000-000000000005",
        ownerId: "00000000-0000-0000-0000-000000000001",
        name: "Встреча 1 час",
        description: "Командная встреча",
        durationMinutes: 60,
      },
    ],
  })
  @get
  @route("/event-types")
  listEventTypes(): EventType[];

  /** Получить тип события по id */
  @opExample(#{
    parameters: #{ id: "00000000-0000-0000-0000-000000000002" },
    returnType: #{
      id: "00000000-0000-0000-0000-000000000002",
      ownerId: "00000000-0000-0000-0000-000000000001",
      name: "Консультация 30 мин",
      description: "Индивидуальная консультация",
      durationMinutes: 30,
    },
  })
  @get
  @route("/event-types/{id}")
  getEventType(@path id: string): EventType | NotFoundError;

  /** Обновить тип события */
  @opExample(#{
    parameters: #{
      id: "00000000-0000-0000-0000-000000000002",
      body: #{
        name: "Обновленная консультация",
        description: "Индивидуальная консультация (обновлено)",
        durationMinutes: 45,
      },
    },
    returnType: #{
      id: "00000000-0000-0000-0000-000000000002",
      ownerId: "00000000-0000-0000-0000-000000000001",
      name: "Обновленная консультация",
      description: "Индивидуальная консультация (обновлено)",
      durationMinutes: 45,
    },
  })
  @put
  @route("/event-types/{id}")
  updateEventType(@path id: string, @body body: UpdateEventTypeRequest): EventType | NotFoundError | ValidationError;

  /** Удалить тип события */
  @opExample(#{
    parameters: #{ id: "00000000-0000-0000-0000-000000000002" },
  })
  @delete
  @route("/event-types/{id}")
  deleteEventType(@path id: string): void | NotFoundError;

  /** Получить список всех бронирований (всех типов событий) */
  @opExample(#{
    parameters: #{
      eventTypeId: "00000000-0000-0000-0000-000000000002",
      status: BookingStatus.confirmed,
    },
    returnType: #[
      #{
        id: "00000000-0000-0000-0000-000000000004",
        slotId: "00000000-0000-0000-0000-000000000010",
        guestName: "Иван Петров",
        guestEmail: "ivan@example.com",
        notes: "Хочу обсудить проект",
        status: BookingStatus.confirmed,
        createdAt: utcDateTime.fromISO("2026-06-10T12:00:00Z"),
      },
      #{
        id: "00000000-0000-0000-0000-000000000006",
        slotId: "00000000-0000-0000-0000-000000000011",
        guestName: "Мария Козлова",
        guestEmail: "maria@example.com",
        notes: "Отменено по причине...",
        status: BookingStatus.cancelled,
        createdAt: utcDateTime.fromISO("2026-06-11T14:30:00Z"),
      },
    ],
  })
  @get
  @route("/bookings")
  listBookings(@query eventTypeId?: string, @query status?: BookingStatus): Booking[];

  /** Получить детали бронирования */
  @get
  @route("/bookings/{id}")
  getBooking(@path id: string): Booking | NotFoundError;

  /** Отменить бронирование */
  @post
  @route("/bookings/{id}/cancel")
  cancelBooking(@path id: string): Booking | NotFoundError;

  /** Восстановить бронирование */
  @post
  @route("/bookings/{id}/restore")
  restoreBooking(@path id: string): Booking | NotFoundError | ConflictError;
}

// ============================================
// Публичные эндпоинты (для гостей)
// ============================================

@route("/public")
@tag("Public")
interface Public {
  /** Получить информацию о владельце (для публичного просмотра) */
  @opExample(#{
    returnType: #{
      id: "00000000-0000-0000-0000-000000000001",
      name: "Анна Смирнова",
      email: "anna@example.com",
      timezone: "Europe/Moscow",
      avatar: "https://i.pravatar.cc/150?u=anna",
    },
  })
  @get
  @route("/owner")
  getPublicOwner(): Owner;

  /** Получить список всех типов событий (для публичного просмотра) */
  @opExample(#{
    returnType: #[
      #{
        id: "00000000-0000-0000-0000-000000000002",
        ownerId: "00000000-0000-0000-0000-000000000001",
        name: "Консультация 30 мин",
        description: "Индивидуальная консультация",
        durationMinutes: 30,
      },
      #{
        id: "00000000-0000-0000-0000-000000000005",
        ownerId: "00000000-0000-0000-0000-000000000001",
        name: "Встреча 1 час",
        description: "Командная встреча",
        durationMinutes: 60,
      },
    ],
  })
  @get
  @route("/event-types")
  listPublicEventTypes(): EventType[];

  /** Получить детали публичного типа события */
  @opExample(#{
    parameters: #{ id: "00000000-0000-0000-0000-000000000002" },
    returnType: #{
      id: "00000000-0000-0000-0000-000000000002",
      ownerId: "00000000-0000-0000-0000-000000000001",
      name: "Консультация 30 мин",
      description: "Индивидуальная консультация",
      durationMinutes: 30,
    },
  })
  @get
  @route("/event-types/{id}")
  getPublicEventType(@path id: string): EventType | NotFoundError;

  /** Получить доступные слоты для конкретного типа события */
  @opExample(#{
    parameters: #{
      id: "00000000-0000-0000-0000-000000000002",
      from: utcDateTime.fromISO("2026-06-15T00:00:00Z"),
      to: utcDateTime.fromISO("2026-06-15T23:59:59Z"),
    },
    returnType: #[
      #{ id: "00000000-0000-0000-0000-000000000010", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T09:00:00Z"), endTime: utcDateTime.fromISO("2026-06-15T09:30:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-000000000011", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T09:30:00Z"), endTime: utcDateTime.fromISO("2026-06-15T10:00:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-000000000012", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T10:00:00Z"), endTime: utcDateTime.fromISO("2026-06-15T10:30:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-000000000013", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T10:30:00Z"), endTime: utcDateTime.fromISO("2026-06-15T11:00:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-000000000014", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T11:00:00Z"), endTime: utcDateTime.fromISO("2026-06-15T11:30:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-000000000015", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T11:30:00Z"), endTime: utcDateTime.fromISO("2026-06-15T12:00:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-000000000016", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T12:00:00Z"), endTime: utcDateTime.fromISO("2026-06-15T12:30:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-000000000017", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T12:30:00Z"), endTime: utcDateTime.fromISO("2026-06-15T13:00:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-000000000018", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T13:00:00Z"), endTime: utcDateTime.fromISO("2026-06-15T13:30:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-000000000019", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T13:30:00Z"), endTime: utcDateTime.fromISO("2026-06-15T14:00:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-00000000001a", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T14:00:00Z"), endTime: utcDateTime.fromISO("2026-06-15T14:30:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-00000000001b", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T14:30:00Z"), endTime: utcDateTime.fromISO("2026-06-15T15:00:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-00000000001c", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T15:00:00Z"), endTime: utcDateTime.fromISO("2026-06-15T15:30:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-00000000001d", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T15:30:00Z"), endTime: utcDateTime.fromISO("2026-06-15T16:00:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-00000000001e", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T16:00:00Z"), endTime: utcDateTime.fromISO("2026-06-15T16:30:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-00000000001f", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T16:30:00Z"), endTime: utcDateTime.fromISO("2026-06-15T17:00:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-000000000020", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T17:00:00Z"), endTime: utcDateTime.fromISO("2026-06-15T17:30:00Z"), isAvailable: true },
      #{ id: "00000000-0000-0000-0000-000000000021", eventTypeId: "00000000-0000-0000-0000-000000000002", startTime: utcDateTime.fromISO("2026-06-15T17:30:00Z"), endTime: utcDateTime.fromISO("2026-06-15T18:00:00Z"), isAvailable: true },
    ],
  })
  @get
  @route("/event-types/{id}/slots")
  listAvailableSlots(
    @path id: string,
    @query from?: utcDateTime,
    @query to?: utcDateTime,
  ): Slot[] | NotFoundError;

  /** Создать бронирование (гостевой поток) */
  @post
  @route("/bookings")
  createPublicBooking(@body body: CreateBookingRequest): Booking | ValidationError | ConflictError;

  /** Получить детали бронирования (для гостя, например, по ссылке из email) */
  @get
  @route("/bookings/{id}")
  getPublicBooking(@path id: string): Booking | NotFoundError;

  /** Получить слот по id */
  @get
  @route("/slots/{id}")
  getSlot(@path id: string): Slot | NotFoundError;
}
