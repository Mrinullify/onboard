import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Avatar from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { User, Mail, Calendar, ShieldCheck } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true, createdAt: true },
  });

  if (!user) {
    redirect("/sign-in");
  }

  const initials = user.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
    : "?";

  return (
    <div className="flex justify-center py-6 sm:py-12">
      <Card className="w-full max-w-lg border border-border/80 shadow-xs">
        <CardHeader className="flex flex-col items-center text-center pb-6 border-b border-border/60 bg-secondary/20">
          <Avatar
            src={user.image ?? undefined}
            fallback={initials}
            size="lg"
            className="h-20 w-20 border-2 border-border/80 shadow-2xs text-lg font-semibold text-primary"
          />
          <CardTitle className="mt-4 text-xl font-bold text-foreground">
            {user.name ?? "User"}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {user.email}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/60">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                <User className="h-4 w-4 text-muted-foreground/80" />
                <span>Full Name</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {user.name ?? "Not provided"}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/60">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                <Mail className="h-4 w-4 text-muted-foreground/80" />
                <span>Email Address</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {user.email}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/60">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground/80" />
                <span>Member Since</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {format(user.createdAt, "MMMM d, yyyy")}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Account Status</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
