"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { set } from "zod";
import { registerSchema } from "@/zod/registerValidation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const path = process.env.NEXT_PUBLIC_API!;
  const [isTakenName, setIsTakenName] = useState<boolean>(false);
  const [isTakenEmail, setIsTakenEmail] = useState<boolean>(false);
  const [errors,setErrors] = useState<{
  name?:string
  email?: string;
  password?: string;}>({})

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setIsTakenEmail(false);
    setIsTakenName(false);
    setErrors({})
    try {

      const result = registerSchema.safeParse({name,email,password})

      if(!result.success){
        const fieldErrors:{[key:string]:string} = {}

        result.error.issues.forEach(issue=>{
          const field = issue.path[0] as string
          fieldErrors[field] = issue.message
        })
        setErrors(fieldErrors)
        return
      }

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
      <form onSubmit={(e)=>handleRegister(e)} className="w-md space-y-5 border border-zinc-500 bg-zinc-900 p-6 rounded ">
        <h1 className="text-2xl font-bold">Register</h1>
        <div>
          <input
            className={`border border-zinc-500  bg-zinc-800 outline-none focus:border-blue-500 p-2 w-full rounded  ${isTakenName && "border-red-500 animate-pulse"}`}
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
          />
          {isTakenName && (
            <p className="text-sm text-red-400 animate-pulse">
              username is taken
            </p>
          )}
          {errors.name && (
            <p className="text-sm text-red-400 animate-pulse">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <input
            className={`border border-zinc-500  bg-zinc-800 outline-none focus:border-blue-500 p-2 w-full rounded  ${isTakenEmail && "border-red-500 animate-pulse"}`}
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          {isTakenEmail && (
            <p className="text-sm text-red-400 animate-pulse">
              email already exists
            </p>
          )}
          {errors.email && (
            <p className="text-sm text-red-400 animate-pulse">
              {errors.email}
            </p>
          )}
        </div>
        <div>
        <input
          className="border border-zinc-500  bg-zinc-800 outline-none focus:border-blue-500 p-2 w-full rounded "
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && (
            <p className="text-sm text-red-400 animate-pulse">
              {errors.password}
            </p>
          )}
        </div>
        <button
          className="bg-blue-900 text-zinc-100 rounded hover:bg-blue-800 cursor-pointer w-full py-2"
        >
          Register
        </button>
      </form>
    </div>
  );
}
