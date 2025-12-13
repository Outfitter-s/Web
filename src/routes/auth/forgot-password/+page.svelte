<script lang="ts">
  import { Toaster } from '$lib/components/Toast/toast';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import FormWrapper from '../formWrapper.svelte';
  import i18n from '$lib/i18n';
  import { Label } from '$lib/components/ui/label';

  let { form } = $props();
  let loading = $state(false);

  $effect(() => {
    if (form?.action === 'resetPassword') {
      if (form?.error) {
        Toaster.error(form.message);
      } else if (form?.success) {
        Toaster.success(form.message);
      }
    }
  });
</script>

<FormWrapper reverse={true} back="/auth/log-in">
  <div class="flex w-full flex-col space-y-8">
    <form
      action="?/resetPassword"
      method="POST"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          await update({ reset: false });
          loading = false;
        };
      }}
      class="flex w-full flex-col space-y-8"
    >
      <img src="/logo.png" class="size-8 object-contain" alt="" />
      <h1 class="text-2xl font-semibold">{i18n.t('auth.forgotPassword.title')}</h1>
      <div class="space-y-2">
        <Label for="email">{i18n.t('auth.email')}</Label>
        <Input name="email" />
      </div>
      <Button type="submit" {loading}>{i18n.t('auth.forgotPassword.button')}</Button>
    </form>
  </div>
</FormWrapper>
