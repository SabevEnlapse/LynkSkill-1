"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {useUser} from "@clerk/nextjs";

interface Education {
  school: string
  degree: string
  startYear: number
  endYear?: number
}

interface Project {
  title: string
  description: string
  link?: string
  techStack?: string[]
}

interface Certification {
  name: string
  authority: string
  issuedAt: string
  expiresAt?: string
}

interface PortfolioData {
  fullName?: string
  headline?: string
  age?: number
  bio?: string
  skills: string[]
  interests: string[]
  experience?: string
  education: Education[]
  projects: Project[]
  certifications: Certification[]
  linkedin?: string
  github?: string
  portfolioUrl?: string
  needsApproval: boolean
  approvedBy?: string
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED"
}


export function Portfolio({ userType }: { userType: "Student" | "Company" }) {
  const { user } = useUser() // ✅ Clerk user
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPortfolio() {
      const res = await fetch("/api/portfolio")
      if (res.ok) {
        const data = await res.json()
        setPortfolio({
          ...data,
          skills: data.skills ?? [],
          interests: data.interests ?? [],
          education: data.education ?? [],
          projects: data.projects ?? [],
          certifications: data.certifications ?? [],
        })
      }
      setLoading(false)
    }
    fetchPortfolio()
  }, [])

  async function handleSave() {
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(portfolio),
    })
    if (res.ok) {
      setIsEditing(false)
    }
  }

  if (loading) return <p>Loading...</p>

  // ✅ Default name from Clerk if portfolio.fullName is missing
  const displayName =
      portfolio?.fullName ||
      user?.fullName ||
      user?.username ||
      user?.primaryEmailAddress?.emailAddress ||
      "Unnamed Student"

  return (
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">{displayName}</h2>
            <p className="text-muted-foreground">{portfolio?.headline || "No headline yet"}</p>
            {portfolio?.needsApproval && (
                <Badge
                    variant={
                      portfolio.approvalStatus === "APPROVED"
                          ? "default"
                          : portfolio.approvalStatus === "PENDING"
                              ? "secondary"
                              : "destructive"
                    }
                    className="mt-2"
                >
                  {portfolio.approvalStatus}
                </Badge>
            )}
          </div>
          {userType === "Student" && (
              <Button
                  onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                  className="rounded-2xl"
              >
                {isEditing ? "Save" : "Edit"}
              </Button>
          )}
        </div>

        {/* Bio */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle>About Me</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
                <Textarea
                    placeholder="Write a short bio..."
                    value={portfolio?.bio || ""}
                    onChange={(e) => setPortfolio((prev) => ({ ...prev!, bio: e.target.value }))}
                />
            ) : (
                <p>{portfolio?.bio || "No bio added yet."}</p>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
                <Input
                    placeholder="Enter skills separated by commas"
                    value={portfolio?.skills.join(", ") || ""}
                    onChange={(e) =>
                        setPortfolio((prev) => ({
                          ...prev!,
                          skills: e.target.value.split(",").map((s) => s.trim()),
                        }))
                    }
                />
            ) : (
                <div className="flex flex-wrap gap-2">
                  {portfolio?.skills?.length ? (
                      portfolio.skills.map((skill, i) => (
                          <span
                              key={i}
                              className="px-3 py-1 rounded-xl bg-primary/10 text-primary"
                          >
                    {skill}
                  </span>
                      ))
                  ) : (
                      <p className="text-muted-foreground">No skills yet.</p>
                  )}
                </div>
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle>Education</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
                <div className="space-y-3">
                  {(portfolio?.education || []).map((edu, i) => (
                      <div key={i} className="space-y-2 border p-3 rounded-xl">
                        <Input
                            placeholder="School"
                            value={edu.school || ""}
                            onChange={(e) =>
                                setPortfolio((prev) => {
                                  const copy = [...(prev?.education || [])]
                                  copy[i].school = e.target.value
                                  return { ...prev!, education: copy }
                                })
                            }
                        />
                        <Input
                            placeholder="Degree"
                            value={edu.degree || ""}
                            onChange={(e) =>
                                setPortfolio((prev) => {
                                  const copy = [...(prev?.education || [])]
                                  copy[i].degree = e.target.value
                                  return { ...prev!, education: copy }
                                })
                            }
                        />
                        <div className="flex gap-2">
                          <Input
                              placeholder="Start Year"
                              type="number"
                              value={edu.startYear || ""}
                              onChange={(e) =>
                                  setPortfolio((prev) => {
                                    const copy = [...(prev?.education || [])]
                                    copy[i].startYear = Number(e.target.value)
                                    return { ...prev!, education: copy }
                                  })
                              }
                          />
                          <Input
                              placeholder="End Year"
                              type="number"
                              value={edu.endYear || ""}
                              onChange={(e) =>
                                  setPortfolio((prev) => {
                                    const copy = [...(prev?.education || [])]
                                    copy[i].endYear = Number(e.target.value)
                                    return { ...prev!, education: copy }
                                  })
                              }
                          />
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                                setPortfolio((prev) => ({
                                  ...prev!,
                                  education: (prev?.education || []).filter((_, idx) => idx !== i),
                                }))
                            }
                        >
                          Remove
                        </Button>
                      </div>
                  ))}
                  <Button
                      onClick={() =>
                          setPortfolio((prev) => ({
                            ...prev!,
                            education: [...(prev?.education || []), { school: "", degree: "", startYear: 0, endYear: 0 }],
                          }))
                      }
                  >
                    + Add Education
                  </Button>
                </div>
            ) : portfolio?.education?.length ? (
                portfolio.education.map((edu, i) => (
                    <div key={i} className="mb-3">
                      <p className="font-medium">{edu.degree}</p>
                      <p className="text-sm text-muted-foreground">
                        {edu.school} ({edu.startYear} - {edu.endYear || "Present"})
                      </p>
                    </div>
                ))
            ) : (
                <p className="text-muted-foreground">No education added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
                <div className="space-y-3">
                  {(portfolio?.projects || []).map((proj, i) => (
                      <div key={i} className="space-y-2 border p-3 rounded-xl">
                        <Input
                            placeholder="Title"
                            value={proj.title || ""}
                            onChange={(e) => {
                              const copy = [...(portfolio?.projects || [])]
                              copy[i].title = e.target.value
                              setPortfolio((prev) => ({ ...prev!, projects: copy }))
                            }}
                        />
                        <Textarea
                            placeholder="Description"
                            value={proj.description || ""}
                            onChange={(e) => {
                              const copy = [...(portfolio?.projects || [])]
                              copy[i].description = e.target.value
                              setPortfolio((prev) => ({ ...prev!, projects: copy }))
                            }}
                        />
                        <Input
                            placeholder="Link"
                            value={proj.link || ""}
                            onChange={(e) => {
                              const copy = [...(portfolio?.projects || [])]
                              copy[i].link = e.target.value
                              setPortfolio((prev) => ({ ...prev!, projects: copy }))
                            }}
                        />
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                                setPortfolio((prev) => ({
                                  ...prev!,
                                  projects: (prev?.projects || []).filter((_, idx) => idx !== i),
                                }))
                            }
                        >
                          Remove
                        </Button>
                      </div>
                  ))}
                  <Button
                      onClick={() =>
                          setPortfolio((prev) => ({
                            ...prev!,
                            projects: [...(prev?.projects || []), { title: "", description: "", link: "" }],
                          }))
                      }
                  >
                    + Add Project
                  </Button>
                </div>
            ) : portfolio?.projects?.length ? (
                portfolio.projects.map((proj, i) => (
                    <div key={i} className="mb-4">
                      <p className="font-semibold">{proj.title}</p>
                      <p className="text-sm">{proj.description}</p>
                      {proj.link && (
                          <a href={proj.link} target="_blank" className="text-primary underline">
                            View Project
                          </a>
                      )}
                    </div>
                ))
            ) : (
                <p className="text-muted-foreground">No projects yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle>Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
                <div className="space-y-3">
                  {(portfolio?.certifications || []).map((cert, i) => (
                      <div key={i} className="space-y-2 border p-3 rounded-xl">
                        <Input
                            placeholder="Name"
                            value={cert.name || ""}
                            onChange={(e) => {
                              const copy = [...(portfolio?.certifications || [])]
                              copy[i].name = e.target.value
                              setPortfolio((prev) => ({ ...prev!, certifications: copy }))
                            }}
                        />
                        <Input
                            placeholder="Authority"
                            value={cert.authority || ""}
                            onChange={(e) => {
                              const copy = [...(portfolio?.certifications || [])]
                              copy[i].authority = e.target.value
                              setPortfolio((prev) => ({ ...prev!, certifications: copy }))
                            }}
                        />
                        <Input
                            placeholder="Issued At (YYYY-MM-DD)"
                            value={cert.issuedAt || ""}
                            onChange={(e) => {
                              const copy = [...(portfolio?.certifications || [])]
                              copy[i].issuedAt = e.target.value
                              setPortfolio((prev) => ({ ...prev!, certifications: copy }))
                            }}
                        />
                        <Input
                            placeholder="Expires At (optional)"
                            value={cert.expiresAt || ""}
                            onChange={(e) => {
                              const copy = [...(portfolio?.certifications || [])]
                              copy[i].expiresAt = e.target.value
                              setPortfolio((prev) => ({ ...prev!, certifications: copy }))
                            }}
                        />
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                                setPortfolio((prev) => ({
                                  ...prev!,
                                  certifications: (prev?.certifications || []).filter((_, idx) => idx !== i),
                                }))
                            }
                        >
                          Remove
                        </Button>
                      </div>
                  ))}
                  <Button
                      onClick={() =>
                          setPortfolio((prev) => ({
                            ...prev!,
                            certifications: [...(prev?.certifications || []), { name: "", authority: "", issuedAt: "", expiresAt: "" }],
                          }))
                      }
                  >
                    + Add Certification
                  </Button>
                </div>
            ) : portfolio?.certifications?.length ? (
                portfolio.certifications.map((cert, i) => (
                    <div key={i} className="mb-3">
                      <p className="font-medium">{cert.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {cert.authority} — Issued {cert.issuedAt}
                        {cert.expiresAt ? ` (Expires: ${cert.expiresAt})` : ""}
                      </p>
                    </div>
                ))
            ) : (
                <p className="text-muted-foreground">No certifications yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Links */}
        <Card className="rounded-3xl border-2">
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
                <div className="space-y-2">
                  <Input
                      placeholder="LinkedIn"
                      value={portfolio?.linkedin || ""}
                      onChange={(e) => setPortfolio((prev) => ({ ...prev!, linkedin: e.target.value }))}
                  />
                  <Input
                      placeholder="GitHub"
                      value={portfolio?.github || ""}
                      onChange={(e) => setPortfolio((prev) => ({ ...prev!, github: e.target.value }))}
                  />
                  <Input
                      placeholder="Portfolio Website"
                      value={portfolio?.portfolioUrl || ""}
                      onChange={(e) => setPortfolio((prev) => ({ ...prev!, portfolioUrl: e.target.value }))}
                  />
                </div>
            ) : (
                <div className="space-y-2">
                  {portfolio?.linkedin && (
                      <a href={portfolio.linkedin} target="_blank" className="block text-primary underline">
                        LinkedIn
                      </a>
                  )}
                  {portfolio?.github && (
                      <a href={portfolio.github} target="_blank" className="block text-primary underline">
                        GitHub
                      </a>
                  )}
                  {portfolio?.portfolioUrl && (
                      <a href={portfolio.portfolioUrl} target="_blank" className="block text-primary underline">
                        Personal Website
                      </a>
                  )}
                  {!portfolio?.linkedin && !portfolio?.github && !portfolio?.portfolioUrl && (
                      <p className="text-muted-foreground">No links added yet.</p>
                  )}
                </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
  )
}





