"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../../components/ui/Button";
import { Heading, MainText, SubText } from "../../components/ui/Text";
import {Container} from "../../components/ui/Container";
import "../../style.css"
import { RoundedContainer } from "../../components/ui/RContainer";

export default function FriendsPage() {
  const { username } = useParams();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!username) return;

    const fetchFriends = async () => {
      try {
        const response = await fetch(`/api/friends/${username}`);
        const data = await response.json();

        if (response.ok) {
          // Map usernames to objects so .username works in JSX
          const formattedFriends = data.friends.map((friendUsername) => ({
            username: friendUsername,
          }));
          setFriends(formattedFriends);
        } else {
          setError(data.error || "Failed to fetch friends.");
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
        setError("An error occurred while fetching friends.");
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [username]);

  const handleRemoveFriend = async (friendUsername) => {
    try {
      const response = await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          friendUsername,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Friend removed successfully!");
        // Remove friend from UI immediately
        setFriends(friends.filter((friend) => friend.username !== friendUsername));
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error removing friend:", error);
      setMessage("Failed to remove friend.");
    }
  };

  if (loading) return <div>Loading friends...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <Container fullScreen>
    <div className="p-4">
      <Heading className="text-2xl font-bold mb-4">{username}'s Friends</Heading>

      {/* Show success or error messages */}
      {message && <p className="text-green-500 mb-2">{message}</p>}

      {friends.length === 0 ? (
        <p>No friends found.</p>
      ) : (
        <ul className="list-disc pl-5">
          {friends.map((friend) => (
            <li
              key={friend.username}
              className="mb-2 flex justify-between items-center"
            >
              {friend.username}
              <button
                onClick={() => handleRemoveFriend(friend.username)}
                className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-700"
              >
                Remove Friend
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link href={`/${username}/stats`} className="text-blue-500 mt-4 block">
        <Button>
          Back to Stats
        </Button>
      </Link>
    </div>
    </Container>
  );
}
