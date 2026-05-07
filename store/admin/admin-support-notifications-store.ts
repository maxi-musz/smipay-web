"use client";

import { create } from "zustand";

export interface AdminSupportNotification {
  id: string;
  ticketId: string;
  ticketNumber: string;
  senderName: string;
  preview: string;
  timestamp: number;
}

interface AdminSupportNotificationsState {
  notifications: AdminSupportNotification[];
  push: (n: Omit<AdminSupportNotification, "id" | "timestamp">) => void;
  dismiss: (id: string) => void;
  dismissByTicket: (ticketId: string) => void;
  clearAll: () => void;
}

export const useAdminSupportNotifications = create<AdminSupportNotificationsState>(
  (set) => ({
    notifications: [],

    push: (n) =>
      set((state) => ({
        notifications: [
          {
            ...n,
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
          },
          ...state.notifications,
        ].slice(0, 20),
      })),

    dismiss: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),

    dismissByTicket: (ticketId) =>
      set((state) => ({
        notifications: state.notifications.filter(
          (n) => n.ticketId !== ticketId
        ),
      })),

    clearAll: () => set({ notifications: [] }),
  })
);
