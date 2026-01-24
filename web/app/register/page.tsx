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
  const path = process.env.NEXT_PUBLIC_API!

  async function handleRegister() {
   console.log(path)
    try{

      const res = await axios.post(`${path}/auth/register`,{ name, email, password },{withCredentials:true})

      if(!res.data.success){
        throw new Error("Failed to Register")
      }

      toast.success("User Registered Successfully")
      router.push("/login")
    }catch(err){
      console.log(err)
      if(err instanceof AxiosError){
        toast.error( err.response?.data?.message || "Internal Server Error")
      }
      else{
        toast.error("Something went wrong")
      }
    }
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-80 space-y-3">
        <h1 className="text-xl font-bold">Register</h1>
        <input className="border p-2 w-full" placeholder="Name"
          onChange={e => setName(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Email"
          onChange={e => setEmail(e.target.value)} />
        <input className="border p-2 w-full" type="password"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)} />
        <button className="bg-black text-white w-full py-2"
          onClick={handleRegister}>
          Register
        </button>
      </div>
    </div>
  );
}
