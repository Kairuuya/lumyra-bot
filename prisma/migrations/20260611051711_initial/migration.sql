-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('MEMBER', 'ADMIN', 'SUPERADMIN');

-- CreateTable
CREATE TABLE "baileys_auth" (
    "sessionId" TEXT NOT NULL,
    "session" TEXT,

    CONSTRAINT "baileys_auth_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "pn" TEXT,
    "lid" TEXT,
    "pushName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_metadata" (
    "id" TEXT NOT NULL,
    "addressingMode" TEXT,
    "subject" TEXT NOT NULL,
    "subjectOwner" TEXT,
    "subjectOwnerPn" TEXT,
    "subjectTime" INTEGER,
    "size" INTEGER NOT NULL DEFAULT 0,
    "creation" INTEGER,
    "owner" TEXT NOT NULL DEFAULT '',
    "ownerPn" TEXT,
    "ownerCountryCode" TEXT,
    "desc" TEXT,
    "descId" TEXT,
    "descOwner" TEXT,
    "descOwnerPn" TEXT,
    "descTime" INTEGER,
    "restrict" BOOLEAN NOT NULL DEFAULT false,
    "announce" BOOLEAN NOT NULL DEFAULT false,
    "isCommunity" BOOLEAN NOT NULL DEFAULT false,
    "isCommunityAnnounce" BOOLEAN NOT NULL DEFAULT false,
    "joinApprovalMode" BOOLEAN NOT NULL DEFAULT false,
    "memberAddMode" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "group_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_participants" (
    "groupid" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_pn_key" ON "users"("pn");

-- CreateIndex
CREATE UNIQUE INDEX "users_lid_key" ON "users"("lid");

-- CreateIndex
CREATE INDEX "users_pn_idx" ON "users"("pn");

-- CreateIndex
CREATE INDEX "users_lid_idx" ON "users"("lid");

-- CreateIndex
CREATE INDEX "group_participants_userId_idx" ON "group_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_participants_groupid_userId_key" ON "group_participants"("groupid", "userId");

-- AddForeignKey
ALTER TABLE "group_metadata" ADD CONSTRAINT "group_metadata_id_fkey" FOREIGN KEY ("id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_participants" ADD CONSTRAINT "group_participants_groupid_fkey" FOREIGN KEY ("groupid") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_participants" ADD CONSTRAINT "group_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
