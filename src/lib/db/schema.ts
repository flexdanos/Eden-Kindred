import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  date,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["admin", "editor", "member"]);

export const donationTypeEnum = pgEnum("donation_type", ["one_time", "pledge"]);

export const donationStatusEnum = pgEnum("donation_status", [
  "pending",
  "succeeded",
  "failed",
  "abandoned",
  "reversed",
]);

/** Ghana mobile money networks Paystack exposes as `mobile_money` providers. */
export const momoNetworkEnum = pgEnum("momo_network", [
  "mtn",
  "vod", // Telecel (formerly Vodafone Cash) — Paystack still uses the `vod` code
  "atl", // AirtelTigo
]);

export const pledgeCadenceEnum = pgEnum("pledge_cadence", [
  "monthly",
  "quarterly",
  "annual",
]);

export const pledgeStatusEnum = pgEnum("pledge_status", [
  "active",
  "paused",
  "ended",
]);

export const pledgePeriodStatusEnum = pgEnum("pledge_period_status", [
  "pending",
  "fulfilled",
  "missed",
  "waived",
]);

export const releaseTypeEnum = pgEnum("release_type", [
  "album",
  "ep",
  "single",
  "live_session",
]);

export const teamResourceKindEnum = pgEnum("team_resource_kind", [
  "chord_chart",
  "rehearsal_audio",
  "setlist",
  "note",
]);

/**
 * `standalone` is a single title/body/image block read by slug (e.g. the
 * community page's intro) — unchanged behaviour from before this enum
 * existed. The rest are homepage sections: `kind` tells the homepage which
 * template to render, and `sortOrder` (below) tells it in what order.
 */
export const contentBlockKindEnum = pgEnum("content_block_kind", [
  "standalone",
  "hero",
  "scene",
  "pinned",
  "cta",
  "gathering_preview",
  "teaching_list",
]);

/**
 * How a gift reached us.
 *
 * `paystack` is the only automated rail — it verifies and writes itself.
 * The rest are MANUAL: Zelle is US bank-to-bank with no merchant API at all,
 * Cash App needs a Square/Stripe merchant account, and a bank transfer is a
 * bank transfer. For those, someone reads a statement and records the gift in
 * the admin. Keeping them in the same table is what stops the dashboard from
 * quietly understating income.
 */
export const paymentProviderEnum = pgEnum("payment_provider", [
  "paystack",
  "bank_transfer",
  "zelle",
  "cash_app",
  "other",
]);

// ── Profiles (mirrors auth.users, public-schema subset) ────────────────────

