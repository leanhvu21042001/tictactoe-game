"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PusherClient from "pusher-js";
import { toast } from "sonner";
import UserPopover from "./UserPopover";

interface Friend {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface FriendRequest {
  id: string;
  fromUser: Friend;
}

export default function FriendsList() {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    if (session?.user) {
      fetchFriends();
      fetchRequests();
      setupPusher();
    }
  }, [session]);

  const setupPusher = () => {
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || "", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",
    });

    const channel = pusher.subscribe(`user-${session?.user?.id}`);
    channel.bind("friend-request", (data: any) => {
      switch (data.type) {
        case "NEW_REQUEST":
          setRequests((prev) => [...prev, data.request]);
          toast.info(`New friend request from ${data.request.from.name}`);
          break;
        case "REQUEST_ACCEPTED":
          toast.success("Friend request accepted!");
          fetchFriends();
          break;
        case "REQUEST_REJECTED":
          toast.error("Friend request rejected");
          break;
      }
    });

    return () => {
      pusher.unsubscribe(`user-${session?.user?.id}`);
    };
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch("/api/friends");
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/friends?requestsOnly=true");
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const addFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setSearchError("");

    try {
      const searchResponse = await fetch(
        `/api/friends/search?email=${encodeURIComponent(searchEmail)}`
      );
      if (!searchResponse.ok) {
        throw new Error("User not found");
      }
      const user = await searchResponse.json();

      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_REQUEST",
          friendId: user.id,
        }),
      });

      if (response.ok) {
        toast.success("Friend request sent!");
        setSearchEmail("");
      }
    } catch (error) {
      setSearchError("User not found or already added");
      console.error("Error adding friend:", error);
    }
  };

  const handleRequest = async (
    requestId: string,
    action: "ACCEPT_REQUEST" | "REJECT_REQUEST"
  ) => {
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          friendId: requestId,
        }),
      });

      if (response.ok) {
        setRequests((prev) => prev.filter((req) => req.id !== requestId));
        if (action === "ACCEPT_REQUEST") {
          fetchFriends();
        }
      }
    } catch (error) {
      console.error("Error handling request:", error);
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REMOVE",
          friendId,
        }),
      });

      if (response.ok) {
        await fetchFriends();
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Friends</h2>

      <form onSubmit={addFriend} className="mb-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="friendEmail"
              className="block text-sm font-medium text-gray-700"
            >
              Add Friend by Email
            </label>
            <input
              type="email"
              id="friendEmail"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="friend@example.com"
              required
            />
            {searchError && (
              <p className="mt-1 text-sm text-red-600">{searchError}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Send Friend Request
          </button>
        </div>
      </form>

      {requests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Friend Requests</h3>
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <UserPopover user={request.fromUser}>
                    <div className="cursor-pointer">
                      <img
                        src={request.fromUser.image || "/user-placeholder.png"}
                        alt={request.fromUser.name || "User"}
                        className="w-10 h-10 rounded-full"
                      />
                    </div>
                  </UserPopover>
                  <div>
                    <p className="font-medium">{request.fromUser.name}</p>
                    <p className="text-sm text-gray-500">
                      {request.fromUser.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRequest(request.id, "ACCEPT_REQUEST")}
                    className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-green-200"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRequest(request.id, "REJECT_REQUEST")}
                    className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-200"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading friends...</div>
      ) : (
        <div className="space-y-4">
          {friends.length === 0 ? (
            <p className="text-gray-500 text-center">No friends added yet</p>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between border rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <UserPopover user={friend}>
                    <div className="cursor-pointer">
                      <img
                        src={friend.image || "/user-placeholder.png"}
                        alt={friend.name || "Friend"}
                        className="w-10 h-10 rounded-full"
                      />
                    </div>
                  </UserPopover>
                  <div>
                    <h3 className="font-medium">{friend.name}</h3>
                    <p className="text-sm text-gray-500">{friend.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => removeFriend(friend.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