// "use client"
//
// import { motion } from "framer-motion"
// import { useEffect, useState } from "react"
// import { Download, Search, Star } from "lucide-react"
//
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Progress } from "@/components/ui/progress"
// import { apps } from "@/lib/dashboard-data"
// import { CardSkeleton } from "@/components/card-skeleton"
// import { HeroSkeleton } from "@/components/hero-skeleton"
//
// interface AppsTabContentProps {
//   userType: "Student" | "Company"
// }
//
// export function Portfolio({ userType }: AppsTabContentProps) {
//   const [isLoading, setIsLoading] = useState(true)
//   const newSectionTitle = userType === "Company" ? "New Releases" : "New Internships"
//   const allSectionTitle = userType === "Company" ? "All Apps" : "All Internships"
//
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setIsLoading(false)
//     }, 1800)
//
//     return () => clearTimeout(timer)
//   }, [])
//
//   if (isLoading) {
//     return (
//       <div className="space-y-8">
//         <HeroSkeleton />
//         <div className="flex flex-wrap gap-3 mb-6">
//           {Array.from({ length: 5 }).map((_, i) => (
//             <div key={i} className="h-10 w-24 bg-muted rounded-2xl animate-pulse" />
//           ))}
//           <div className="flex-1" />
//           <div className="h-10 w-48 bg-muted rounded-2xl animate-pulse" />
//         </div>
//         <section className="space-y-4">
//           <div className="h-8 w-48 bg-muted rounded animate-pulse" />
//           <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//             {Array.from({ length: 3 }).map((_, i) => (
//               <CardSkeleton key={i} />
//             ))}
//           </div>
//         </section>
//         <section className="space-y-4">
//           <div className="h-8 w-32 bg-muted rounded animate-pulse" />
//           <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//             {Array.from({ length: 8 }).map((_, i) => (
//               <CardSkeleton key={i} />
//             ))}
//           </div>
//         </section>
//       </div>
//     )
//   }
//
//   return (
//     <div className="space-y-8">
//       <section>
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           className="overflow-hidden rounded-3xl bg-gradient-to-r from-pink-600 via-red-600 to-orange-600 p-8 text-white"
//         >
//           <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
//             <div className="space-y-2">
//               <h2 className="text-3xl font-bold">Portfolio</h2>
//               <p className="max-w-[600px] text-white/80">
//                 Discover our full suite of professional design and creative applications.
//               </p>
//             </div>
//             <Button className="w-fit rounded-2xl bg-white text-red-700 hover:bg-white/90">
//               <Download className="mr-2 h-4 w-4" />
//               Install Desktop App
//             </Button>
//           </div>
//         </motion.div>
//       </section>
//
//       <div className="flex flex-wrap gap-3 mb-6">
//         <Button variant="outline" className="rounded-2xl bg-transparent">
//           All Categories
//         </Button>
//         <Button variant="outline" className="rounded-2xl bg-transparent">
//           Creative
//         </Button>
//         <Button variant="outline" className="rounded-2xl bg-transparent">
//           Video
//         </Button>
//         <Button variant="outline" className="rounded-2xl bg-transparent">
//           Web
//         </Button>
//         <Button variant="outline" className="rounded-2xl bg-transparent">
//           3D
//         </Button>
//         <div className="flex-1"></div>
//         <div className="relative w-full md:w-auto mt-3 md:mt-0">
//           <Search className="absolute left-3 top-3 h-4 w-4 text-foreground" />
//           <Input type="search" placeholder="Search apps..." className="w-full rounded-2xl pl-9 md:w-[200px]" />
//         </div>
//       </div>
//
//       <section className="space-y-4">
//         <h2 className="text-2xl font-semibold">{newSectionTitle}</h2>
//         <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//           {apps
//             .filter((app) => app.new)
//             .map((app) => (
//               <motion.div key={app.name} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
//                 <Card className="overflow-hidden rounded-3xl border-2 hover:border-primary/50 transition-all duration-300">
//                   <CardHeader className="pb-2">
//                     <div className="flex items-center justify-between">
//                       <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">{app.icon}</div>
//                       <Badge className="rounded-xl bg-amber-500">New</Badge>
//                     </div>
//                   </CardHeader>
//                   <CardContent className="pb-2">
//                     <CardTitle className="text-lg">{app.name}</CardTitle>
//                     <CardDescription>{app.description}</CardDescription>
//                     <div className="mt-2">
//                       <div className="flex items-center justify-between text-sm">
//                         <span>Installation</span>
//                         <span>{app.progress}%</span>
//                       </div>
//                       <Progress value={app.progress} className="h-2 mt-1 rounded-xl" />
//                     </div>
//                   </CardContent>
//                   <CardFooter>
//                     <Button variant="secondary" className="w-full rounded-2xl">
//                       {app.progress < 100 ? "Continue Install" : "Open"}
//                     </Button>
//                   </CardFooter>
//                 </Card>
//               </motion.div>
//             ))}
//         </div>
//       </section>
//
//       <section className="space-y-4">
//         <h2 className="text-2xl font-semibold">{allSectionTitle}</h2>
//         <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//           {apps.map((app) => (
//             <motion.div key={app.name} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
//               <Card className="overflow-hidden rounded-3xl border hover:border-primary/50 transition-all duration-300">
//                 <CardHeader className="pb-2">
//                   <div className="flex items-center justify-between">
//                     <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">{app.icon}</div>
//                     <Badge variant="outline" className="rounded-xl">
//                       {app.category}
//                     </Badge>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="pb-2">
//                   <CardTitle className="text-lg">{app.name}</CardTitle>
//                   <CardDescription>{app.description}</CardDescription>
//                 </CardContent>
//                 <CardFooter className="flex gap-2">
//                   <Button variant="secondary" className="flex-1 rounded-2xl">
//                     {app.progress < 100 ? "Install" : "Open"}
//                   </Button>
//                   <Button variant="outline" size="icon" className="rounded-2xl bg-transparent">
//                     <Star className="h-4 w-4" />
//                   </Button>
//                 </CardFooter>
//               </Card>
//             </motion.div>
//           ))}
//         </div>
//       </section>
//     </div>
//   )
// }
