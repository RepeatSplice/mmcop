import type { Request, Response, NextFunction } from "express"
import { config } from "../config.js"

export function requireInternalAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || ""
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : ""
  if (!token || token !== config.internalSecret()) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  next()
}
