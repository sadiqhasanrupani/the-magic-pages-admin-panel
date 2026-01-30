import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation";

import Loader from "./loader";
import { Button } from "./ui/button"
import { MouseEventHandler } from "react";
import Link from "next/link";

export type HeaderProps = {
  isSubmitting?: boolean;
  description?: string;
  title: string;
  buttonText?: string;
  showButton?: boolean;
  buttonOnClick?: MouseEventHandler<HTMLButtonElement>;
  buttonHref?: string;
}

export default function Header(props: HeaderProps) {
  const router = useRouter()

  const {
    isSubmitting,
    description,
    title,
    buttonText,
    showButton = false,
    buttonOnClick,
  } = props;

  return (
    <div className="w-full">
      {/* Header Actions */}
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="
              h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12
              rounded-full p-0
              flex items-center justify-center
              shrink-0
            "
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
          </Button>

          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              {title}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {description || "Add description here"}
            </p>
          </div>
        </div>
        {showButton && (
          props.buttonHref ? (
            <Link href={props.buttonHref}>
              <Button type="button">
                {buttonText}
              </Button>
            </Link>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={buttonOnClick}
            >
              {isSubmitting && (
                <Loader />
              )}
              {buttonText}
            </Button>
          )
        )}
      </div>
    </div>
  )
}
