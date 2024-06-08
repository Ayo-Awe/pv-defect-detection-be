import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import "./env";

const port = process.env.PORT || 8080;
app.listen(port, async () => {
  console.log(`Listening for requests on port ${port} ...`);
});
