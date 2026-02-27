-- Add favour_id and is_opened columns to messages table
ALTER TABLE "messages" ADD COLUMN "favour_id" uuid;
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_opened" boolean DEFAULT false;
--> statement-breakpoint

-- Create gacha_nfts table for the NFT pool
CREATE TABLE "gacha_nfts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mint_address" text NOT NULL,
	"name" text NOT NULL,
	"image_url" text NOT NULL,
	"rarity" varchar(20) DEFAULT 'common' NOT NULL,
	"is_claimed" boolean DEFAULT false,
	"claimed_by_wallet" text,
	"claimed_at" timestamp,
	"message_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "gacha_nfts_mint_address_unique" ON "gacha_nfts" USING btree ("mint_address");
--> statement-breakpoint
CREATE INDEX "gacha_nfts_rarity_idx" ON "gacha_nfts" USING btree ("rarity");
--> statement-breakpoint
CREATE INDEX "gacha_nfts_is_claimed_idx" ON "gacha_nfts" USING btree ("is_claimed");
