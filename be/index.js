import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();



const PORT = 3000

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})