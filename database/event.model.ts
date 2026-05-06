import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema<IEvent> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true, trim: true },
    description: { type: String, required: true, trim: true },
    overview: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    mode: { type: String, required: true, trim: true },
    audience: { type: String, required: true, trim: true },
    agenda: { type: [String], required: true },
    organizer: { type: String, required: true, trim: true },
    tags: { type: [String], required: true },
  },
  {
    timestamps: true, // Auto-generates createdAt and updatedAt
  }
);

// Ensure slug index is unique explicitly
EventSchema.index({ slug: 1 }, { unique: true });

/** Generate URL-friendly slug from title */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Collapse multiple hyphens
}

/** Normalize date string to ISO YYYY-MM-DD */
function normalizeDate(dateInput: string): string {
  const parsed = new Date(dateInput);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date format: ${dateInput}`);
  }
  return parsed.toISOString().split('T')[0];
}

/** Normalize time to HH:mm 24-hour format */
function normalizeTime(timeInput: string): string {
  const trimmed = timeInput.trim();
  const militaryMatch = trimmed.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (militaryMatch) return trimmed;

  const parsed = new Date(`1970-01-01T${trimmed}`);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid time format: ${timeInput}`);
  }
  return parsed.toISOString().substring(11, 16);
}

/** Validate required string fields are non-empty */
function validateRequiredStrings(doc: IEvent): void {
  const stringFields: (keyof IEvent)[] = [
    'title',
    'description',
    'overview',
    'image',
    'venue',
    'location',
    'date',
    'time',
    'mode',
    'audience',
    'organizer',
  ];

  for (const field of stringFields) {
    const value = doc[field] as unknown as string;
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${String(field)} is required and cannot be empty.`);
    }
  }

  const arrayFields: (keyof IEvent)[] = ['agenda', 'tags'];
  for (const field of arrayFields) {
    const arr = doc[field] as unknown as string[];
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error(`${String(field)} is required and must contain at least one item.`);
    }
  }
}

EventSchema.pre<IEvent>('save', function () {
  validateRequiredStrings(this);

  // Regenerate slug only when title is modified
  if (this.isModified('title') || !this.slug) {
    this.slug = generateSlug(this.title);
  }

  // Normalize date and time on every save
  this.date = normalizeDate(this.date);
  this.time = normalizeTime(this.time);
});

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
