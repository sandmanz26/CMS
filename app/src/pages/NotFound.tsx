import { Link } from "react-router-dom"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-md place-items-center gap-3 py-20 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-muted"><Compass className="size-5" /></div>
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">This address doesn't exist or has moved. Use the dock below or go back to the dashboard.</p>
      <Button render={<Link to="/" />}>Back to Dashboard</Button>
    </div>
  )
}
