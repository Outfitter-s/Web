<script lang="ts">
  import { Toaster } from '$lib/components/Toast/toast';
  import { enhance } from '$app/forms';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import FormWrapper from '../../formWrapper.svelte';
  import i18n from '$lib/i18n';
  import { Label } from '$lib/components/ui/label';

  let { form, data } = $props();
  let loading = $state(false);

  $effect(() => {
    if (form?.action === 'resetPassword') {
      if (form?.error) {
        Toaster.error(form.message);
      } else if (form?.success) {
        Toaster.success(form.message, {
          actions: [
            { type: 'link', href: '/auth/log-in', label: 'auth.resetPassword.successAction' },
          ],
        });
      }
    }
  });
</script>

<FormWrapper reverse={true}>
  <div class="flex w-full flex-col space-y-8">
    <form
      action="?/resetPassword"
      method="POST"
      use:enhance={(e) => {
        loading = true;
        e.formData.append('token', data.token);
        return async ({ update }) => {
          await update({ reset: false });
          loading = false;
        };
      }}
      class="flex w-full flex-col space-y-8"
    >
      <img src="/logo.png" class="size-8 object-contain" alt="" />
      <h1 class="mb-2 text-2xl font-semibold">{i18n.t('auth.resetPassword.title')}</h1>
      <div class="space-y-2">
        <Label for="email">{i18n.t('auth.password')}</Label>
        <Input name="password" type="password" />
      </div>
      <div class="space-y-2">
        <Label for="email">{i18n.t('auth.confirmPassword')}</Label>
        <Input name="confirmPassword" type="password" />
      </div>
      <Button type="submit" {loading}>{i18n.t('auth.resetPassword.button')}</Button>
    </form>
  </div>
</FormWrapper>
