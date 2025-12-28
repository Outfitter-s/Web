<script lang="ts">
  import { SEO } from '$lib/components';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Input } from '$lib/components/ui/input';
  import i18n from '$lib/i18n';
  import FormWrapper from '../formWrapper.svelte';
  import type { PageProps } from './$types';
  import { resolve } from '$app/paths';
  import * as Form from '$lib/components/ui/form';
  import { superForm } from 'sveltekit-superforms';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import { formSchema } from './schema';
  import { Toaster } from '$lib/components/Toast/toast';
  import * as Alert from '$lib/components/ui/alert';
  import { AlertCircle, Check } from '@lucide/svelte';

  let { data }: PageProps = $props();
  // svelte-ignore state_referenced_locally
  const form = superForm(data.form, {
    validators: zod4Client(formSchema),
    resetForm: false,
    onResult: ({ result }) => {
      if (result.type === 'failure') Toaster.error(result.data.message);
    },
  });
  const { form: formData, enhance, submitting, message, allErrors } = form;
</script>

<SEO title="seo.auth.signUp.title" description="seo.auth.signUp.description" />

<FormWrapper>
  <form action="?/signUp" method="POST" class="flex w-full flex-col space-y-8" use:enhance>
    <img src="/logo.png" class="size-8 object-contain" alt="" />
    <h1 class="mb-2 text-2xl font-semibold">{i18n.t('auth.signIn.title')}</h1>
    <p class="text-muted-foreground text-base">
      {i18n.t('auth.signIn.alreadyHaveAnAccount.text')}
      <a href={resolve('/auth/log-in')} class="text-primary font-medium"
        >{i18n.t('auth.signIn.alreadyHaveAnAccount.cta')}</a
      >
    </p>
    <Form.Field {form} name="email">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>{i18n.t('auth.email')}</Form.Label>
          <Input {...props} bind:value={$formData.email} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
    <Form.Field {form} name="username">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>{i18n.t('auth.username')}</Form.Label>
          <Input {...props} bind:value={$formData.username} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
    <Form.Field {form} name="password">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>{i18n.t('auth.password')}</Form.Label>
          <Input type="password" {...props} bind:value={$formData.password} />
        {/snippet}
      </Form.Control>
      <Form.FieldErrors />
    </Form.Field>
    <div class="flex flex-row items-center justify-between">
      <Form.Field {form} name="rememberMe" class="flex flex-row items-center gap-1">
        <Form.Control>
          {#snippet children({ props })}
            <Checkbox {...props} bind:checked={$formData.rememberMe} />
            <Form.Label>{i18n.t('auth.rememberMe')}</Form.Label>
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      <a href={resolve('/auth/forgot-password')} class="text-primary text-sm font-medium"
        >{i18n.t('auth.forgotPasswordKeyword')}</a
      >
    </div>

    {#if $message}
      <Alert.Root variant={$allErrors.length > 0 ? 'destructive' : 'success'}>
        {#if $allErrors.length > 0}
          <AlertCircle />
        {:else}
          <Check />
        {/if}
        <Alert.Title>{i18n.t($message)}</Alert.Title>
      </Alert.Root>
    {/if}

    <Button type="submit" loading={$submitting}>{i18n.t('auth.submit')}</Button>
  </form>
</FormWrapper>
