import { prisma } from "@/lib/prisma";

import { BookingPrismaRepository } from "@/domains/booking/repositories/booking.prisma.repository";
import { BookingService } from "@/domains/booking/services/booking.service";

const bookingRepository = new BookingPrismaRepository();

export const bookingService =
  new BookingService(bookingRepository);

export { prisma };