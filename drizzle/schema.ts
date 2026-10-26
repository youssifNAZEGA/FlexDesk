import { pgTable, serial, text, integer, numeric, timestamp } from 'drizzle-orm/pg-core';

// Tables
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  capacity: integer('capacity').notNull(),
  pricePerHour: numeric('price_per_hour').notNull(),
  equipments: text('equipments').array().notNull().default([]),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => profiles.id),
  roomId: integer('room_id').references(() => rooms.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  accessCode: text('access_code'),
  status: text('status').notNull().default('pending'),
  totalPrice: numeric('total_price').notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Export types for usage
export type Profile = typeof profiles.$inferType;
export type Room = typeof rooms.$inferType;
export type Booking = typeof bookings.$inferType;