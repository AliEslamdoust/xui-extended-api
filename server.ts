import express, { Request, Response, NextFunction, Express } from "express";
import bodyParser from "body-parser";
import logger from "./utils/logger";
import router from "./routes/main";
import { validateApiKey } from "./utils/securityUtils";

const PORT: number = Number(process.env.PORT) || 5594;

const app: Express = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  const API_KEY: string | undefined = req.headers.API_KEY as string;
  let compareKey: boolean = validateApiKey(API_KEY);

  if (!compareKey) {
    res.json({ ok: false, msg: "Invalid access code!" });
    return;
  }

  next();
});

app.use((err: any, res: Response) => {
  logger.error(err.stack);

  res
    .status(err.statusCode || 500)
    .json({ ok: false, msg: err.message || "An unexpected error has occured" });
});

app.use(bodyParser.json());
app.use(express.json());
app.use("", router);

app.listen(PORT, () => logger.info("server started on port", PORT));
