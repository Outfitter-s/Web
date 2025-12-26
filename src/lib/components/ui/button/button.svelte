<script lang="ts" module>
  import Spinner from '$lib/components/Spinner';
  import { cn, type WithElementRef } from '$lib/utils';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import { slide } from 'svelte/transition';
  import { type VariantProps, tv } from 'tailwind-variants';

  export const buttonVariants = tv({
    base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 relative overflow-hidden group/button",
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 disabled:background/50 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40',
        destructive:
          'bg-destructive shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white',
        outline:
          'bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        none: '',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  });

  export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
  export type ButtonSize = VariantProps<typeof buttonVariants>['size'];
  export type ButtonLoading = boolean;

  export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
    WithElementRef<HTMLAnchorAttributes> & {
      variant?: ButtonVariant;
      size?: ButtonSize;
      loading?: ButtonLoading;
      animatedText?: string;
    };
</script>

<script lang="ts">
  let {
    class: className,
    variant = 'default',
    size = 'default',
    ref = $bindable(null),
    href = undefined,
    type = 'button',
    disabled,
    loading,
    children,
    animatedText,
    ...restProps
  }: ButtonProps = $props();
</script>

{#snippet textRow(text: string, className?: string)}
  <span class={cn('z-10', className)}>
    {#each text.split('') as l, i}
      <span
        class="ease-elastic-out pointer-events-none inline-block leading-6 motion-safe:group-hover/button:animate-[text-appear_700ms_var(--ease-elastic-out)_forwards] motion-safe:group-active/button:animate-[text-appear_700ms_var(--ease-elastic-out)_forwards]"
        style="animation-delay: {i * 30}ms;">{@html l === ' ' ? '&nbsp;' : l}</span
      >
    {/each}
  </span>
{/snippet}

{#if href}
  <a
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    href={disabled ? undefined : href}
    aria-disabled={disabled}
    role={disabled ? 'link' : undefined}
    tabindex={disabled ? -1 : undefined}
    {...restProps}
  >
    {#if loading}
      <span class="h-5 w-8" transition:slide={{ duration: 300, axis: 'x' }}>
        <Spinner class="size-5" />
      </span>
    {/if}
    {#if animatedText}
      {@render textRow(animatedText, 'absolute -translate-y-[150%]')}
      {@render textRow(animatedText)}
    {:else}
      {@render children?.()}
    {/if}
  </a>
{:else}
  <button
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    {type}
    {disabled}
    {...restProps}
  >
    {#if loading}
      <span class="h-5 w-8" transition:slide={{ duration: 300, axis: 'x' }}>
        <Spinner class="size-5" />
      </span>
    {/if}
    {#if animatedText}
      {@render textRow(animatedText, 'absolute -translate-y-[150%]')}
      {@render textRow(animatedText)}
    {:else}
      {@render children?.()}
    {/if}
  </button>
{/if}

<style>
  @keyframes -global-text-appear {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(150%);
    }
  }
</style>
