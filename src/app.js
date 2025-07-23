import express from "express"
import cors from "cors"//middleware- Cross-Origin Resource Sharing
import cookieParser from "cookie-parser"


const app = express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// Importing routes

import  userRouter from "./routes/user.routes.js"

//routes declaration
app.use("/api/v1/users", userRouter)




export { app }