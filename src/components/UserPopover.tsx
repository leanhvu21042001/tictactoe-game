import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import Image from "next/image";

interface UserPopoverProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  children: React.ReactNode;
}

export default function UserPopover({ user, children }: UserPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="rounded-lg p-4 bg-white shadow-lg border w-64 z-50"
          sideOffset={5}
        >
          <div className="flex flex-col items-center gap-3">
            <Image
              src={user.image || "/user-placeholder.png"}
              alt={user.name || "User"}
              width={64}
              height={64}
              className="rounded-full"
            />
            <div className="text-center">
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
