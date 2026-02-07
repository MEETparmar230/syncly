import z from "zod";

export const registerSchema = z.object({
  name: z.string().min(2,{message:"Name must be at least 2 characters long"}),
  email: z.email({message:"Please enter a valid email address"}),
  password: z.string().min(6, {message:"Password must be at least 6 characters long"}),
});