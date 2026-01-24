import express from "express";
import authRoutes from "./routes/authRoute";
import chatRoutes from './routes/chatRoute'
import messageRoute from './routes/messageRoute'
import userRoute from './routes/userRoute'
import cors from 'cors'
import errorHandler from "./middlewares/errorHandler";
import cookieParser from 'cookie-parser'


const app = express();
const frontEnd = process.env.FRONT_END!

app.use(
    cors({
        origin:[frontEnd,"http://localhost:3000"],
        credentials:true,
    })
)
app.use(express.json());
app.use(cookieParser())

app.get("/health" , (req,res)=>{
    res.send("Server is running")
})

// AUTH route
app.use("/api/auth", authRoutes);


// Chat 
app.use("/api/chats",chatRoutes)


// Messages
app.use("/api/messages", messageRoute)

// USERS
app.use("/api/users", userRoute);

//Error Handling
app.use(errorHandler);

export default app;
