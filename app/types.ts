export interface Internship {
    id: string
    companyId: string
    title: string
    description: string
    qualifications?: string | null
    location: string
    paid: boolean
    salary?: number | null
    createdAt: string
}

export interface Application {
    id: string
    status: "PENDING" | "APPROVED" | "REJECTED"
    studentId: string
    internshipId: string
    student?: {
        id: string
        email: string
        profile?: { name: string }
    }
    internship?: {
        id: string
        title: string
        company?: { id: string; name: string }
    }
}

