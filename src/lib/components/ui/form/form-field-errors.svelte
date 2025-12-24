<script lang="ts">
  import * as FormPrimitive from 'formsnap';
  import { cn, type WithoutChild } from '$lib/utils';
  import i18n from '$lib/i18n';

  let {
    ref = $bindable(null),
    class: className,
    errorClasses,
    children: childrenProp,
    ...restProps
  }: WithoutChild<FormPrimitive.FieldErrorsProps> & {
    errorClasses?: string | undefined | null;
  } = $props();
</script>

<FormPrimitive.FieldErrors
  bind:ref
  class={cn('text-destructive text-sm font-medium', className)}
  {...restProps}
>
  {#snippet children({ errors, errorProps })}
    {#if childrenProp}
      {@render childrenProp({ errors, errorProps })}
    {:else}
      {#each errors as error (error)}
        <div {...errorProps} class={cn(errorClasses)}>{i18n.t(error as any)}</div>
      {/each}
    {/if}
  {/snippet}
</FormPrimitive.FieldErrors>
