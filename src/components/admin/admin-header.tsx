import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { SidebarTrigger } from "../ui/sidebar";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="md:hidden"/>
      <div className="flex flex-1 items-center justify-end space-x-2">
        <Button variant="ghost" asChild>
          <Link href="/">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Link>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}