import {
  pgTable,
  varchar,
  timestamp,
  integer,
  pgEnum,
  index,
  text,
  boolean,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
export const RoleEnum = pgEnum('role_enum', ['ADMIN', 'EDITOR', 'VIEWER']);
export const QueueStatusEnum = pgEnum('queue_status_enum', [
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);
export const PlatformRoleEnum = pgEnum('platform_enum', ['ADMIN', 'USER']);

export const users = pgTable('users', {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email').notNull().unique(),
  password: varchar('password').notNull(),
  platformRole: PlatformRoleEnum('platform_role').notNull().default('USER'),
  createdDate: timestamp('created_date', { mode: 'string' }).defaultNow(),
  updatedDate: timestamp('updated_date', { mode: 'string' }).defaultNow(),
});

export const documents = pgTable(
  'documents',
  {
    id: varchar('id', { length: 255 })
      .primaryKey()
      .$defaultFn(() => createId()),
    title: varchar('title', { length: 255 }).notNull(),
    mimeType: varchar('mime_type'),
    extension: varchar('extension'),
    bucket: varchar('bucket'),
    status: QueueStatusEnum('status').notNull().default('PROCESSING'),
    createdBy: varchar('created_by').references(() => users.id, {
      onDelete: 'cascade',
    }),
    updatedBy: varchar('updated_by').references(() => users.id, {
      onDelete: 'cascade',
    }),
    createdDate: timestamp('created_date', { mode: 'string' }).defaultNow(),
    updatedDate: timestamp('updated_date', { mode: 'string' }).defaultNow(),
  },
  (table) => ({
    titleIndex: index('title_idx').on(table.title), // Index on "title" field
  }),
);

export const userDocRoles = pgTable(
  'user_doc_roles',
  {
    id: varchar('id', { length: 255 })
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: varchar('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    role: RoleEnum('role').notNull(),
    docId: varchar('doc_id').references(() => documents.id, {
      onDelete: 'cascade',
    }),
    createdBy: varchar('created_by').references(() => users.id),
    updatedBy: varchar('updated_by').references(() => users.id),
    createdDate: timestamp('created_date', { mode: 'string' }).defaultNow(),
    updatedDate: timestamp('updated_date', { mode: 'string' }).defaultNow(),
  },
  // Add index for faster queries on userId
  (table) => ({
    userIdIndex: index('user_id_idx').on(table.userId),
  }),
);

export const ingestionTypeManage = pgTable('ingestion_type_manage', {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$defaultFn(() => createId()),
  status: boolean('status').default(true),
  ingestionType: varchar('ingestion_type', { length: 255 }).default(
    'ingestDoc',
  ),
  createdBy: varchar('created_by').references(() => users.id),
  updatedBy: varchar('updated_by').references(() => users.id),
  createdDate: timestamp('created_date', { mode: 'string' }).defaultNow(),
  updatedDate: timestamp('updated_date', { mode: 'string' }).defaultNow(),
});

export const ingestionRouteManage = pgTable(
  'ingestion_route_manage',
  {
    id: varchar('id', { length: 255 })
      .primaryKey()
      .$defaultFn(() => createId()),
    route: text('route').notNull(),
    status: boolean('status').default(true),
    ingestionTypeId: varchar('ingestion_type_id').references(
      () => ingestionTypeManage.id,
    ),
    clientEmail: varchar('client_email', { length: 255 }),
    createdBy: varchar('created_by').references(() => users.id),
    updatedBy: varchar('updated_by').references(() => users.id),
    createdDate: timestamp('created_date', { mode: 'string' }).defaultNow(),
    updatedDate: timestamp('updated_date', { mode: 'string' }).defaultNow(),
  },
  // Add index for faster queries on route Index
  (table) => ({
    ingestionRouteIndex: index('ingestion_route_idx').on(table.route),
  }),
);
export const ingestionTracker = pgTable(
  'ingestion_tracker',
  {
    id: varchar('id', { length: 255 })
      .primaryKey()
      .$defaultFn(() => createId()),
    ingestionRouteManageId: varchar('ingestion_route_manage_id').references(
      () => ingestionRouteManage.id,
    ),
    contentId: varchar('content_id').notNull(),
    status: QueueStatusEnum('status').notNull().default('PROCESSING'),
    createdDate: timestamp('created_date', { mode: 'string' }).defaultNow(),
    updatedDate: timestamp('updated_date', { mode: 'string' }).defaultNow(),
  },
  // Add index for faster queries on docId
  (table) => ({
    ingestionRouteManageIdIndex: index('ingestion_route_manage_id_idx').on(
      table.ingestionRouteManageId,
    ),
  }),
);

export const blackListToken = pgTable('black_list_token', {
  id: varchar('id', { length: 255 })
    .primaryKey()
    .$defaultFn(() => createId()),
  token: text('token').unique(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).defaultNow(),
});
