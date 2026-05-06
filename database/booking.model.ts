import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import Event from './event.model';

export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema<IBooking> = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true, // Index for faster queries on eventId
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true, // Auto-generates createdAt and updatedAt
  }
);

/** Validate email format using a standard RFC-like regex */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

BookingSchema.pre<IBooking>('save', async function () {
  // Validate email format before saving
  if (!isValidEmail(this.email)) {
    throw new Error(`Invalid email format: ${this.email}`);
  }

  // Verify referenced Event exists to maintain referential integrity
  const existingEvent = await Event.findById(this.eventId);
  if (!existingEvent) {
    throw new Error(`Event with id ${this.eventId} does not exist.`);
  }
});

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
