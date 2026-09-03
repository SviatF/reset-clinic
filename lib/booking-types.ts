export type BookingSlot = {
  id: string;
  date: string;
  time: string;
  start: string;
  end: string;
  doctorId?: string;
  doctorName?: string;
  cabinetId?: string;
  cabinetName?: string;
  serviceId?: string;
  serviceName?: string;
};

export type BookingSelection = {
  slotId: string;
  date: string;
  time: string;
  start: string;
  end?: string;
  doctorId?: string;
  doctorName?: string;
  cabinetId?: string;
  cabinetName?: string;
  serviceId?: string;
  serviceName?: string;
  weekKey?: string;
  weekLabel?: string;
};

export type BookingAvailabilityResponse = {
  ok: boolean;
  enabled: boolean;
  timezone: string;
  generatedAt: string;
  slots: BookingSlot[];
  message?: string;
};
