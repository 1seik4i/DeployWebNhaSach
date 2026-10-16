-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_changed_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "booths" ADD COLUMN     "content" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "public_until" TIMESTAMPTZ(6),
ADD COLUMN     "visibility" VARCHAR(20) NOT NULL DEFAULT 'public';

-- CreateTable
CREATE TABLE "user_stall_assignments" (
    "user_id" UUID NOT NULL,
    "stall_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "user_stall_assignments_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "book_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_en" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "book_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_labels" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "book_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" UUID NOT NULL,
    "isbn" VARCHAR(32) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "title_en" TEXT,
    "author" VARCHAR(200) NOT NULL,
    "publisher" TEXT,
    "cover_url" TEXT NOT NULL,
    "description" TEXT,
    "publication_year" INTEGER,
    "category_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_label_assignments" (
    "book_id" UUID NOT NULL,
    "label_id" UUID NOT NULL,

    CONSTRAINT "book_label_assignments_pkey" PRIMARY KEY ("book_id","label_id")
);

-- CreateTable
CREATE TABLE "book_stalls" (
    "id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "stall_id" UUID NOT NULL,
    "inventory_quantity" INTEGER NOT NULL DEFAULT 0,
    "sold_quantity" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_stalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_submissions" (
    "id" UUID NOT NULL,
    "book_id" UUID,
    "stall_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submitted_by" UUID NOT NULL,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "rejection_reason" TEXT,
    "proposed_data" JSONB NOT NULL,
    "current_approved_data" JSONB,
    "book_version" INTEGER,
    "inventory_quantity" INTEGER NOT NULL DEFAULT 0,
    "sold_quantity" INTEGER,

    CONSTRAINT "book_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_sales" (
    "id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "booth_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sold_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_entries" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_suggestions" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "internal_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_visits" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "day" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_categories_name_key" ON "book_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "book_labels_name_key" ON "book_labels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "books"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "book_stalls_book_id_stall_id_key" ON "book_stalls"("book_id", "stall_id");

-- CreateIndex
CREATE INDEX "book_submissions_stall_id_status_idx" ON "book_submissions"("stall_id", "status");

-- CreateIndex
CREATE INDEX "book_sales_booth_id_sold_date_idx" ON "book_sales"("booth_id", "sold_date");

-- CreateIndex
CREATE UNIQUE INDEX "content_entries_slug_key" ON "content_entries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "site_visits_session_id_day_key" ON "site_visits"("session_id", "day");

-- AddForeignKey
ALTER TABLE "user_stall_assignments" ADD CONSTRAINT "user_stall_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_stall_assignments" ADD CONSTRAINT "user_stall_assignments_stall_id_fkey" FOREIGN KEY ("stall_id") REFERENCES "booths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "book_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_label_assignments" ADD CONSTRAINT "book_label_assignments_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_label_assignments" ADD CONSTRAINT "book_label_assignments_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "book_labels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_stalls" ADD CONSTRAINT "book_stalls_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_stalls" ADD CONSTRAINT "book_stalls_stall_id_fkey" FOREIGN KEY ("stall_id") REFERENCES "booths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_submissions" ADD CONSTRAINT "book_submissions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_submissions" ADD CONSTRAINT "book_submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_submissions" ADD CONSTRAINT "book_submissions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_submissions" ADD CONSTRAINT "book_submissions_stall_id_fkey" FOREIGN KEY ("stall_id") REFERENCES "booths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_sales" ADD CONSTRAINT "book_sales_booth_id_fkey" FOREIGN KEY ("booth_id") REFERENCES "booths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_sales" ADD CONSTRAINT "book_sales_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Additional invariants not representable in the Prisma datamodel.
ALTER TABLE books ADD CONSTRAINT books_status_check CHECK (status IN ('active','draft','archived'));
ALTER TABLE books ADD CONSTRAINT books_version_check CHECK (version > 0);
ALTER TABLE book_categories ADD CONSTRAINT book_categories_status_check CHECK (status IN ('active','archived'));
ALTER TABLE book_labels ADD CONSTRAINT book_labels_status_check CHECK (status IN ('active','archived'));
ALTER TABLE book_stalls ADD CONSTRAINT book_stalls_quantity_check CHECK (inventory_quantity >= 0 AND (sold_quantity IS NULL OR sold_quantity >= 0));
ALTER TABLE book_stalls ADD CONSTRAINT book_stalls_version_check CHECK (version > 0);
ALTER TABLE book_submissions ADD CONSTRAINT book_submissions_status_check CHECK (status IN ('PENDING','APPROVED','REJECTED'));
ALTER TABLE book_submissions ADD CONSTRAINT book_submissions_type_check CHECK (type IN ('CREATE','UPDATE'));
ALTER TABLE book_submissions ADD CONSTRAINT book_submissions_quantity_check CHECK (inventory_quantity >= 0 AND (sold_quantity IS NULL OR sold_quantity >= 0));
ALTER TABLE book_sales ADD CONSTRAINT book_sales_quantity_check CHECK (quantity >= 0);
ALTER TABLE content_entries ADD CONSTRAINT content_entries_status_check CHECK (status IN ('draft','published','hidden'));
ALTER TABLE content_entries ADD CONSTRAINT content_entries_kind_check CHECK (kind IN ('journey','organization','news','footer'));
ALTER TABLE event_suggestions ADD CONSTRAINT event_suggestions_status_check CHECK (status IN ('new','contacted','approved','rejected','closed'));
ALTER TABLE events ADD CONSTRAINT events_visibility_check CHECK (visibility IN ('public','internal'));
INSERT INTO permissions (id,code,name,module) VALUES
  (gen_random_uuid(),'library.read','Xem sách trong gian hàng','library'),
  (gen_random_uuid(),'library.submit','Gửi nội dung sách để duyệt','library'),
  (gen_random_uuid(),'library.inventory.update','Cập nhật tồn kho sách','library'),
  (gen_random_uuid(),'library.sales.update','Cập nhật số bán sách','library'),
  (gen_random_uuid(),'library.moderate','Kiểm duyệt sách','library'),
  (gen_random_uuid(),'library.taxonomy.manage','Quản lý phân loại và nhãn sách','library')
ON CONFLICT (code) DO NOTHING;
INSERT INTO role_permissions (role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (r.code='admin' AND p.code LIKE 'library.%') OR (r.code='partner' AND p.code IN ('library.read','library.submit','library.inventory.update','library.sales.update'))
ON CONFLICT DO NOTHING;
