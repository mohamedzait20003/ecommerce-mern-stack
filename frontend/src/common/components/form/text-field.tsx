import { useId, type ComponentProps, type ComponentType, type ReactNode, type SVGProps } from "react"

import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@/common/components/ui/field"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/common/components/ui/input-group"
import { cn } from "@/lib/utils/utils"

export type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
    label: string
    /** Leading glyph. Decorative — the label carries the meaning. */
    icon?: ComponentType<SVGProps<SVGSVGElement>>
    /** Validation message. Its presence is what marks the field invalid. */
    error?: string
    /** Persistent guidance, shown whenever there is no error to show instead. */
    hint?: ReactNode
    /** Rendered at the end of the control, e.g. a reveal toggle. */
    trailing?: ReactNode
    className?: string
}

/** 48px: comfortably over the 44px touch minimum, and it reads as a real target. */
export const CONTROL_HEIGHT = "h-12 rounded-xl"

/**
 * One labelled text input.
 *
 * The label is always visible — a placeholder disappears the moment someone
 * starts typing, which is exactly when they most need to know what they are
 * typing. Hint and error share one slot below the control and are wired through
 * `aria-describedby`, so a screen reader hears the guidance, then the problem,
 * without either being announced twice.
 */
export function TextField({
    label,
    icon: Icon,
    error,
    hint,
    trailing,
    className,
    ...props
}: Readonly<TextFieldProps>) {
    const id = useId()
    const hintId = `${id}-hint`
    const errorId = `${id}-error`

    return (
        <Field data-invalid={error ? "true" : undefined}>
            <FieldLabel htmlFor={id} className="text-foreground">
                {label}
            </FieldLabel>

            <InputGroup className={cn(CONTROL_HEIGHT, className)}>
                {Icon && (
                    <InputGroupAddon>
                        <Icon aria-hidden="true" className="size-4.5" />
                    </InputGroupAddon>
                )}

                <InputGroupInput
                    id={id}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : hint ? hintId : undefined}
                    className="h-full"
                    {...props}
                />

                {trailing && (
                    <InputGroupAddon align="inline-end">{trailing}</InputGroupAddon>
                )}
            </InputGroup>

            {error ? (
                <FieldError id={errorId}>{error}</FieldError>
            ) : (
                hint && <FieldDescription id={hintId}>{hint}</FieldDescription>
            )}
        </Field>
    )
}
