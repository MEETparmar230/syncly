"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from 'axios'
import toast from "react-hot-toast";
import { useAuthContex } from "@/lib/auth-context";
import { loginSchema } from "@/zod/loginValidation";

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
  const [errors,setErrors] = useState<{
  email?: string;
  password?: string;}>({})

  async function handleLogin() {
    setErrors({})
    try {
      const result = loginSchema.safeParse({email,password})
      if(!result.success){
        const fieldErrors:{[key: string]: string} = {}
        result.error.issues.forEach(issue =>{
          const field = issue.path[0] as string;
          fieldErrors[field] = issue.message;
        })

        setErrors(fieldErrors)
        return
      }
      
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
      <div className="w-md space-y-5 border border-zinc-500 bg-zinc-900 p-6 rounded ">
        <h1 className="text-2xl font-bold">Login</h1>
        <div>
        <input
          className="border border-zinc-500  bg-zinc-800 outline-none focus:border-blue-500 p-2 w-full rounded "
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        <div>
        <input
          className="border bg-zinc-800 border-zinc-500 outline-none focus:border-blue-500 p-2 w-full rounded"
          type="password"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />
        {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>
        <button
          className="bg-blue-900 text-zinc-100 rounded hover:bg-blue-800 cursor-pointer w-full py-2"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}