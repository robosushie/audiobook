import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, Pressable } from 'react-native';

const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-full',
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/25 aria-invalid:ring-destructive/20 aria-invalid:border-destructive whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-4 disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-primary active:bg-primary/90',
          Platform.select({ web: 'hover:bg-primary/90' })
        ),
        destructive: cn(
          'bg-destructive active:bg-destructive/90',
          Platform.select({
            web: 'hover:bg-destructive/90 focus-visible:ring-destructive/20',
          })
        ),
        outline: cn(
          'border-border bg-card active:bg-muted border',
          Platform.select({
            web: 'hover:bg-muted',
          })
        ),
        secondary: cn(
          'bg-secondary active:bg-muted border border-border',
          Platform.select({ web: 'hover:bg-muted' })
        ),
        ghost: cn(
          'active:underline',
          Platform.select({ web: 'hover:underline underline-offset-4' })
        ),
        link: '',
      },
      size: {
        default: cn('h-10 px-6 py-3', Platform.select({ web: 'has-[>svg]:px-4' })),
        sm: cn('h-9 gap-1.5 px-4', Platform.select({ web: 'has-[>svg]:px-3' })),
        lg: cn('h-12 px-6', Platform.select({ web: 'has-[>svg]:px-4' })),
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn(
    'text-foreground text-sm font-medium',
    Platform.select({ web: 'pointer-events-none transition-colors' })
  ),
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        destructive: 'text-white',
        outline: 'text-foreground',
        secondary: 'text-secondary-foreground',
        ghost: 'text-foreground',
        link: cn(
          'text-primary group-active:underline',
          Platform.select({ web: 'underline-offset-4 hover:underline group-hover:underline' })
        ),
      },
      size: {
        default: '',
        sm: '',
        lg: '',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentProps<typeof Pressable> & React.RefAttributes<typeof Pressable> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size }), className)}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
