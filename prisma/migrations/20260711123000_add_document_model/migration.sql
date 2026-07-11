-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('SYLLABUS', 'NOTE', 'QUESTION_PAPER');

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "type" "DocumentType" NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "publicId" VARCHAR(255) NOT NULL,
    "year" INTEGER,
    "subjectId" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_subjectId_idx" ON "Document"("subjectId");

-- CreateIndex
CREATE INDEX "Document_uploadedById_idx" ON "Document"("uploadedById");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
