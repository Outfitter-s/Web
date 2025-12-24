<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import FormWrapper from '../../formWrapper.svelte';
  import i18n from '$lib/i18n';
  import { SEO } from '$lib/components';
  import * as Form from '$lib/components/ui/form';
  import { superForm } from 'sveltekit-superforms';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import { formSchema } from './schema';
  import * as Alert from '$lib/components/ui/alert';
  import type { PageProps } from './$types';
  import { AlertCircle, Check } from '@lucide/svelte';

  let { data }: PageProps = $props();
  // svelte-ignore state_referenced_locally
  const form = superForm(data.form, {
    validators: zod4Client(formSchema),
    resetForm: false,
  });
  const { form: formData, enhance, submitting, message, allErrors } = form;
  $formData.token = data.token;
</script>

<SEO title="seo.auth.resetPassword.title" description="seo.auth.resetPassword.description" />

<FormWrapper reverse={true}>
  <div class="flex w-full flex-col space-y-8">
    <form action="?/resetPassword" method="POST" use:enhance class="flex w-full flex-col space-y-8">
      <input type="hidden" name="token" bind:value={$formData.token} />
      <img src="/logo.png" class="size-8 object-contain" alt="" />
      <h1 class="mb-2 text-2xl font-semibold">{i18n.t('auth.resetPassword.title')}</h1>
      <Form.Field {form} name="password">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{i18n.t('auth.password')}</Form.Label>
            <Input type="password" {...props} bind:value={$formData.password} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      <Form.Field {form} name="confirmPassword">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{i18n.t('auth.confirmPassword')}</Form.Label>
            <Input type="password" {...props} bind:value={$formData.confirmPassword} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

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

      <Button type="submit" loading={$submitting}>{i18n.t('auth.resetPassword.button')}</Button>
    </form>
  </div>
</FormWrapper>
