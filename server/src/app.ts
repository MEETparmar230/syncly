import express from "express";
import authRoutes from "./routes/authRoute";
import chatRoutes from './routes/chatRoute'
import messageRoute from './routes/messageRoute'
import userRoute from './routes/userRoute'
import cors from 'cors'
import errorHandler from "./middlewares/errorHandler";
import cookieParser from 'cookie-parser'

const app = express();


app.use(
    cors({
        origin:"http://localhost:3000",
        credentials:true,
    })
)
app.use(express.json());
app.use(cookieParser())

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
