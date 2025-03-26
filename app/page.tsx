import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserRoundPlus, ClipboardCheck, Building2, Users } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <ClipboardCheck className="h-6 w-6" />
              <span className="font-bold">MedTrack</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Medical Intern Attendance Tracking
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Simplify attendance tracking for medical interns across multiple hospitals
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link href="/register">
                  <Button size="lg">Get Started</Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader>
                  <UserRoundPlus className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Easy Registration</CardTitle>
                  <CardDescription>Simple onboarding for students and faculty members</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Quick registration process with role-based access control for students, faculty members, and
                    administrators.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Building2 className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Multiple Hospitals</CardTitle>
                  <CardDescription>Track attendance across different hospital locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Support for multiple hospitals with location-based verification to ensure accurate attendance
                    records.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Faculty Verification</CardTitle>
                  <CardDescription>Attendance verified by faculty members</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Faculty members can verify student attendance, ensuring accountability and accurate record-keeping.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2024 MedTrack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

