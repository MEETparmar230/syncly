"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const path = process.env.NEXT_PUBLIC_API!;
  const [isTakenName, setIsTakenName] = useState<boolean>(false);
  const [isTakenEmial, setIsTakenEmail] = useState<boolean>(false);

  async function handleRegister() {
    setIsTakenEmail(false);
    setIsTakenName(false);
    try {
      const res = await axios.post(
        `${path}/auth/register`,
        { name, email, password },
        { withCredentials: true },
      );

      if (!res.data.success) {
        throw new Error("Failed to Register");
      }

      toast.success("User Registered Successfully");
      router.push("/login");
    } catch (err) {
      console.log(err);
      if (err instanceof AxiosError) {
        if(err.response?.data?.message ===  "Name and Email both already exists"){
          setIsTakenEmail(true)
          setIsTakenName(true)
        }
        else if (err.response?.data?.message === "UserName is Taken")
          setIsTakenName(true);
        else if (err.response?.data?.message === "Email already exists")
          setIsTakenEmail(true);
        else {
          toast.error(err.response?.data?.message || "Internal Server Error");
        }
      } else {
        toast.error("Something went wrong");
      }
    }
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-80 space-y-3">
        <h1 className="text-xl font-bold">Register</h1>
        <div>
          <input
            className={`border p-2 w-full ${isTakenName && "border-red-500 animate-pulse"}`}
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
          />
          {isTakenName && (
            <p className="text-sm text-red-300 animate-pulse">
              username is taken
            </p>
          )}
        </div>

        <div>
          <input
            className={`border p-2 w-full ${isTakenEmial && "border-red-500 animate-pulse"}`}
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          {isTakenEmial && (
            <p className="text-sm text-red-300 animate-pulse">
              email already exists
            </p>
          )}
        </div>
        <input
          className="border p-2 w-full"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="bg-black text-white w-full py-2"
          onClick={handleRegister}
        >
          Register
        </button>
      </div>
    </div>
  );
}
