"use client";

import {
  signOut,
  // useSession
} from "next-auth/react";

import { Button } from "components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { UserProfile } from "lib/types";
import { IconUser } from "components/ui/icons";
// import toast from "react-hot-toast";

export interface UserMenuProps {
  user: UserProfile;
}

export function getUserInitials(name: string) {
  const [firstName, lastName] = name.split(" ");
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2);
}

export function UserMenu({ user }: UserMenuProps) {
  // const { update, data: session } = useSession() as any;

  // async function upgradeUser() {
  //   if (user) {
  //     const res = await fetch(`/api/upgrade/?userId=${user.id}`, { method: "PATCH" });
  //     if (res.ok) {
  //       update({ role: "admin" });
  //       toast.success(
  //         "Your account has been upgraded! \nYou now have access to the Teams feature located in the sidemenu.",
  //         {
  //           duration: 8000,
  //         }
  //       );
  //     }
  //   }
  // }

  async function manageSubscription() {
    // router.push("/subscribe/manage-subscription");
    try {
      const response = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create billing portal session");
      }

      const data = await response.json();
      if (response.ok) {
        // @ts-ignore
        window.location.href = data.url; // Redirect user to the Stripe portal
      } else {
        // @ts-ignore
        throw new Error(data.message || "Failed to initiate billing portal session");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="link">
            <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full border border-foreground">
              <IconUser className="h-full w-full p-1" />
            </div>
            <span className="ml-2 hidden md:block">{user?.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start" className="bg-background text-foreground">
          <DropdownMenuItem className="flex-col items-start">
            <div className="text-xs font-medium">{user?.name}</div>
            <div className="text-xs">{user?.email}</div>
          </DropdownMenuItem>
          {user.isSubscribed && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => manageSubscription()} className="text-xs">
                Manage Subscription
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              signOut({
                callbackUrl: "/",
              })
            }
            className="text-xs"
          >
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
