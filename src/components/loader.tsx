import { Loader2, type LucideProps } from "lucide-react"
import { cn } from "@/lib/utils"

export type LoaderProps = LucideProps

function Loader({ className, ...props }: LoaderProps) {
  return (
    <Loader2
      className={cn("mr-2 h-4 w-4 animate-spin", className)}
      {...props}
    />
  )
}

export default Loader
