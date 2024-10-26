"use client"; // This directive marks the file as a client component

import qs from "qs";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { gsap } from "gsap"; // Import GSAP

// Fetch team member data based on the slug
async function getTeamMember(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337";
  const path = "/api/team-members";
  const url = new URL(path, baseUrl);

  // Configure the query parameters with photo, photo1, description, and content fields
  url.search = qs.stringify({
    populate: {
      photo: {
        fields: ["alternativeText", "name", "url"],
      },
      photo1: {
        fields: ["alternativeText", "name", "url"],
      },
    },
    fields: ["name", "description", "content"], // Include content field
    filters: {
      slug: {
        $eq: slug, // Filters based on the slug
      },
    },
  });

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch team members");

  const data = await res.json();
  return data?.data[0];
}

// Define the UserProfile interface for TypeScript
interface UserProfile {
  id: number;
  name: string;
  description: string;
  content: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string | null;
  photo: {
    id: number;
    alternativeText: string;
    name: string;
    url: string;
  };
  photo1?: {
    id: number;
    alternativeText: string;
    name: string;
    url: string;
  };
}

// Main page component for team member detail with loading state
export default function TeamMemberDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params); // Unwrap params with `use`

  const [teamMember, setTeamMember] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Loading state
  const photoRef = useRef<HTMLDivElement | null>(null); // Reference for GSAP animation

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getTeamMember(slug);
        setTeamMember(data as UserProfile);
      } catch (error) {
        console.error("Error fetching team member:", error);
      } finally {
        setLoading(false); // Set loading to false after fetching data
      }
    }
    fetchData();
  }, [slug]);

  // GSAP Hover Animation Effect
  useEffect(() => {
    if (photoRef.current) {
      gsap.set(photoRef.current, { scale: 1 }); // Initial scale

      photoRef.current.addEventListener("mouseenter", () => {
        gsap.to(photoRef.current, { scale: 1.1, duration: 0.3, ease: "power1.inOut" });
      });

      photoRef.current.addEventListener("mouseleave", () => {
        gsap.to(photoRef.current, { scale: 1, duration: 0.3, ease: "power1.inOut" });
      });
    }
  }, [teamMember]);

  if (loading) return <p>Loading...</p>; // Display loading indicator

  if (!teamMember) return <p>No member found</p>; // Display message if no data

  // Construct the image URLs for photo and photo1
  const photoUrl = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337"}${teamMember.photo.url}`;
  const photo1Url = teamMember.photo1 
    ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:1337"}${teamMember.photo1.url}`
    : null;

  // Render the team member details
  return (
    <div className="bg-blue-500 min-h-screen p-4">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-2">{teamMember.name}</h1>
        <p className="text-gray-700 mb-4">{teamMember.description}</p>
        <p className="text-gray-700 mb-4">{teamMember.content}</p>
        
        {teamMember.photo && (
          <div ref={photoRef} className="overflow-hidden inline-block"> {/* Wrap image in a div for scaling */}
            <Image
              src={photoUrl}
              alt={teamMember.photo.alternativeText || "Team member photo"}
              width={500}
              height={500}
              className="w-48 h-48 rounded-lg mb-4"
            />
          </div>
        )}

        {teamMember.photo1 && (
          <Image
            src={photo1Url!}
            alt={teamMember.photo1.alternativeText || "Additional photo"}
            width={100}
            height={100}
            className="w-48 h-48 rounded-lg"
          />
        )}
      </div>
    </div>
  );
}
