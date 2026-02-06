"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from 'axios'
import toast from "react-hot-toast";
import { useAuthContex } from "@/lib/auth-context";

type LoginResponse = {
  success?: boolean,
  message?: string,
  token?:string
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const path = process.env.NEXT_PUBLIC_API!
  const {setIsLoggedIn} = useAuthContex()

  async function handleLogin() {
    try {
      const res = await axios.post<LoginResponse>(
        `${path}/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      if (res.data.success) {
        
      sessionStorage.setItem("socket-token",res.data?.token as string)
      toast.success("Login successful");
      setIsLoggedIn(true)
      router.push("/");

      }
      
    }
    catch (err) {
      
      if (axios.isAxiosError(err)) {
        console.log("RESPONSE:", err?.response);
    console.log("DATA:", err?.response?.data);
        toast.error(err.response?.data?.message || "Invalid credentials");
      } 
      else if (err instanceof Error){

        toast.error(err.message);
      }
      else{
        toast.error("Something went wrong")
      }
    }
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-80 space-y-3">
        <h1 className="text-xl font-bold">Login</h1>
        <input
          className="border p-2 w-full"
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="border p-2 w-full"
          type="password"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />
        <button
          className="bg-black text-white w-full py-2"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}