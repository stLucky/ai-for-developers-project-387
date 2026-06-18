import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export function useOwner() {
  return useQuery({
    queryKey: ["owner"],
    queryFn: async () => {
      const { data, error } = await api.GET("/admin/owner");
      if (error) throw error;
      return data;
    },
  });
}

export function useEventTypes() {
  return useQuery({
    queryKey: ["eventTypes"],
    queryFn: async () => {
      const { data, error } = await api.GET("/admin/event-types");
      if (error) throw error;
      return data;
    },
  });
}

export function useEventType(id: string) {
  return useQuery({
    queryKey: ["eventType", id],
    queryFn: async () => {
      const { data, error } = await api.GET("/admin/event-types/{id}", { params: { path: { id } } });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateEventType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; description?: string; durationMinutes: number }) => {
      const { data, error } = await api.POST("/admin/event-types", { body });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventTypes"] });
    },
  });
}

export function useUpdateEventType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: { name?: string; description?: string; durationMinutes?: number } }) => {
      const { data, error } = await api.PUT("/admin/event-types/{id}", { params: { path: { id } }, body });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventTypes"] });
    },
  });
}

export function useDeleteEventType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE("/admin/event-types/{id}", { params: { path: { id } } });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventTypes"] });
    },
  });
}

export function useSlots(eventTypeId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ["slots", eventTypeId, from, to],
    queryFn: async () => {
      const { data, error } = await api.GET("/public/event-types/{id}/slots", {
        params: {
          path: { id: eventTypeId },
          query: { from, to },
        },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!eventTypeId,
  });
}

export function useBookings(filters?: { eventTypeId?: string; status?: "confirmed" | "cancelled" }) {
  return useQuery({
    queryKey: ["bookings", filters],
    queryFn: async () => {
      const { data, error } = await api.GET("/admin/bookings", {
        params: {
          query: filters,
        },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const { data, error } = await api.GET("/admin/bookings/{id}", {
        params: { path: { id } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (body: { slotId: string; guestName: string; guestEmail: string; notes?: string }) => {
      const { data, error, response } = await api.POST("/public/bookings", { body });
      if (error) {
        throw { error, status: response.status };
      }
      return data;
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error, response } = await api.POST("/admin/bookings/{id}/cancel", { params: { path: { id } } });
      if (error) {
        throw { error, status: response.status };
      }
      return data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
    },
  });
}

export function useRestoreBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error, response } = await api.POST("/admin/bookings/{id}/restore", { params: { path: { id } } });
      if (error) {
        throw { error, status: response.status };
      }
      return data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
    },
  });
}

export function usePublicOwner() {
  return useQuery({
    queryKey: ["publicOwner"],
    queryFn: async () => {
      const { data, error } = await api.GET("/public/owner");
      if (error) throw error;
      return data;
    },
  });
}

export function usePublicEventTypes() {
  return useQuery({
    queryKey: ["publicEventTypes"],
    queryFn: async () => {
      const { data, error } = await api.GET("/public/event-types");
      if (error) throw error;
      return data;
    },
  });
}

export function usePublicEventType(id: string) {
  return useQuery({
    queryKey: ["publicEventType", id],
    queryFn: async () => {
      const { data, error } = await api.GET("/public/event-types/{id}", { params: { path: { id } } });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function usePublicBooking(id: string) {
  return useQuery({
    queryKey: ["publicBooking", id],
    queryFn: async () => {
      const { data, error } = await api.GET("/public/bookings/{id}", { params: { path: { id } } });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useSlot(id: string) {
  return useQuery({
    queryKey: ["slot", id],
    queryFn: async () => {
      const { data, error } = await api.GET("/public/slots/{id}", { params: { path: { id } } });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