export const profiles = pgTable("profiles", {
  // = auth.users.id. No cross-schema FK; kept in sync by a trigger on auth.users.
  id: uuid("id").primaryKey(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  role: roleEnum("role").notNull().default("member"),
  /**
   * Gates the musicians' area. Deliberately a flag rather than another value on
   * `role`: playing in the band and having permission to edit the website are
   * unrelated facts, and folding them into one column would force a choice
   * between "musician who can't be an editor" and widening the enum every time
   * a new kind of person appears.
   */
  isTeamMember: boolean("is_team_member").notNull().default(false),
  instrument: text("instrument"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Media assets (Supabase Storage references) ──────────────────────────

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  bucket: text("bucket").notNull().default("media"),
  path: text("path").notNull(),
  altText: text("alt_text"),
  width: integer("width"),
  height: integer("height"),
  uploadedBy: uuid("uploaded_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Content blocks: admin-controlled sections on the public site ────────

export const contentBlocks = pgTable("content_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(), // 'home-hero', 'partnership-intro', ...
  kind: contentBlockKindEnum("kind").notNull().default("standalone"),
  // Where a homepage section falls relative to the others. Irrelevant for
  // `standalone` blocks, which are looked up individually by slug.
  sortOrder: integer("sort_order").notNull().default(0),
  title: text("title"),
  body: text("body"),
  // Structured, kind-specific fields (button labels/hrefs, a second panel's
  // copy, list limits, empty-state text, ...) — see
  // src/lib/content-block-kinds.ts for the shape per kind.
  data: jsonb("data").$type<Record<string, unknown>>(),
  mediaId: uuid("media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Community posts / testimonies ───────────────────────────────────────

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    body: text("body").notNull(),
    coverMediaId: uuid("cover_media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    authorId: uuid("author_id").references(() => profiles.id, { onDelete: "set null" }),
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("posts_published_idx").on(t.isPublished, t.publishedAt)],
);

// ── Events (public-facing "Programs" — table kept as `events`) ──────────

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    coverMediaId: uuid("cover_media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("events_starts_at_idx").on(t.startsAt)],
);

// ── Program gallery (photos for a program, past or upcoming) ───────────

export const programGallery = pgTable(
  "program_gallery",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    caption: text("caption"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("program_gallery_event_idx").on(t.eventId, t.sortOrder),
    uniqueIndex("program_gallery_unique_media").on(t.eventId, t.mediaId),
  ],
);

// ── Program comments (public, unauthenticated) ──────────────────────────

export const programComments = pgTable(
  "program_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("program_comments_event_idx").on(t.eventId, t.createdAt)],
);

// ── Partnership tiers ───────────────────────────────────────────────────
// Amounts are minor units (pesewas). Paystack's API speaks minor units, and
// integer arithmetic removes a whole class of rounding bugs from the totals.

export const partnershipTiers = pgTable("partnership_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  amountMinor: integer("amount_minor").notNull(),
  cadence: pledgeCadenceEnum("cadence").notNull().default("monthly"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ── Pledges ─────────────────────────────────────────────────────────────
// NOT subscriptions. Ghana mobile money has no reusable authorisation, so
// nothing can be auto-debited: every charge needs the giver to approve a fresh
// prompt on their handset. A pledge is an intent plus a reminder schedule.

export const pledges = pgTable(
  "pledges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "set null" }),
    tierId: uuid("tier_id").references(() => partnershipTiers.id, { onDelete: "set null" }),
    // Denormalised from the tier at pledge time: a later tier price change must
    // not silently rewrite what someone agreed to.
    amountMinor: integer("amount_minor").notNull(),
    cadence: pledgeCadenceEnum("cadence").notNull().default("monthly"),
    status: pledgeStatusEnum("status").notNull().default("active"),
    // Contact details for guests who pledge without an account.
    partnerName: text("partner_name"),
    partnerEmail: text("partner_email"),
    partnerPhone: text("partner_phone"),
    momoNetwork: momoNetworkEnum("momo_network"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    nextReminderAt: timestamp("next_reminder_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("pledges_reminder_idx").on(t.status, t.nextReminderAt)],
);

// ── Pledge periods ──────────────────────────────────────────────────────
// One row per due window. Makes "pledged vs received" a plain join and lets the
// reminder job stay idempotent — it can only ever act on a `pending` period.

export const pledgePeriods = pgTable(
  "pledge_periods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pledgeId: uuid("pledge_id")
      .notNull()
      .references(() => pledges.id, { onDelete: "cascade" }),
    periodStart: date("period_start").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    amountMinorExpected: integer("amount_minor_expected").notNull(),
    status: pledgePeriodStatusEnum("status").notNull().default("pending"),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("pledge_periods_unique_window").on(t.pledgeId, t.periodStart),
    index("pledge_periods_due_idx").on(t.status, t.dueAt),
  ],
);

// ── Donations ───────────────────────────────────────────────────────────

export const donations = pgTable(
  "donations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    donorProfileId: uuid("donor_profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    donorEmail: text("donor_email"),
    donorName: text("donor_name"),
    donorPhone: text("donor_phone"),

    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().default("GHS"),

    type: donationTypeEnum("type").notNull().default("one_time"),
    status: donationStatusEnum("status").notNull().default("pending"),

    provider: paymentProviderEnum("provider").notNull().default("paystack"),
    /**
     * Paystack's `reference` for automated gifts; for manual rails, whatever
     * identifies it on the statement (a transfer reference, a Zelle
     * confirmation). Unique per provider, so a replayed webhook cannot
     * double-write and an admin cannot record the same bank transfer twice.
     */
    providerReference: text("provider_reference").notNull(),
    /** Set when a person entered this gift by hand rather than a webhook. */
    recordedBy: uuid("recorded_by").references(() => profiles.id, { onDelete: "set null" }),
    note: text("note"),
    channel: text("channel"), // 'mobile_money'
    momoNetwork: momoNetworkEnum("momo_network"),

    // Settles a specific pledge window when this gift answers a reminder.
    pledgeId: uuid("pledge_id").references(() => pledges.id, { onDelete: "set null" }),
    pledgePeriodId: uuid("pledge_period_id").references(() => pledgePeriods.id, {
      onDelete: "set null",
    }),

    campaignSlug: text("campaign_slug"),
    // Opt-in to appear in the public partners feed. Never exposed directly —
    // see the `public_partners` view, which projects only name and date.
    isPublicDisplay: boolean("is_public_display").notNull().default(false),

    paidAt: timestamp("paid_at", { withTimezone: true }),
    raw: jsonb("raw").$type<Record<string, unknown>>(), // last verified provider payload
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("donations_provider_reference_unique").on(t.provider, t.providerReference),
    index("donations_status_paid_idx").on(t.status, t.paidAt),
    index("donations_public_display_idx").on(t.isPublicDisplay, t.paidAt),
  ],
);

// ── Releases ────────────────────────────────────────────────────────────
// The music the community makes. Streaming links rather than hosted audio:
// nobody needs another place to store a 40 MB master, and the platforms handle
// the players, the royalties, and the bandwidth.

export const releases = pgTable(
  "releases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    type: releaseTypeEnum("type").notNull().default("single"),
    description: text("description"),
    releasedAt: date("released_at"),
    coverMediaId: uuid("cover_media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),

    spotifyUrl: text("spotify_url"),
    appleMusicUrl: text("apple_music_url"),
    youtubeUrl: text("youtube_url"),
    bandcampUrl: text("bandcamp_url"),
    /**
     * Embed id only, never a full <iframe> from an admin field — pasted markup
     * from a text column is a stored-XSS hole. The player is built from this.
     */
    youtubeVideoId: text("youtube_video_id"),
    spotifyEmbedId: text("spotify_embed_id"),

    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("releases_published_idx").on(t.isPublished, t.releasedAt)],
);

export const releaseTracks = pgTable(
  "release_tracks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => releases.id, { onDelete: "cascade" }),
    trackNumber: integer("track_number").notNull().default(1),
    title: text("title").notNull(),
    durationSeconds: integer("duration_seconds"),
    writtenBy: text("written_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("release_tracks_order").on(t.releaseId, t.trackNumber)],
);

// ── Team resources (musicians' area, behind login) ──────────────────────

export const teamResources = pgTable(
  "team_resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    kind: teamResourceKindEnum("kind").notNull().default("note"),
    body: text("body"),
    /** Chord chart PDF, rehearsal audio, or similar, in Supabase Storage. */
    mediaId: uuid("media_id").references(() => mediaAssets.id, { onDelete: "set null" }),
    externalUrl: text("external_url"),
    /** Optionally scoped to the program it is being prepared for. */
    eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("team_resources_event_idx").on(t.eventId, t.createdAt)],
);

// ── Webhook event log ───────────────────────────────────────────────────
// Paystack retries. Recording each delivery id makes replay a no-op rather
// than a duplicated donation.

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull().default("paystack"),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("webhook_events_unique").on(t.provider, t.eventId)],
);

// ── Global site settings ────────────────────────────────────────────────

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Relations ────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
  posts: many(posts),
  donations: many(donations),
  pledges: many(pledges),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  uploader: one(profiles, { fields: [mediaAssets.uploadedBy], references: [profiles.id] }),
}));

export const contentBlocksRelations = relations(contentBlocks, ({ one }) => ({
  media: one(mediaAssets, { fields: [contentBlocks.mediaId], references: [mediaAssets.id] }),
  editor: one(profiles, { fields: [contentBlocks.updatedBy], references: [profiles.id] }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(profiles, { fields: [posts.authorId], references: [profiles.id] }),
  coverMedia: one(mediaAssets, { fields: [posts.coverMediaId], references: [mediaAssets.id] }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  coverMedia: one(mediaAssets, { fields: [events.coverMediaId], references: [mediaAssets.id] }),
  gallery: many(programGallery),
  comments: many(programComments),
}));

export const programGalleryRelations = relations(programGallery, ({ one }) => ({
  event: one(events, { fields: [programGallery.eventId], references: [events.id] }),
  media: one(mediaAssets, { fields: [programGallery.mediaId], references: [mediaAssets.id] }),
}));

export const programCommentsRelations = relations(programComments, ({ one }) => ({
  event: one(events, { fields: [programComments.eventId], references: [events.id] }),
}));

export const partnershipTiersRelations = relations(partnershipTiers, ({ many }) => ({
  pledges: many(pledges),
}));

export const pledgesRelations = relations(pledges, ({ one, many }) => ({
  profile: one(profiles, { fields: [pledges.profileId], references: [profiles.id] }),
  tier: one(partnershipTiers, {
    fields: [pledges.tierId],
    references: [partnershipTiers.id],
  }),
  periods: many(pledgePeriods),
  donations: many(donations),
}));

export const pledgePeriodsRelations = relations(pledgePeriods, ({ one }) => ({
  pledge: one(pledges, { fields: [pledgePeriods.pledgeId], references: [pledges.id] }),
}));

export const releasesRelations = relations(releases, ({ one, many }) => ({
  coverMedia: one(mediaAssets, {
    fields: [releases.coverMediaId],
    references: [mediaAssets.id],
  }),
  tracks: many(releaseTracks),
}));

export const releaseTracksRelations = relations(releaseTracks, ({ one }) => ({
  release: one(releases, { fields: [releaseTracks.releaseId], references: [releases.id] }),
}));

export const teamResourcesRelations = relations(teamResources, ({ one }) => ({
  media: one(mediaAssets, { fields: [teamResources.mediaId], references: [mediaAssets.id] }),
  event: one(events, { fields: [teamResources.eventId], references: [events.id] }),
  author: one(profiles, { fields: [teamResources.createdBy], references: [profiles.id] }),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  donor: one(profiles, { fields: [donations.donorProfileId], references: [profiles.id] }),
  pledge: one(pledges, { fields: [donations.pledgeId], references: [pledges.id] }),
  period: one(pledgePeriods, {
    fields: [donations.pledgePeriodId],
    references: [pledgePeriods.id],
  }),
}));
