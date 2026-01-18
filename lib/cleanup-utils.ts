// lib/cleanup-utils.ts
import { prisma } from "@/lib/prisma"

/**
 * Result summary for the cleanup operation
 */
interface CleanupResult {
    totalFound: number
    successCount: number
    failureCount: number
    errors: Array<{ applicationId: string; error: string }>
}

/**
 * Safely deletes expired test-only applications and their related data.
 *
 * This function handles the deletion in the correct dependency order to avoid
 * foreign key constraint violations (P2003):
 * 1. First: Delete Experience records that reference Projects
 * 2. Second: Delete Project records (they cascade to Application via FK)
 * 3. Third: Delete Application records
 *
 * The function includes comprehensive error handling to ensure that if one
 * application deletion fails, the process continues with other applications.
 *
 * @returns Promise<CleanupResult> Summary of the cleanup operation
 */
export async function deleteExpiredApplications(): Promise<CleanupResult> {
    const result: CleanupResult = {
        totalFound: 0,
        successCount: 0,
        failureCount: 0,
        errors: []
    }

    try {
        // Find all expired test-only applications
        const expiredApplications = await prisma.application.findMany({
            where: {
                internship: {
                    testAssignmentDueDate: { lt: new Date() }
                }
            }
        })

        result.totalFound = expiredApplications.length

        // Delete each application with its related data in correct order
        for (const app of expiredApplications) {
            try {
                // 1. Delete Experience records that reference Projects linked to this Application
                await prisma.experience.deleteMany({
                    where: {
                        project: {
                            applicationId: app.id
                        }
                    }
                })

                // 2. Delete Project records (they have onDelete: Cascade to Application)
                await prisma.project.deleteMany({
                    where: {
                        applicationId: app.id
                    }
                })

                // 3. Delete the Application record
                await prisma.application.delete({
                    where: { id: app.id }
                })

                result.successCount++
            } catch (error) {
                result.failureCount++
                const errorMessage = error instanceof Error ? error.message : String(error)
                result.errors.push({
                    applicationId: app.id,
                    error: errorMessage
                })
                console.error(`Failed to delete application ${app.id}:`, errorMessage)
            }
        }
    } catch (error) {
        // This catch handles errors in the initial query or other unexpected issues
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Error during cleanup operation:', errorMessage)
        throw error
    }

    return result
}
