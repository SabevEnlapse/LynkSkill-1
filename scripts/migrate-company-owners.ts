/**
 * Migration Script: Migrate existing company owners to CompanyMember system
 * 
 * This script should be run after the Prisma migration to create
 * CompanyMember records for all existing company owners.
 * 
 * Run with: npx ts-node --project tsconfig.scripts.json scripts/migrate-company-owners.ts
 */

import { PrismaClient, DefaultCompanyRole, MemberStatus } from "@prisma/client"

const prisma = new PrismaClient()

async function migrateCompanyOwners() {
  console.log("🚀 Starting migration of company owners to CompanyMember system...")

  try {
    // Get all companies with their owners
    const companies = await prisma.company.findMany({
      include: {
        owner: true,
      },
    })

    console.log(`📊 Found ${companies.length} companies to migrate`)

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const company of companies) {
      try {
        // Check if owner already has a CompanyMember record
        const existingMembership = await prisma.companyMember.findFirst({
          where: {
            userId: company.ownerId,
            companyId: company.id,
          },
        })

        if (existingMembership) {
          console.log(`⏭️  Skipping ${company.name} - owner already has membership`)
          skippedCount++
          continue
        }

        // Check if owner already has a membership to another company
        const otherMembership = await prisma.companyMember.findUnique({
          where: { userId: company.ownerId },
        })

        if (otherMembership) {
          console.log(`⚠️  Warning: ${company.name} - owner has membership to another company`)
          // Still create the membership for this company but log it
        }

        // Create CompanyMember record for the owner
        await prisma.companyMember.create({
          data: {
            companyId: company.id,
            userId: company.ownerId,
            defaultRole: DefaultCompanyRole.OWNER,
            status: MemberStatus.ACTIVE,
            joinedAt: company.createdAt, // Use company creation date as join date
          },
        })

        console.log(`✅ Migrated ${company.name} (owner: ${company.owner.email})`)
        migratedCount++

      } catch (err) {
        console.error(`❌ Error migrating ${company.name}:`, err)
        errorCount++
      }
    }

    console.log("\n📈 Migration Summary:")
    console.log(`   ✅ Migrated: ${migratedCount}`)
    console.log(`   ⏭️  Skipped: ${skippedCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log("\n🎉 Migration complete!")

  } catch (error) {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateCompanyOwners()
