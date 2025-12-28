<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import FormWrapper from '../formWrapper.svelte';
  import i18n from '$lib/i18n';
  import { SEO } from '$lib/components';
  import * as Form from '$lib/components/ui/form';
  import { superForm } from 'sveltekit-superforms';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import { formSchema } from './schema';
  import type { PageProps } from './$types';
  import { Toaster } from '$lib/components/Toast/toast';
  import * as Alert from '$lib/components/ui/alert';
  import { AlertCircle, Check } from '@lucide/svelte';

  let { data }: PageProps = $props();
  // svelte-ignore state_referenced_locally
  const form = superForm(data.form, {
    validators: zod4Client(formSchema),
    resetForm: false,
    onUpdated: ({ form }) => {
      if (form.valid) {
        Toaster.success(form.message);
      }
    },
  });
  const { form: formData, enhance, submitting, message, allErrors } = form;
</script>

<SEO title="seo.auth.forgotPassword.title" description="seo.auth.forgotPassword.description" />

<FormWrapper reverse={true} back="/auth/log-in">
  <div class="flex w-full flex-col space-y-8">
    <form action="?/resetPassword" method="POST" use:enhance class="flex w-full flex-col space-y-8">
      <img src="/logo.png" class="size-8 object-contain" alt="" />
      <h1 class="text-2xl font-semibold">{i18n.t('auth.forgotPassword.title')}</h1>
      <Form.Field {form} name="email">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{i18n.t('auth.email')}</Form.Label>
            <Input {...props} bind:value={$formData.email} />
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
      <Button type="submit" loading={$submitting}>{i18n.t('auth.forgotPassword.button')}</Button>
    </form>
  </div>
</FormWrapper>
