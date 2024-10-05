import { Metadata } from "next"
import Link from "next/link"
import { auth } from "@acme/auth"
import { Course, Lecture } from "@prisma/client"

import { env } from "@/env"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { EmptyPlaceholder } from "@/components/empty-placeholder"
import { DashboardHeader } from "@/components/header"
import { Icons } from "@/components/icons"
import { LectureItem } from "@/components/lecture-item"
import { DashboardShell } from "@/components/shell"

const title = "Lectures"
const description = "View and manage your lectures."

export async function generateMetadata(): Promise<Metadata> {
  const ogUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}/api/og`)
  ogUrl.searchParams.set("heading", "Your Lectures")
  ogUrl.searchParams.set("type", "Course")
  ogUrl.searchParams.set("mode", "light")

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "/dashboard/lectures",
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: "Your Lectures",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl.toString()],
    },
  }
}

export default async function LecturesPage() {
  const session = await auth()
  const user = await db.user.findUnique({
    where: { id: session?.user.id },
    include: {
      lectures: {
        select: {
          id: true,
          type: true,
          title: true,
          updatedAt: true,
          course: true,
        },
        orderBy: { createdAt: "desc" },
      },
      courses: true,
    },
  })

  return (
    <DashboardShell>
      <DashboardHeader heading={title} text={description}>
        <div className="flex items-center space-x-6">
          <Link href="/lecture">
            <Button variant="secondary" size="sm">
              <Icons.add className="mr-2 h-4 w-4" />
              New lecture
            </Button>
          </Link>
        </div>
      </DashboardHeader>
      <div>
        {user?.lectures?.length ? (
          <div className="divide-y divide-border rounded-md border">
            {user?.lectures.map((lecture) => (
              <LectureItem
                key={lecture.id}
                lecture={lecture as Lecture & { course?: Course }}
                courses={user?.courses}
              />
            ))}
          </div>
        ) : (
          <EmptyPlaceholder>
            <EmptyPlaceholder.Icon name="messageSquareText" />
            <EmptyPlaceholder.Title>No lectures</EmptyPlaceholder.Title>
            <EmptyPlaceholder.Description>
              You don&apos;t have any lectures yet. Click the button below to
              create your first lecture.
            </EmptyPlaceholder.Description>
            <Link href="/lecture">
              <Button>
                <Icons.add className="mr-2 h-4 w-4" />
                New lecture
              </Button>
            </Link>
          </EmptyPlaceholder>
        )}
      </div>
    </DashboardShell>
  )
}
