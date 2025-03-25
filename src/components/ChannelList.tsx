"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface Channel {
  id: string;
  name: string;
  description: string | null;
  owner: {
    id: string;
    name: string;
    image: string;
  };
  members: {
    id: string;
    name: string;
    image: string;
  }[];
  _count?: {
    games: number;
  };
}

export default function ChannelList() {
  const { data: session } = useSession();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await fetch("/api/channels");
      if (response.ok) {
        const data = await response.json();
        setChannels(data);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
    } finally {
      setLoading(false);
    }
  };

  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          name: newChannelName,
          description: newChannelDescription || null,
        }),
      });

      if (response.ok) {
        const newChannel = await response.json();
        setChannels([newChannel, ...channels]);
        setNewChannelName("");
        setNewChannelDescription("");
      }
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  const joinChannel = async (channelId: string) => {
    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "JOIN",
          channelId,
        }),
      });

      if (response.ok) {
        await fetchChannels(); // Refresh the list
      }
    } catch (error) {
      console.error("Error joining channel:", error);
    }
  };

  const leaveChannel = async (channelId: string) => {
    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LEAVE",
          channelId,
        }),
      });

      if (response.ok) {
        await fetchChannels(); // Refresh the list
      }
    } catch (error) {
      console.error("Error leaving channel:", error);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Game Channels</h2>

      <form onSubmit={createChannel} className="mb-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="channelName"
              className="block text-sm font-medium text-gray-700"
            >
              Channel Name
            </label>
            <input
              type="text"
              id="channelName"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="channelDescription"
              className="block text-sm font-medium text-gray-700"
            >
              Description (optional)
            </label>
            <textarea
              id="channelDescription"
              value={newChannelDescription}
              onChange={(e) => setNewChannelDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Channel
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-4">Loading channels...</div>
      ) : (
        <div className="space-y-4">
          {channels.map((channel) => {
            const isMember = channel.members.some(
              (m) => m.id === session.user?.id
            );
            const isOwner = channel.owner.id === session.user?.id;

            return (
              <div key={channel.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{channel.name}</h3>
                    {channel.description && (
                      <p className="text-gray-600 text-sm mt-1">
                        {channel.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Image
                        src={channel.owner.image || "/user-placeholder.png"}
                        alt={channel.owner.name || "Channel owner"}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <span className="text-sm text-gray-600">
                        Created by {channel.owner.name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {channel._count?.games || 0} games played •{" "}
                      {channel.members.length} members
                    </div>
                  </div>
                  {!isOwner && (
                    <button
                      onClick={() =>
                        isMember
                          ? leaveChannel(channel.id)
                          : joinChannel(channel.id)
                      }
                      className={`${
                        isMember
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      } px-4 py-2 rounded-md text-sm font-medium`}
                    >
                      {isMember ? "Leave" : "Join"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
